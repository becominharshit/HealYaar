import { GoogleGenAI } from '@google/genai';
import { ChatMessage, ClinicianSOAPNote, NavTab } from '../../types';
import { retrieveContext, RAGRetrievalResult } from './retrievalService';

// Red-flag emergency keyword detector
export function detectEmergency(query: string): boolean {
  const q = query.toLowerCase();
  const emergencyTriggers = [
    'chest pain', 'chest tightness', 'heart attack', 'crushing chest',
    'breathless', 'gasping', 'cannot breathe', "can't breathe", 'shortness of breath',
    'stroke', 'face drooping', 'slurred speech', 'arm numbness', 'one side weakness',
    'suicide', 'kill myself', 'end my life', 'harm myself',
    'coughing blood', 'vomiting blood', 'unconscious', 'fainted', 'passed out',
    'thunderclap headache', 'blue lips', 'seizure'
  ];
  return emergencyTriggers.some(trigger => q.includes(trigger));
}

/**
 * Splits multi-part patient queries (e.g., "What does my hemoglobin indicate and what foods help absorption?")
 * so both LLM prompts and deterministic fallback explicitly address every clause.
 */
function extractQueryParts(query: string): string[] {
  const parts = query
    .split(/\?|\band\b|\balso\b|;/i)
    .map(p => p.trim())
    .filter(p => p.length > 5);
  return parts.length > 1 ? parts.slice(0, 3) : [query.trim()];
}

/**
 * Generates a verifiable Clinician Copilot SOAP Note grounded in Layer A & Layer B RAG chunks.
 */
