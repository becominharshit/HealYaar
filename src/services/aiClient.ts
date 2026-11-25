import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ClinicianSOAPNote, NearbyCareSource } from '../types';
import { prepareVisionPayload } from '../utils/visionUploadHelpers';

export type { NearbyCareSource };

export interface AiChatResponse {
  action: 'chat' | 'soap';
  poweredBy: string;
  model: string;
  text: string;
  soapNote?: ClinicianSOAPNote;
}

export interface AiEmbedResponse {
  action: 'embed';
  model: string;
  embedding: number[];
}

export interface AiVisionResponse<T = Record<string, unknown>> {
  action: 'vision';
  visionType: 'lab_report' | 'prescription' | 'meal_photo';
  poweredBy: string;
  model: string;
  data: T;
}

export interface AiNearbyCareResponse {
  action: 'nearby_care';
  poweredBy: string;
  model: string;
  summaryMarkdown: string;
  nearbyCareSources?: NearbyCareSource[];
  googleMapsSources?: NearbyCareSource[];
}

async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function postAiProxy<T>(payload: Record<string, unknown>): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication session required for live AI requests.');
  }

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `AI request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
    reader.readAsDataURL(file);
  });
}

export const aiClient = {
  async chat(params: {
    query: string;
    personalContext: string;
    clinicalContext: string;
    queryParts: string[];
    mode: 'patient' | 'clinician';
  }): Promise<AiChatResponse> {
    return postAiProxy<AiChatResponse>({
      action: params.mode === 'clinician' ? 'soap' : 'chat',
      query: params.query,
      personalContext: params.personalContext,
      clinicalContext: params.clinicalContext,
      queryParts: params.queryParts
    });
  },

  async embed(text: string): Promise<number[]> {
    const res = await postAiProxy<AiEmbedResponse>({
      action: 'embed',
      text
    });
    return Array.isArray(res.embedding) ? res.embedding : [];
  },

  async analyzeVision<T>(params: {
    visionType: 'lab_report' | 'prescription' | 'meal_photo';
    file: File;
  }): Promise<AiVisionResponse<T>> {
    const { base64Data, mimeType } = await prepareVisionPayload(params.file, fileToBase64);
    return postAiProxy<AiVisionResponse<T>>({
      action: 'vision',
      visionType: params.visionType,
      mimeType,
      fileName: params.file.name,
      base64Data
    });
  },

  async searchNearbyCare(params: {
    latitude: number;
    longitude: number;
    query?: string;
    category?: string;
  }): Promise<AiNearbyCareResponse> {
    return postAiProxy<AiNearbyCareResponse>({
      action: 'nearby_care',
      latitude: params.latitude,
      longitude: params.longitude,
      query: params.query,
      category: params.category
    });
  }
};
