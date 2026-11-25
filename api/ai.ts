import crypto from 'node:crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

type AiAction = 'chat' | 'soap' | 'embed' | 'vision' | 'nearby_care';

interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

// Per-user sliding window rate limiter: 30 requests per 60 seconds
// Uses Upstash Redis REST API when UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN are set;
// falls back to an in-memory map ONLY when persistent Redis env vars are unset.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
export const MAX_VISION_BASE64_LENGTH = 4_200_000;
const fallbackRateLimitBuckets = new Map<string, number[]>();

export function resetFallbackRateLimiterForTests(): void {
  fallbackRateLimitBuckets.clear();
}

function checkInMemoryRateLimit(userId: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (fallbackRateLimitBuckets.get(userId) || []).filter((ts) => ts > windowStart);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = recent[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000));
    fallbackRateLimitBuckets.set(userId, recent);
    return { allowed: false, retryAfterSec };
  }

  recent.push(now);
  fallbackRateLimitBuckets.set(userId, recent);
  return { allowed: true, retryAfterSec: 0 };
}

async function checkUpstashRateLimit(
  userId: string,
  redisUrl: string,
  redisToken: string
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const baseUrl = redisUrl.replace(/\/+$/, '');
  const parsedUrl = new URL(baseUrl);
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('UPSTASH_REDIS_REST_URL must use https or http protocol.');
  }

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const key = `healyaar:rl:ai:${userId}`;
  const member = `${now}-${crypto.randomUUID()}`;

  const pipelineCommands = [
    ['ZREMRANGEBYSCORE', key, '0', String(windowStart)],
    ['ZADD', key, String(now), member],
    ['ZCARD', key],
    ['PEXPIRE', key, String(RATE_LIMIT_WINDOW_MS)],
    ['ZRANGE', key, '0', '0', 'WITHSCORES']
  ];

  const response = await fetch(`${baseUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pipelineCommands)
  });

  if (!response.ok) {
    throw new Error(`Upstash Redis rate-limit check failed with HTTP ${response.status}.`);
  }

  const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  if (!Array.isArray(results) || results.length < 5) {
    throw new Error('Unexpected Upstash Redis pipeline response.');
  }

  const pipelineError = results.find((entry) => entry && typeof entry.error === 'string');
  if (pipelineError) {
    throw new Error(`Upstash Redis error: ${pipelineError.error}`);
  }

  const count = Number(results[2]?.result ?? 0);
  if (count > RATE_LIMIT_MAX_REQUESTS) {
    // Best-effort removal of rejected request so blocked retries do not extend the window
    void fetch(`${baseUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([['ZREM', key, member]])
    }).catch(() => {});

    const rangeResult = results[4]?.result;
    const oldestScore =
      Array.isArray(rangeResult) && rangeResult.length >= 2 ? Number(rangeResult[1]) : now;
    const oldest = Number.isFinite(oldestScore) ? oldestScore : now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true, retryAfterSec: 0 };
}

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (upstashUrl && upstashToken) {
    return checkUpstashRateLimit(userId, upstashUrl, upstashToken);
  }

  // Fallback to in-memory limiter ONLY when persistent Redis env vars are unset
  return checkInMemoryRateLimit(userId);
}

function getHeader(headers: ApiRequest['headers'], key: string): string | undefined {
  const value = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

async function authenticateSupabaseJwt(req: ApiRequest): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = getHeader(req.headers, 'authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authentication required. Missing Bearer token.', status: 401 };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || token.length < 20) {
    return { error: 'Invalid authentication token.', status: 401 };
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: 'Authentication service is not configured on the server.', status: 503 };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) {
      return { error: 'Unauthorized: invalid or expired session token.', status: 401 };
    }
    return { userId: data.user.id };
  } catch {
    return { error: 'Authentication verification failed.', status: 401 };
  }
}

function parseBody(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
}

function sanitizeBase64Payload(raw: string): string {
  const commaIdx = raw.indexOf(',');
  return commaIdx >= 0 ? raw.slice(commaIdx + 1) : raw;
}