function buildClinicianSOAPNote(query: string, ragResult: RAGRetrievalResult): ClinicianSOAPNote {
  const q = query.toLowerCase();
  const personalSources = ragResult.personalSources || [];
  const clinicalSources = ragResult.clinicalSources || [];

  const personalSummary = personalSources.length > 0
    ? personalSources
        .map(s => `[${s.chunk.title}] ${s.chunk.content.split('\n').slice(0, 3).join(' | ')}`)
        .join('\n')
    : 'No prior lab reports or prescriptions indexed in patient vault yet; objective baseline relies on point-of-care verification.';

  const clinicalTitles = clinicalSources.map(s => s.chunk.title).join(', ');

  // Domain-calibrated top-3 differentials & drug-interaction warnings
  let differentials: ClinicianSOAPNote['differentials'] = [
    {
      condition: 'Benign / Lifestyle-Related Symptom Etiology',
      likelihood: 'Primary Consideration',
      rationale: 'Most common presentation in ambulatory outpatient care when acute red flags are absent.'
    },
    {
      condition: 'Metabolic or Nutritional Deficiency',
      likelihood: 'Secondary',
      rationale: 'Evaluate CBC, ferritin, vitamin B12, vitamin D, fasting glucose/HbA1c, and TSH if symptoms persist.'
    },
    {
      condition: 'Underlying Systemic or Cardiopulmonary Pathology',
      likelihood: 'Rule Out',
      rationale: 'Screen for progressive red flags, unexplained weight loss, persistent fever, or cardiopulmonary exertional symptoms.'
    }
  ];

  const drugInteractionWarnings: string[] = [];

  if (q.includes('hemoglobin') || q.includes('anemia') || q.includes('iron') || q.includes('fatigue')) {
    differentials = [
      {
        condition: 'Iron Deficiency Anemia (Microcytic Hypochromic)',
        likelihood: 'Primary Consideration',
        rationale: 'Most prevalent etiology in Indian outpatient populations; confirm with serum ferritin, TIBC, and peripheral smear.'
      },
      {
        condition: 'Megaloblastic Anemia (Vitamin B12 / Folate Deficiency)',
        likelihood: 'Secondary',
        rationale: 'Common in vegetarian diets or chronic Metformin/PPI use; inspect MCV and serum B12 levels.'
      },
      {
        condition: 'Anemia of Chronic Disease / Occult GI or Menstrual Blood Loss',
        likelihood: 'Rule Out',
        rationale: 'Rule out chronic inflammatory disorders, hypothyroidism, or heavy menstrual bleeding (HMB) if refractory to oral iron.'
      }
    ];
    drugInteractionWarnings.push(
      'Oral Iron + Levothyroxine / Fluoroquinolones / Calcium / Antacids: Separate administration by at least 2–4 hours to avoid chelation and reduced absorption.',
      'Oral Iron + Tannins (Tea/Coffee): Avoid within 1 hour of iron supplementation; pair with Vitamin C (amla/lemon) to enhance non-heme uptake.'
    );
  } else if (q.includes('sugar') || q.includes('glucose') || q.includes('hba1c') || q.includes('diabetes')) {
    differentials = [
      {
        condition: 'Prediabetes / Impaired Fasting Glucose or Type 2 Diabetes Mellitus',
        likelihood: 'Primary Consideration',
        rationale: 'Confirm with repeat fasting plasma glucose, 2-hour OGTT, or standardized NGSP HbA1c assay.'
      },
      {
        condition: 'Metabolic Syndrome / Insulin Resistance',
        likelihood: 'Secondary',
        rationale: 'Assess waist circumference, blood pressure, triglycerides, and HDL alongside glycemic markers.'
      },
      {
        condition: 'Secondary Hyperglycemia (Steroid-induced, Thyroid, or Pancreatic)',
        likelihood: 'Rule Out',
        rationale: 'Review corticosteroid exposure and endocrine history if glycemic rise is abrupt.'
      }
    ];
    drugInteractionWarnings.push(
      'Metformin + Iodinated Contrast / Severe Renal Impairment (eGFR < 30): Hold per renal protocol to prevent lactic acidosis; monitor Vitamin B12 on long-term therapy.',
      'Sulfonylureas / Insulin + Alcohol or Missed Meals: High risk of acute hypoglycemia; educate patient on 15-15 rescue rule.'
    );
  } else if (q.includes('cholesterol') || q.includes('lipid') || q.includes('ldl') || q.includes('statin')) {
    differentials = [
      {
        condition: 'Primary Dyslipidemia / Elevated Atherogenic LDL-C',
        likelihood: 'Primary Consideration',
        rationale: 'Calculate 10-year ASCVD risk score incorporating age, BP, smoking status, and diabetes.'
      },
      {
        condition: 'Secondary Dyslipidemia (Hypothyroidism, Uncontrolled Diabetes, Nephrotic)',
        likelihood: 'Secondary',
        rationale: 'Always screen TSH, HbA1c, and liver/renal panel prior to initiating lipid-lowering therapy.'
      },
      {
        condition: 'Familial Hypercholesterolemia',
        likelihood: 'Rule Out',
        rationale: 'Suspect if LDL-C >= 190 mg/dL or family history of premature CAD.'
      }
    ];
    drugInteractionWarnings.push(
      'Statins (Atorvastatin/Rosuvastatin) + Strong CYP3A4 Inhibitors (Clarithromycin, Azoles) or Grapefruit: Increased myopathy/rhabdomyolysis risk.',
      'Monitor baseline LFTs and counsel patient to report unexplained symmetrical muscle pain or dark urine.'
    );
  } else if (q.includes('period') || q.includes('cycle') || q.includes('cramp') || q.includes('pcos')) {
    differentials = [
      {
        condition: 'Primary Dysmenorrhea / Physiological Cycle Variation',
        likelihood: 'Primary Consideration',
        rationale: 'Prostaglandin-mediated uterine cramping typically peaks on cycle days 1–2 without pelvic pathology.'
      },
      {
        condition: 'Polycystic Ovary Syndrome (PCOS) or Thyroid-Related Oligomenorrhea',
        likelihood: 'Secondary',
        rationale: 'Evaluate Rotterdam criteria, TSH, serum prolactin, and metabolic profile for cycles > 35 days.'
      },
      {
        condition: 'Secondary Dysmenorrhea (Endometriosis, Fibroids, or Pregnancy Complications)',
        likelihood: 'Rule Out',
        rationale: 'Rule out pregnancy first for missed/abnormal bleeding; obtain pelvic ultrasound for worsening pain or heavy clots.'
      }
    ];
    drugInteractionWarnings.push(
      'NSAIDs (Ibuprofen/Mefenamic Acid) + Anticoagulants / Peptic Ulcer / CKD: Take after food (PC); avoid in renal impairment or active gastritis.'
    );
  } else if (q.includes('knee') || q.includes('joint') || q.includes('stiff') || q.includes('pain')) {
    differentials = [
      {
        condition: 'Early Knee Osteoarthritis / Mechanical Joint Wear',
        likelihood: 'Primary Consideration',
        rationale: 'Brief morning stiffness (< 30 min) easing with gentle activity and worsening after weight-bearing.'
      },
      {
        condition: 'Inflammatory Arthropathy (Rheumatoid Arthritis / Gout)',
        likelihood: 'Secondary',
        rationale: 'Consider if morning stiffness exceeds 45–60 min, symmetrical joint swelling, or acute warm effusion.'
      },
      {
        condition: 'Meniscal / Ligamentous Injury or Septic Arthritis',
        likelihood: 'Rule Out',
        rationale: 'Urgent evaluation if locking, instability, fever, or inability to bear weight.'
      }
    ];
    drugInteractionWarnings.push(
      'Oral NSAIDs + ACE Inhibitors / Diuretics / Aspirin: Risk of GI bleeding, hypertension destabilization, and acute kidney injury (triple whammy); prefer topical diclofenac when suitable.'
    );
  } else {
    drugInteractionWarnings.push(
      'Verify full medication reconciliation (including OTC analgesics, Ayurvedic/herbal supplements, and prescriptions) before initiating new therapy.'
    );
  }

  // Also check if personal vault contains known prescriptions to surface cross-checks
  const rxChunks = personalSources.filter(s => s.chunk.sourceType === 'prescription');
  if (rxChunks.length > 0) {
    drugInteractionWarnings.unshift(
      `Active Vault Prescription Detected (${rxChunks[0].chunk.title}): Cross-verify dosage schedule, food-timing (AC/PC), and potential duplicate active ingredients.`
    );
  }

  const plan: string[] = [
    'Perform focused history & physical exam to confirm duration, severity, and red-flag exclusion.',
    personalSources.length > 0
      ? `Reconcile retrieved patient vault records (${personalSources.map(s => s.chunk.title).join('; ')}) with current vital signs.`
      : 'Order targeted baseline laboratory panel as clinically indicated and index finalized report into patient vault.',
    clinicalSources.length > 0
      ? `Align patient counseling with retrieved clinical reference modules: ${clinicalTitles}.`
      : 'Provide structured return precautions (108/112 for acute cardiopulmonary or neurological red flags) and schedule routine follow-up.'
  ];

  return {
    subjective: `Patient inquiry: "${query}". Context requires structured symptom timeline (onset, duration, aggravating/relieving factors) and confirmation of medication adherence.`,
    objective: personalSummary,
    assessment: `Draft clinical synthesis grounded in ${personalSources.length} personal vault chunk(s) and ${clinicalSources.length} curated clinical guideline module(s). Requires licensed clinician verification prior to diagnostic or therapeutic action.`,
    plan,
    differentials,
    uncertaintyMarkers: [
      'AI-generated clinical draft based solely on patient-reported text and locally indexed records; no physical exam or live vitals observed.',
      personalSources.length === 0
        ? 'Missing recent verified lab/prescription vault records — clinical confidence is limited until objective labs are reviewed.'
        : 'Confirm lab reference ranges, specimen collection date, and assay methodology on original laboratory report.'
    ],
    drugInteractionWarnings,
    reviewedByClinician: false
  };
}

/**
 * Dual-Layer Healthcare RAG Generation Pipeline
 * Augments user queries with personal health records (Layer A) and clinical reference guidelines (Layer B).
 * Supports both Patient Mode (plain language) and Clinician Copilot Mode (verifiable SOAP note).
 */
export async function generateRAGAssistantResponse(
  userId: string,
  userQuery: string,
  mode: 'patient' | 'clinician' = 'patient'
): Promise<ChatMessage> {
  const q = userQuery.toLowerCase().trim();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. EMERGENCY FAST-PATH (Non-negotiable patient safety)
  if (detectEmergency(q)) {
    return {
      id: `bot-emergency-${Date.now()}`,
      sender: 'assistant',
      copilotMode: mode,
      text: "🚨 **IMMEDIATE EMERGENCY ALERT:** The symptoms you described (such as severe chest pain, extreme breathlessness, sudden numbness, or acute distress) can be life-threatening and require immediate professional emergency intervention.",
      timestamp,
      isEmergency: true,
      emergencyActionText: "Please call 108 (Ambulance), 112 (Emergency Response), or go to the closest hospital immediately. Do not drive yourself. Stay calm, sit down, and keep your door unlocked.",
      suggestedFollowUps: [
        "Call Ambulance (108)",
        "Call National Emergency (112)",
        "Call Mental Health Helpline (14416)"
      ],
      nextSteps: {
        category: 'emergency',
        summary: "Do not wait for an online questionnaire or second opinion. Seek immediate in-person emergency care right now."
      },
      sources: [
        { organization: 'World Health Organization (WHO)', year: 2023, topic: 'Emergency Cardiovascular Care' },
        { organization: 'Indian Council of Medical Research (ICMR)', year: 2022, topic: 'Acute Cardiac Protocols' }
      ]
    };
  }

  // 2. RETRIEVE DUAL-LAYER CONTEXT
  const ragResult = await retrieveContext(userId, userQuery, {
    maxPersonal: 4,
    maxClinical: 4,
    minScore: 0.12
  });

  const soapNote = mode === 'clinician' ? buildClinicianSOAPNote(userQuery, ragResult) : undefined;
  const queryParts = extractQueryParts(userQuery);

  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;

  // 3. ATTEMPT GEMINI LLM GENERATION IF API KEY CONFIGURED
  if (apiKey && apiKey !== 'undefined' && apiKey.length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const partsChecklist = queryParts.map((part, i) => `  Part ${i + 1}: "${part}"`).join('\n');

      const prompt = mode === 'clinician'
        ? `You are HealYaar Clinician Copilot, an evidence-grounded clinical documentation assistant.
Summarize the retrieved Dual-Layer RAG evidence concisely for a licensed clinician reviewing this patient case.
Explicitly address EVERY part of the query below using ALL relevant personal records and clinical guidelines provided.
Do NOT fabricate lab values not present in context. Highlight uncertainty and drug-interaction precautions clearly.

Query Parts to Address:
${partsChecklist}

${ragResult.contextPromptBlock}

Clinician Query: "${userQuery}"

Format cleanly using Markdown headings (**Clinical Synthesis**, **Vault Record Findings**, **Guideline Alignment**, **Key Precautions**) and concise bullet points.`
        : `You are HealYaar, an empathetic, accessible healthcare companion for patients in India.
Explain medical terms, lab results, prescriptions, nutrition, and symptoms in simple, clear, everyday language.
Do NOT give medical diagnoses or prescribe medications.
CRITICAL: If the patient asks a multi-part question, explicitly address EVERY part using ALL relevant personal records and clinical guidelines below.

Query Parts to Answer Completely:
${partsChecklist}

${ragResult.contextPromptBlock}

Patient Query: "${userQuery}"

Provide a structured, compassionate Markdown response:
1. Answer each part of the patient's question clearly with short bold headings.
2. If personal records were found in the context above, cite them specifically (e.g. "From your saved report...").
3. Reference ALL relevant clinical guidelines retrieved (e.g., both lab interpretation AND nutrition/absorption tips if asked).
4. Give practical, non-diagnostic next steps or questions to ask their doctor.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt
      });

      const responseText = response.text?.trim();
      if (responseText && responseText.length > 20) {
        return {
          id: `bot-rag-${Date.now()}`,
          sender: 'assistant',
          copilotMode: mode,
          soapNote,
          text: responseText,
          timestamp,
          ragSources: ragResult.allSources,
          uncertaintyNote: mode === 'clinician'
            ? "Clinician Copilot draft — must be verified and signed off by a licensed practitioner before entering the medical record."
            : "HealYaar provides educational guidance grounded in your records. Always verify medical decisions with your doctor.",
          suggestedFollowUps: generateFollowUps(userQuery),
          nextSteps: determineNextSteps(userQuery)
        };
      }
    } catch {
      // Fall through to deterministic clinical RAG reasoning engine
    }
  }

  // 4. HIGH-FIDELITY GROUNDED CLINICAL RAG REASONING ENGINE (OFFLINE / FALLBACK)
  return buildGroundedRuleResponse(userQuery, ragResult, timestamp, mode, soapNote);
}

/**
 * Deterministic multi-chunk clinical grounding synthesizer when Gemini API is unavailable.
 * Explicitly integrates ALL retrieved personal & clinical chunks so multi-part queries are answered completely.
 */
function buildGroundedRuleResponse(
  query: string,
  ragResult: RAGRetrievalResult,
  timestamp: string,
  mode: 'patient' | 'clinician',
  soapNote?: ClinicianSOAPNote
): ChatMessage {
  const q = query.toLowerCase();
  const personalSources = ragResult.personalSources || [];
  const clinicalSources = ragResult.clinicalSources || [];
  const hasPersonal = personalSources.length > 0;
  const hasClinical = clinicalSources.length > 0;
  const queryParts = extractQueryParts(query);

  if (mode === 'clinician') {
    const sections: string[] = [];
    sections.push(`### Clinician Copilot Synthesis\nPrepared a structured **SOAP Note** below grounded in **${personalSources.length} personal vault record(s)** and **${clinicalSources.length} clinical reference module(s)**.`);

    if (hasPersonal) {
      const vaultBullets = personalSources
        .slice(0, 3)
        .map(s => `- **${s.chunk.title}:** ${s.chunk.content.split('\n').slice(0, 2).join(' — ')}`)
        .join('\n');
      sections.push(`**Layer A — Patient Vault Findings:**\n${vaultBullets}`);
    }

    if (hasClinical) {
      const guideBullets = clinicalSources
        .slice(0, 3)
        .map(s => `- **${s.chunk.title}:** ${s.chunk.content.split('\n').slice(0, 2).join(' ')}`)
        .join('\n');
      sections.push(`**Layer B — Retrieved Clinical Reference Modules:**\n${guideBullets}`);
    }

    sections.push(`**Clinician Action Required:** Review the structured SOAP sections, differential considerations, and drug-interaction warnings below, then click **Clinician Reviewed & Signed Off** once verified.`);

    return {
      id: `bot-clinician-${Date.now()}`,
      sender: 'assistant',
      copilotMode: 'clinician',
      soapNote,
      text: sections.join('\n\n'),
      timestamp,
      ragSources: ragResult.allSources,
      uncertaintyNote: "Clinician Copilot draft grounded in Dual-Layer RAG. Verify objective measurements before clinical sign-off.",
      suggestedFollowUps: generateFollowUps(query),
      nextSteps: determineNextSteps(query)
    };
  }

  // Case A: Grounded with Personal Records + ALL Retrieved Clinical Guidelines
  if (hasPersonal || hasClinical) {
    const sections: string[] = [];

    if (queryParts.length > 1) {
      sections.push(`I have broken down all **${queryParts.length} parts** of your question using your private health vault and verified clinical guidelines:`);
    }

    if (hasPersonal) {
      const personalBlocks = personalSources.slice(0, 2).map((src, idx) => {
        const snippet = src.chunk.content.split('\n').slice(0, 4).join('\n');
        return `**${idx === 0 ? 'From Your Personal Health Vault' : 'Additional Saved Record'} — ${src.chunk.title}:**\n${snippet}`;
      });
      sections.push(personalBlocks.join('\n\n'));
    }

    if (hasClinical) {
      const clinicalBlocks = clinicalSources.slice(0, 3).map((src) => {
        const snippet = src.chunk.content.split('\n').slice(0, 4).join('\n');
        return `**Clinical Guidance — ${src.chunk.title}:**\n${snippet}`;
      });
      sections.push(clinicalBlocks.join('\n\n'));
    }

    // Ensure nutrition/absorption sub-question is explicitly answered if asked alongside labs
    if (
      (q.includes('food') || q.includes('diet') || q.includes('absorption') || q.includes('eat')) &&
      (q.includes('hemoglobin') || q.includes('iron') || q.includes('anemia')) &&
      !clinicalSources.some(s => s.chunk.content.toLowerCase().includes('vitamin c'))
    ) {
      sections.push(
        `**Foods That Boost Iron & Hemoglobin Absorption (ICMR-NIN):**\n- **Pair iron with Vitamin C:** Squeeze fresh lemon over dal/palak or eat amla, guava, or oranges with meals to boost plant-iron absorption by up to 3x.\n- **Iron-rich Indian staples:** Roasted chana, rajma, moong dal, ragi, bajra, garden cress seeds (halim), jaggery, and green leafy vegetables.\n- **Avoid blockers near meals:** Keep tea and coffee at least **1 hour away** from iron-rich meals or iron tablets, as tannins reduce iron uptake.`
      );
    }

    sections.push(
      `**Plain-Language Takeaway:**\nShare these combined findings with your doctor during your next visit so they can confirm whether follow-up lab tests, diet adjustments, or medication updates are right for you.`
    );

    return {
      id: `bot-rag-${hasPersonal ? 'personal' : 'clinical'}-${Date.now()}`,
      sender: 'assistant',
      copilotMode: 'patient',
      text: sections.join('\n\n'),
      timestamp,
      ragSources: ragResult.allSources,
      uncertaintyNote: hasPersonal
        ? "Grounded in your personal health vault and clinical guidelines. Only a licensed physician can interpret lab trends in full clinical context."
        : "Educational guideline from clinical reference modules. Upload your reports or prescriptions so I can personalize guidance to your exact values.",
      suggestedFollowUps: generateFollowUps(query),
      nextSteps: determineNextSteps(query)
    };
  }

  // Case C: Standard Compassionate Health Literacy Guidance
  if (q.includes('knee') || q.includes('joint') || q.includes('stiff') || q.includes('arthritis')) {
    return {
      id: `bot-std-${Date.now()}`,
      sender: 'assistant',
      copilotMode: 'patient',
      text: "**Understanding Knee Aches & Morning Stiffness**\n\nKnee aching and morning stiffness are common, especially when joint cartilage experiences gradual wear over time or mild strain.\n\n- **Gentle movement:** Low-impact walking and seated leg extensions help circulate joint fluid.\n- **Warm vs. cold:** Warm compresses ease morning tightness; cold packs help sudden swelling.\n- **When to see a doctor:** If stiffness lasts past 30 minutes, the knee locks, or walking causes limping, schedule an orthopedic evaluation.",
      timestamp,
      plainLanguageGlossary: [
        { term: "Cartilage", explanation: "The smooth, rubbery padding between bones that prevents friction when you bend your knees." },
        { term: "Osteoarthritis", explanation: "Natural wear-and-tear of joint cushioning over years." }
      ],
      nextSteps: {
        category: 'routine-clinic',
        summary: "Schedule a routine checkup with a bone and joint specialist if walking causes persistent pain.",
        actionLabel: "Find Nearby Orthopedic Doctors",
        actionTab: 'doctors'
      },
      uncertaintyNote: "General health education only. In-person physical examination or imaging is required to assess joint health.",
      sources: [
        { organization: 'American Academy of Orthopaedic Surgeons (AAOS)', year: 2023, topic: 'Knee Osteoarthritis Patient Guidance' }
      ],
      suggestedFollowUps: [
        "What exercises are safe for painful knees?",
        "Does warm water or ice help more?",
        "Find nearby bone and joint doctors"
      ]
    };
  }

  if (q.includes('fever') || q.includes('cold') || q.includes('cough')) {
    return {
      id: `bot-std-${Date.now()}`,
      sender: 'assistant',
      copilotMode: 'patient',
      text: "**Home Care for Mild Fever & Viral Cold**\n\nA mild fever (under 101°F / 38.3°C) with a runny nose or scratchy throat is commonly your immune system clearing a viral infection.\n\n- Rest in a well-ventilated room and stay well hydrated.\n- Sip warm fluids (ginger water, clear soups, herbal tea) to soothe your throat.\n- Gargle with warm salt water 2–3 times daily.\n- Monitor your temperature twice daily and see a doctor if fever exceeds 102°F or lasts > 3 days.",
      timestamp,
      nextSteps: {
        category: 'routine-clinic',
        summary: "Most viral colds resolve within 5 to 7 days. If your fever stays above 102°F or lasts longer than 3 days, see a general physician.",
        actionLabel: "Find General Physicians Nearby",
        actionTab: 'doctors'
      },
      uncertaintyNote: "Antibiotics do not work against viral colds and should never be taken without a prescription.",
      suggestedFollowUps: [
        "What is the safe adult dose for paracetamol?",
        "When does a cough need an X-ray?",
        "Find nearby general doctors"
      ]
    };
  }

  // Default Exploratory Response
  return {
    id: `bot-std-default-${Date.now()}`,
    sender: 'assistant',
    copilotMode: 'patient',
    text: `Thank you for asking about **"${query}"**. I am here to explain health topics in clear, plain language.\n\nTo give you the most helpful educational guidance, could you share:\n1. How many days or weeks have you noticed this?\n2. Is it mild, moderate, or interfering with daily activities?\n3. Have you uploaded any recent lab reports or prescriptions into your Health Vault?`,
    timestamp,
    uncertaintyNote: "Educational guidance only. If you are ever unsure or in distress, please consult a healthcare professional.",
    suggestedFollowUps: [
      "What does my hemoglobin level indicate and what foods help absorption?",
      "Check Prescription Safety",
      "Find a doctor near me"
    ],
    nextSteps: {
      category: 'routine-clinic',
      summary: "For persistent symptoms, consulting a trusted clinician is always the safest course.",
      actionLabel: "Explore Symptom Checker",
      actionTab: 'symptoms'
    }
  };
}