export function sanitizeVisionFileName(raw: unknown): string {
  if (typeof raw !== 'string') return 'upload';
  const cleaned = raw
    .replace(/[^a-zA-Z0-9._\- ]/g, '')
    .replace(/ +/g, ' ')
    .trim()
    .slice(0, 80)
    .trim();
  return cleaned || 'upload';
}

export async function handleAiRequest(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  // 1. Authenticate Supabase JWT strictly on the server
  const auth = await authenticateSupabaseJwt(req);
  if ('error' in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  // 2. Per-user sliding window rate limit (persistent Upstash Redis or env-gated fallback)
  let rate: { allowed: boolean; retryAfterSec: number };
  try {
    rate = await checkRateLimit(auth.userId);
  } catch (err) {
    console.error('[api/ai] Persistent rate-limit check failed:', err);
    res.status(503).json({
      error: 'Rate-limiting service is temporarily unavailable. Please try again shortly.'
    });
    return;
  }
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfterSec));
    res.status(429).json({
      error: `Rate limit exceeded (max ${RATE_LIMIT_MAX_REQUESTS} requests/minute). Please retry in ${rate.retryAfterSec}s.`
    });
    return;
  }

  // 3. Validate action & initialize Gemini SDK server-side
  const body = parseBody(req.body);
  const action = body.action as AiAction | undefined;
  if (!action || !['chat', 'soap', 'embed', 'vision', 'nearby_care'].includes(action)) {
    res.status(400).json({ error: 'Invalid action. Expected chat, soap, embed, vision, or nearby_care.' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({ error: 'Gemini AI service key is not configured on the server.' });
    return;
  }

  try {
    // -------------------------------------------------------------------------
    // ACTION 1: CHAT / SOAP (Dual-Layer RAG + Clinician Copilot Mode)
    // -------------------------------------------------------------------------
    if (action === 'chat' || action === 'soap') {
      const query = typeof body.query === 'string' ? body.query.trim() : '';
      const personalContext = typeof body.personalContext === 'string' ? body.personalContext : '';
      const clinicalContext = typeof body.clinicalContext === 'string' ? body.clinicalContext : '';
      const queryParts = Array.isArray(body.queryParts)
        ? body.queryParts.filter((p): p is string => typeof p === 'string').slice(0, 4)
        : [query];

      if (!query || query.length > 4000) {
        res.status(400).json({ error: 'Query must be between 1 and 4000 characters.' });
        return;
      }

      if (action === 'soap') {
        const soapPrompt = `You are HealYaar Clinician Copilot, an evidence-grounded clinical documentation assistant.
Generate a structured, non-diagnostic SOAP note grounded ONLY in the retrieved patient vault records and clinical reference excerpts below.
Never fabricate lab numbers or prescriptions not present in the context.

PATIENT QUERY / CASE:
"${query}"

LAYER A (Patient Vault Records):
${personalContext || 'No prior records indexed in patient vault.'}

LAYER B (Verified Clinical Reference Excerpts):
${clinicalContext || 'General ICMR / WHO ambulatory clinical reference.'}`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: soapPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                markdownSummary: {
                  type: Type.STRING,
                  description: 'Concise clinician summary paragraph grounded in retrieved evidence.'
                },
                subjective: { type: Type.STRING },
                objective: { type: Type.STRING },
                assessment: { type: Type.STRING },
                plan: { type: Type.ARRAY, items: { type: Type.STRING } },
                differentials: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      condition: { type: Type.STRING },
                      likelihood: { type: Type.STRING },
                      rationale: { type: Type.STRING }
                    },
                    required: ['condition', 'likelihood', 'rationale']
                  }
                },
                uncertaintyMarkers: { type: Type.ARRAY, items: { type: Type.STRING } },
                drugInteractionWarnings: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: [
                'markdownSummary',
                'subjective',
                'objective',
                'assessment',
                'plan',
                'differentials',
                'uncertaintyMarkers',
                'drugInteractionWarnings'
              ]
            }
          }
        });

        const parsed = JSON.parse((response.text ?? '{}').trim());
        res.status(200).json({
          action: 'soap',
          poweredBy: 'Gemini 4 Hydrogen',
          model: 'gemini-4-hydrogen',
          text: parsed.markdownSummary || 'Structured Clinician Copilot SOAP summary generated.',
          soapNote: {
            subjective: parsed.subjective || '',
            objective: parsed.objective || '',
            assessment: parsed.assessment || '',
            plan: Array.isArray(parsed.plan) ? parsed.plan : [],
            differentials: Array.isArray(parsed.differentials) ? parsed.differentials : [],
            uncertaintyMarkers: Array.isArray(parsed.uncertaintyMarkers) ? parsed.uncertaintyMarkers : [],
            drugInteractionWarnings: Array.isArray(parsed.drugInteractionWarnings) ? parsed.drugInteractionWarnings : [],
            reviewedByClinician: false
          }
        });
        return;
      }

      const chatSystemPrompt = `You are HealYaar (हीलयार), a warm, accessible, plain-language AI health information companion built for seniors, families, and everyday patients in India.
SAFETY & CLINICAL RULES:
1. NEVER diagnose a disease, prescribe drugs, or advise stopping prescribed medication.
2. Address EVERY part of a multi-part question clearly using short bold headings and concise bullet points.
3. Ground your explanation strictly in the patient's retrieved personal vault excerpts (Layer A) and verified clinical references (Layer B). Never hallucinate lab values.
4. For acute red flags (chest pain, breathlessness, stroke signs, severe bleeding, self-harm), immediately highlight India Emergency Helplines: 108 (Ambulance), 112 (National Emergency), 14416 (Tele-MANAS).
5. End with 2 practical questions the patient can ask their doctor.

PARTS TO ADDRESS: ${queryParts.join(' | ')}`;

      const userPrompt = `PATIENT QUESTION:
"${query}"

LAYER A (Patient's Private Health Vault):
${personalContext || 'None uploaded yet.'}

LAYER B (Verified Clinical Reference Knowledge):
${clinicalContext || 'Standard WHO / ICMR-NIN educational guidance.'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userPrompt,
        config: {
          systemInstruction: chatSystemPrompt
        }
      });

      res.status(200).json({
        action: 'chat',
        poweredBy: 'Gemini 4 Hydrogen',
        model: 'gemini-4-hydrogen',
        text: (response.text ?? '').trim()
      });
      return;
    }

    // -------------------------------------------------------------------------
    // ACTION 2: EMBED (gemini-embedding-2)
    // Note: gemini-embedding-2 aggregates multiple inputs passed in a single `contents`
    // array into one combined vector by default, so each RAG chunk MUST be embedded
    // individually (one string per embedContent call).
    // -------------------------------------------------------------------------
    if (action === 'embed') {
      if (Array.isArray(body.texts)) {
        const chunks = body.texts
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter((item) => item.length > 0 && item.length <= 8000);

        if (chunks.length === 0 || chunks.length > 20) {
          res.status(400).json({ error: 'Texts array must contain 1 to 20 chunks (1 to 8000 characters each).' });
          return;
        }

        const embeddings: number[][] = [];
        for (const chunk of chunks) {
          const result = await ai.models.embedContent({
            model: 'gemini-embedding-2',
            contents: chunk
          });
          embeddings.push(result.embeddings?.[0]?.values || []);
        }

        res.status(200).json({
          action: 'embed',
          model: 'gemini-embedding-2',
          embeddings
        });
        return;
      }

      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text || text.length > 8000) {
        res.status(400).json({ error: 'Text for embedding must be 1 to 8000 characters.' });
        return;
      }

      const result = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text
      });

      const values = result.embeddings?.[0]?.values || [];
      res.status(200).json({
        action: 'embed',
        model: 'gemini-embedding-2',
        embedding: values
      });
      return;
    }

    // -------------------------------------------------------------------------
    // ACTION 3: VISION (Multimodal Lab Report / Prescription / Meal Photo)
    // -------------------------------------------------------------------------
    if (action === 'vision') {
      const visionType = body.visionType as 'lab_report' | 'prescription' | 'meal_photo' | undefined;
      const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim() : '';
      const base64Data = typeof body.base64Data === 'string' ? sanitizeBase64Payload(body.base64Data.trim()) : '';
      const fileName = sanitizeVisionFileName(body.fileName);

      const allowedMimeTypes = new Set([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf'
      ]);

      if (!visionType || !['lab_report', 'prescription', 'meal_photo'].includes(visionType)) {
        res.status(400).json({ error: 'Invalid visionType. Expected lab_report, prescription, or meal_photo.' });
        return;
      }
      if (!allowedMimeTypes.has(mimeType)) {
        res.status(400).json({ error: 'Unsupported file type. Upload a JPG, PNG, WEBP, or PDF file.' });
        return;
      }
      if (!base64Data) {
        res.status(400).json({ error: 'File payload is missing.' });
        return;
      }
      if (base64Data.length > MAX_VISION_BASE64_LENGTH) {
        res.status(413).json({
          error:
            'File payload exceeds the 4.2 MB encoded upload limit (~3 MB raw). Please compress the image or upload a smaller PDF.'
        });
        return;
      }

      const inlinePart = {
        inlineData: {
          mimeType,
          data: base64Data
        }
      };

      if (visionType === 'lab_report') {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              inlinePart,
              {
                text: `Extract all clearly visible laboratory biomarkers from this medical report (${fileName}).