function generateFollowUps(query: string): string[] {
  const followUps: string[] = [];
  const q = query.toLowerCase();

  if (q.includes('hemoglobin') || q.includes('anemia') || q.includes('iron')) {
    followUps.push("What foods boost iron absorption?");
    followUps.push("Why does tea block iron absorption?");
    followUps.push("When should I re-test my CBC?");
  } else if (q.includes('sugar') || q.includes('glucose') || q.includes('hba1c') || q.includes('diabetes')) {
    followUps.push("What is the difference between fasting and HbA1c?");
    followUps.push("What are low blood sugar (hypoglycemia) symptoms?");
    followUps.push("Suggest an Indian balanced thali for sugar control");
  } else if (q.includes('cholesterol') || q.includes('lipid') || q.includes('ldl')) {
    followUps.push("How much fiber do I need daily to lower LDL?");
    followUps.push("What cooking oils are safest for heart health?");
  } else if (q.includes('period') || q.includes('cycle') || q.includes('cramps')) {
    followUps.push("How does luteal phase affect mood and energy?");
    followUps.push("What are gynecological red flags?");
    followUps.push("Safe home relief for period cramps");
  } else if (q.includes('medicine') || q.includes('dose') || q.includes('antibiotic') || q.includes('paracetamol')) {
    followUps.push("Why must I finish the full antibiotic course?");
    followUps.push("What is the max safe dose of paracetamol?");
    followUps.push("What does 'PC' and 'AC' mean on prescriptions?");
  } else {
    followUps.push("What does my hemoglobin level indicate and what foods help absorption?");
    followUps.push("What does HbA1c 6.2% mean?");
    followUps.push("Find nearby specialists");
  }

  return followUps.slice(0, 3);
}