Never fabricate values that are not readable in the document. If a field is unreadable, omit it or note uncertainty in uncertaintyNotes.
Provide warm, accessible plain-language explanations suitable for seniors and families, plus 3 practical questions for their doctor.`
              }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                labName: { type: Type.STRING },
                reportDate: { type: Type.STRING },
                summary: { type: Type.STRING },
                generalAdvice: { type: Type.STRING },
                questionsForDoctor: { type: Type.ARRAY, items: { type: Type.STRING } },
                uncertaintyNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                metrics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      code: { type: Type.STRING },
                      value: { type: Type.STRING },
                      unit: { type: Type.STRING },
                      referenceRange: { type: Type.STRING },
                      status: { type: Type.STRING },
                      plainExplanation: { type: Type.STRING },
                      clinicalContext: { type: Type.STRING }
                    },
                    required: ['name', 'value', 'unit', 'referenceRange', 'status', 'plainExplanation', 'clinicalContext']
                  }
                }
              },
              required: ['title', 'summary', 'generalAdvice', 'questionsForDoctor', 'metrics']
            }
          }
        });

        res.status(200).json({
          action: 'vision',
          visionType,
          poweredBy: 'Gemini 4 Hydrogen',
          model: 'gemini-4-hydrogen',
          data: JSON.parse((response.text ?? '{}').trim())
        });
        return;
      }

      if (visionType === 'prescription') {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              inlinePart,
              {
                text: `Extract every clearly visible prescribed medicine from this doctor prescription (${fileName}).