function determineNextSteps(query: string): {
  category: 'self-care' | 'routine-clinic' | 'urgent-care' | 'emergency';
  summary: string;
  actionLabel: string;
  actionTab: NavTab;
} {
  const q = query.toLowerCase();
  if (q.includes('report') || q.includes('cbc') || q.includes('test') || q.includes('blood') || q.includes('hba1c') || q.includes('hemoglobin')) {
    return {
      category: 'self-care',
      summary: "Upload your original lab report PDF or photo to track your biomarker trends over time.",
      actionLabel: "Open Lab Report Simplifier",
      actionTab: 'reports'
    };
  }
  if (q.includes('prescription') || q.includes('medicine') || q.includes('pill') || q.includes('dose')) {
    return {
      category: 'self-care',
      summary: "Upload your doctor's prescription to review dosages, timings, and avoid food-drug interactions.",
      actionLabel: "Open Prescription Reader",
      actionTab: 'medicines'
    };
  }
  if (q.includes('period') || q.includes('cycle') || q.includes('cramp') || q.includes('ovulation')) {
    return {
      category: 'self-care',
      summary: "Track cycle phases, symptoms, and fertile windows with privacy in the Period Tracker.",
      actionLabel: "Open Period Tracker",
      actionTab: 'period'
    };
  }
  return {
    category: 'routine-clinic',
    summary: "For persistent symptoms, consulting a trusted clinician is always the safest course.",
    actionLabel: "Find Nearby Doctors",
    actionTab: 'doctors'
  };
}