Interpret standard Indian clinical shorthand accurately (OD = Once daily, BD = Twice daily, TDS = Three times daily, HS = At bedtime, AC = Before meals, PC = After meals).
Mark confidence as "high", "medium", or "low". If handwriting is unclear, flag uncertainField clearly and NEVER guess unsafe dosages.`
              }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                doctorName: { type: Type.STRING },
                doctorQualification: { type: Type.STRING },
                clinicName: { type: Type.STRING },
                date: { type: Type.STRING },
                diagnosisSummary: { type: Type.STRING },
                generalAdvice: { type: Type.STRING },
                medicines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      genericName: { type: Type.STRING },
                      dosage: { type: Type.STRING },
                      frequency: { type: Type.STRING },
                      timing: { type: Type.STRING },
                      durationDays: { type: Type.INTEGER },
                      instructions: { type: Type.STRING },
                      confidence: { type: Type.STRING },
                      uncertainField: { type: Type.STRING }
                    },
                    required: ['name', 'genericName', 'dosage', 'frequency', 'timing', 'durationDays', 'instructions', 'confidence']
                  }
                }
              },
              required: ['doctorName', 'clinicName', 'diagnosisSummary', 'generalAdvice', 'medicines']
            }
          }
        });

        res.status(200).json({
          action: 'vision',
          visionType,
          poweredBy: 'Gemini 4 Hydrogen',
          model: 'gemini-4-hydrogen',
          data: JSON.parse((response.text ?? '{}').trim())
        });
        return;
      }

      // meal_photo
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            inlinePart,
            {
              text: `Analyze this real meal photo using ICMR-NIN Indian Food Composition guidelines.
Identify visible food items with realistic Indian household portions (katori, roti, cup, piece, grams) and estimate calories, proteinGrams, carbsGrams, fatGrams, fiberGrams, sodiumMg, and glycemicIndex (Low, Medium, or High).
Include honest uncertaintyNotes about hidden oil/ghee or portion size variance.`
            }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              estimatedPortion: { type: Type.STRING },
              nutrients: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  proteinGrams: { type: Type.NUMBER },
                  carbsGrams: { type: Type.NUMBER },
                  fatGrams: { type: Type.NUMBER },
                  fiberGrams: { type: Type.NUMBER },
                  sodiumMg: { type: Type.NUMBER },
                  glycemicIndex: { type: Type.STRING }
                },
                required: ['calories', 'proteinGrams', 'carbsGrams', 'fatGrams', 'fiberGrams', 'sodiumMg']
              },
              detectedIngredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    estimatedAmount: { type: Type.STRING }
                  },
                  required: ['name', 'estimatedAmount']
                }
              },
              uncertaintyNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['name', 'estimatedPortion', 'nutrients', 'detectedIngredients', 'uncertaintyNotes']
          }
        }
      });

      res.status(200).json({
        action: 'vision',
        visionType,
        poweredBy: 'Gemini 4 Hydrogen',
        model: 'gemini-4-hydrogen',
        data: JSON.parse((response.text ?? '{}').trim())
      });
      return;
    }

    // -------------------------------------------------------------------------
    // ACTION 4: NEARBY CARE (Gemini 4 Hydrogen + Grounding with Google Maps)
    // Note: responseMimeType / responseSchema are NOT set with googleMaps tool.
    // -------------------------------------------------------------------------
    if (action === 'nearby_care') {
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      const query = typeof body.query === 'string' && body.query.trim()
        ? body.query.trim().slice(0, 200)
        : 'hospitals, clinics, doctors, and pharmacies';
      const category = typeof body.category === 'string' && body.category.trim()
        ? body.category.trim().slice(0, 80)
        : 'All Healthcare';

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        res.status(400).json({ error: 'Valid latitude and longitude are required.' });
        return;
      }

      const prompt = `Find real nearby ${query} (focus: ${category}) close to coordinates (${latitude.toFixed(5)}, ${longitude.toFixed(5)}).
For each real facility found via Google Maps, list clearly in Markdown:
- **Facility Name** (Category / Specialty)
- Full street address
- Approximate opening hours / 24x7 status if available
- Brief care note (e.g., emergency desk, multi-specialty, diagnostics, pharmacy).
Only report real facilities grounded in Google Maps results.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude,
                longitude
              }
            }
          }
        }
      });

      const rawChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as Array<{
        maps?: {
          uri?: string;
          title?: string;
          placeId?: string;
          placeAnswerSources?: { reviewSnippets?: Array<{ uri?: string; title?: string }> };
        };
      }>;

      const googleMapsSources = rawChunks
        .filter((chunk) => chunk.maps?.uri)
        .map((chunk) => ({
          title: chunk.maps?.title || 'View on Google Maps',
          uri: chunk.maps?.uri || '',
          placeId: chunk.maps?.placeId || undefined,
          reviewSnippets: (chunk.maps?.placeAnswerSources?.reviewSnippets || [])
            .filter((r) => r.uri)
            .map((r) => ({ title: r.title || 'Google Maps review', uri: r.uri || '' }))
        }));

      res.status(200).json({
        action: 'nearby_care',
        poweredBy: 'Gemini 4 Hydrogen',
        model: 'gemini-4-hydrogen',
        summaryMarkdown: (response.text ?? '').trim(),
        googleMapsSources
      });
      return;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected AI service error.';
    const status = message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
      ? 429
      : message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')
      ? 403
      : 500;
    res.status(status).json({ error: message });
  }
}

// Default Vercel Serverless Function export
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  await handleAiRequest(req, res);
}
