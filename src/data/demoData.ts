import {
  AuthUser,
  ChatMessage,
  ClinicianSOAPNote,
  PeriodCycleEntry,
  ReminderItem,
  SyntheticPrescription
} from '../types';
import type { AnalyzedReportRecord } from '../views/ReportsView';

export const DEMO_USER_ID = 'demo-guest-user';

export const DEMO_AUTH_USER: AuthUser = {
  id: DEMO_USER_ID,
  name: 'Aarav Sharma (Demo Guest)',
  email: 'demo@healyaar.app',
  emailOrPhone: 'demo@healyaar.app',
  rememberMe: false,
  loginDate: '2026-11-24',
  avatarUrl: null,
  emailConfirmed: true
};

export function isDemoUserId(userId?: string | null): boolean {
  return userId === DEMO_USER_ID;
}

export const DEMO_MEDICAL_REPORTS: AnalyzedReportRecord[] = [
  {
    id: 'demo-rep-cbc-hba1c',
    title: 'Comprehensive Metabolic & HbA1c Panel (Sample)',
    fileName: 'aarav_metabolic_hba1c_nov2026.pdf',
    fileSizeFormatted: '418.2 KB',
    uploadDate: '18 Nov 2026',
    isDemo: true,
    poweredBy: 'Gemini 4 Hydrogen (Demo Preview)',
    summary:
      'Sample blood panel showing borderline elevated HbA1c (6.3%) in the prediabetes range and low Vitamin D (19.2 ng/mL), while Hemoglobin and Fasting Creatinine remain within healthy reference ranges.',
    keyFindings: [
      'Laboratory: Metropolis Diagnostics, Pune (Sample Record)',
      'Extracted 5 biomarkers (2 flagged outside standard reference range).',
      'HbA1c 6.3% indicates impaired glucose tolerance; discuss 3-month lifestyle & medication review with your physician.',
      '25-OH Vitamin D is deficient at 19.2 ng/mL — commonly linked with fatigue and musculoskeletal aches.'
    ],
    metrics: [
      {
        name: 'HbA1c (Glycated Hemoglobin)',
        code: 'HbA1c',
        value: '6.3',
        unit: '%',
        referenceRange: '4.0 – 5.6 %',
        status: 'borderline',
        plainExplanation:
          'Measures your average blood sugar over the past 2–3 months. 6.3% sits in the prediabetes zone (5.7%–6.4%).',
        clinicalContext: 'ICMR-INDIAB & ADA recommend repeat testing in 3 months alongside structured diet and 150 min/week activity.'
      },
      {
        name: '25-Hydroxy Vitamin D',
        code: 'VIT-D',
        value: '19.2',
        unit: 'ng/mL',
        referenceRange: '30 – 100 ng/mL',
        status: 'low',
        plainExplanation:
          'Vitamin D helps absorb calcium and supports energy and immunity. Below 20 ng/mL is considered deficient.',
        clinicalContext: 'Physicians often prescribe weekly Cholecalciferol 60,000 IU for 8 weeks followed by maintenance dosing.'
      },
      {
        name: 'Hemoglobin',
        code: 'Hb',
        value: '14.4',
        unit: 'g/dL',
        referenceRange: '13.0 – 17.0 g/dL',
        status: 'normal',
        plainExplanation: 'Healthy red blood cell oxygen-carrying level with no signs of anemia.',
        clinicalContext: 'Within normal adult reference limits.'
      },
      {
        name: 'Fasting Blood Glucose',
        code: 'FBG',
        value: '112',
        unit: 'mg/dL',
        referenceRange: '70 – 99 mg/dL',
        status: 'borderline',
        plainExplanation: 'Slightly above normal fasting sugar; aligns with your borderline HbA1c reading.',
        clinicalContext: 'Impaired fasting glucose (100–125 mg/dL).'
      },
      {
        name: 'Serum Creatinine',
        code: 'CREAT',
        value: '0.88',
        unit: 'mg/dL',
        referenceRange: '0.70 – 1.30 mg/dL',
        status: 'normal',
        plainExplanation: 'Indicates healthy kidney filtration function.',
        clinicalContext: 'eGFR > 90 mL/min/1.73m²; safe baseline for Metformin therapy.'
      }
    ],
    thingsToDiscuss: [
      'Should we repeat HbA1c and Vitamin B12 levels after 3 months of Metformin SR?',
      'How long should I continue weekly Vitamin D3 60,000 IU supplementation?',
      'What daily carbohydrate and post-meal walking targets suit my fasting glucose of 112 mg/dL?'
    ],
    disclaimer:
      'Sample read-only demo report for educational preview. Sign in to upload and analyze your own encrypted lab reports.'
  },
  {
    id: 'demo-rep-lipid',
    title: 'Fasting Lipid Profile (Sample)',
    fileName: 'aarav_lipid_profile_oct2026.pdf',
    fileSizeFormatted: '294.6 KB',
    uploadDate: '29 Oct 2026',
    isDemo: true,
    poweredBy: 'Gemini 4 Hydrogen (Demo Preview)',
    summary:
      'Sample lipid panel showing borderline elevated LDL cholesterol (138 mg/dL) with healthy HDL and triglyceride markers.',
    keyFindings: [
      'Laboratory: SRL Diagnostics, Pune (Sample Record)',
      'LDL Cholesterol is mildly elevated at 138 mg/dL (optimal < 100 mg/dL).',
      'HDL Cholesterol (49 mg/dL) and Triglycerides (132 mg/dL) remain within target ranges.'
    ],
    metrics: [
      {
        name: 'LDL Cholesterol',
        code: 'LDL-C',
        value: '138',
        unit: 'mg/dL',
        referenceRange: '< 100 mg/dL',
        status: 'borderline',
        plainExplanation: 'Often called "bad cholesterol"; gradually reducing saturated fats and adding soluble fiber helps lower it.',
        clinicalContext: 'Borderline high (130–159 mg/dL); reassess with clinician alongside Atorvastatin 10 mg HS.'
      },
      {
        name: 'HDL Cholesterol',
        code: 'HDL-C',
        value: '49',
        unit: 'mg/dL',
        referenceRange: '> 40 mg/dL',
        status: 'normal',
        plainExplanation: 'Protective cholesterol that helps clear excess lipids from blood vessels.',
        clinicalContext: 'Acceptable protective range.'
      },
      {
        name: 'Triglycerides',
        code: 'TG',
        value: '132',
        unit: 'mg/dL',
        referenceRange: '< 150 mg/dL',
        status: 'normal',
        plainExplanation: 'Blood fats stored from extra calories; currently within normal range.',
        clinicalContext: 'Normal fasting triglyceride level.'
      }
    ],
    thingsToDiscuss: [
      'What target LDL cholesterol should we aim for given my borderline HbA1c?',
      'Are liver enzyme (SGPT/SGOT) baseline checks recommended while on low-dose statins?'
    ],
    disclaimer:
      'Sample read-only demo report for educational preview. Sign in to store your personal reports.'
  }
];

export const DEMO_PRESCRIPTIONS: SyntheticPrescription[] = [
  {
    id: 'demo-rx-1',
    doctorName: 'Dr. Ananya Kulkarni',
    doctorQualification: 'MD (Internal Medicine)',
    clinicName: 'Sahyadri Preventive Care Clinic, Pune (Sample)',
    patientName: 'Aarav Sharma (Demo)',
    date: '2026-11-19',
    diagnosisSummary: 'Impaired Glucose Tolerance (HbA1c 6.3%), Borderline Dyslipidemia, Vitamin D Deficiency',
    generalAdvice:
      '30 minutes brisk post-dinner walk, reduce refined sugar & deep-fried snacks, review with repeat HbA1c + Vitamin B12 in 12 weeks.',
    medicines: [
      {
        id: 'demo-med-1',
        name: 'Glycomet-SR 500 mg',
        genericName: 'Metformin Hydrochloride Sustained Release',
        dosage: '500 mg',
        frequency: '1-0-1 (Twice Daily • BD)',
        timing: 'After meals',
        durationDays: 90,
        instructions: 'Swallow whole after breakfast and dinner; do not crush sustained-release tablet.',
        confidence: 'high'
      },
      {
        id: 'demo-med-2',
        name: 'Atorva 10 mg',
        genericName: 'Atorvastatin Calcium',
        dosage: '10 mg',
        frequency: '0-0-1 (Once at Night • HS)',
        timing: 'At bedtime',
        durationDays: 90,
        instructions: 'Take once daily at bedtime. Report unexplained muscle pain or weakness to your physician.',
        confidence: 'high'
      },
      {
        id: 'demo-med-3',
        name: 'Uprise-D3 60K Capsule',
        genericName: 'Cholecalciferol 60,000 IU',
        dosage: '60,000 IU',
        frequency: 'Once Weekly (Sundays)',
        timing: 'With food',
        durationDays: 56,
        instructions: 'Take after a main meal containing healthy fats (e.g., milk or nuts) for better absorption.',
        confidence: 'high'
      }
    ]
  }
];

export const DEMO_SOAP_NOTE: ClinicianSOAPNote = {
  subjective:
    '42-year-old adult (Demo Guest) presenting for preventive metabolic follow-up with mild afternoon fatigue and recent screening lab reports showing elevated HbA1c and low Vitamin D. Denies chest pain, dyspnea, polyuria, or focal neurological deficits.',
  objective:
    '• HbA1c: 6.3% (Ref: 4.0–5.6%, Borderline) [Metabolic Panel, 18 Nov 2026]\n• Fasting Blood Glucose: 112 mg/dL (Ref: 70–99 mg/dL, Borderline)\n• 25-OH Vitamin D: 19.2 ng/mL (Ref: 30–100 ng/mL, Deficient)\n• LDL-C: 138 mg/dL (Ref: <100 mg/dL, Borderline) | Creatinine: 0.88 mg/dL (Normal)\n• Active Rx: Metformin SR 500 mg BD PC, Atorvastatin 10 mg HS, Cholecalciferol 60,000 IU weekly.',
  assessment:
    'Early metabolic syndrome risk profile characterized by prediabetes (HbA1c 6.3%), mild hypercholesterolemia (LDL 138 mg/dL), and symptomatic Vitamin D deficiency (19.2 ng/mL) with preserved renal function.',
  differentials: [
    {
      condition: 'Impaired Glucose Tolerance / Prediabetes with Vitamin D Deficiency',
      likelihood: 'Primary Consideration',
      rationale:
        'Concordant HbA1c 6.3% and FBG 112 mg/dL alongside 25-OH Vitamin D 19.2 ng/mL explain mild fatigue and metabolic risk.'
    },
    {
      condition: 'Early Dyslipidemia / Cardiometabolic Risk',
      likelihood: 'Secondary',
      rationale:
        'Borderline LDL-C (138 mg/dL) warrants 10-year ASCVD risk stratification and lifestyle + low-dose statin follow-up.'
    },
    {
      condition: 'Subclinical Hypothyroidism or Vitamin B12 Deficiency',
      likelihood: 'Rule Out',
      rationale:
        'Common co-existing causes of fatigue in Indian adults on Metformin; verify TSH and Serum B12 if fatigue persists.'
    }
  ],
  plan: [
    'Continue Metformin SR 500 mg BD after meals and Atorvastatin 10 mg HS; reinforce adherence via daily reminders.',
    'Complete 8-week loading course of Cholecalciferol 60,000 IU weekly with meals, then re-evaluate maintenance dosing.',
    'Order 12-week follow-up panel: repeat HbA1c, Fasting Lipid Profile, Serum Vitamin B12, TSH, and baseline LFT (ALT/AST).',
    'Counsel on ICMR-NIN balanced plate (increase dal/protein & high-fiber vegetables; 30-min post-meal walk 5 days/week).'
  ],
  drugInteractionWarnings: [
    'Long-term Metformin therapy can reduce intestinal Vitamin B12 absorption — monitor Serum B12 annually or if tingling/fatigue develops.',
    'Atorvastatin 10 mg: advise patient to avoid heavy grapefruit intake and report new proximal myalgia or dark urine.'
  ],
  uncertaintyMarkers: [
    'Physical exam vitals (BP, BMI, waist circumference) and baseline TSH/LFT values are not present in uploaded vault records.',
    'AI-assisted educational SOAP draft — requires licensed clinician verification before clinical action.'
  ],
  reviewedByClinician: false
};

export const DEMO_ASSISTANT_MESSAGES: ChatMessage[] = [
  {
    id: 'demo-msg-user-1',
    sender: 'user',
    copilotMode: 'clinician',
    text: 'Draft a verifiable Clinician SOAP Note synthesizing my latest HbA1c, Vitamin D, Lipid Panel, and active Metformin / Atorvastatin prescription.',
    timestamp: 'Demo Preview'
  },
  {
    id: 'demo-msg-soap-1',
    sender: 'assistant',
    copilotMode: 'clinician',
    poweredBy: 'Gemini 4 Hydrogen + Dual-Layer RAG (Demo Preview)',
    text: 'I synthesized your sample **Metabolic & HbA1c Panel (18 Nov 2026)**, **Fasting Lipid Profile (29 Oct 2026)**, and **Dr. Ananya Kulkarni’s Prescription** alongside **ICMR-NIN & WHO** references into a structured SOAP clinical draft below.\n\n*You are viewing a read-only Live Demo preview. Sign in to chat live with Gemini 4 Hydrogen using your own encrypted records.*',
    timestamp: 'Demo Preview',
    soapNote: DEMO_SOAP_NOTE,
    sources: [
      { organization: 'ICMR-NIN Indian Dietary Guidelines', year: 2024 },
      { organization: 'WHO Package of Essential NCD Interventions', year: 2023 }
    ],
    uncertaintyNote:
      'Read-only Live Demo SOAP preview. Sign in for live Gemini 4 Hydrogen reasoning and private Health Vault indexing.'
  }
];

export const DEMO_REMINDERS: ReminderItem[] = [
  {
    id: 'demo-rem-1',
    title: 'Glycomet-SR 500 mg (Metformin)',
    type: 'medicine',
    time: '08:30',
    repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    instructions: 'Take 1 tablet after breakfast with water (Sample Demo Reminder)',
    active: true,
    createdDate: '2026-11-19',
    doctorName: 'Dr. Ananya Kulkarni',
    clinicName: 'Sahyadri Preventive Care Clinic'
  },
  {
    id: 'demo-rem-2',
    title: 'Atorva 10 mg (Atorvastatin)',
    type: 'medicine',
    time: '21:30',
    repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    instructions: 'Take 1 tablet at bedtime (Sample Demo Reminder)',
    active: true,
    createdDate: '2026-11-19',
    doctorName: 'Dr. Ananya Kulkarni'
  },
  {
    id: 'demo-rem-3',
    title: 'Uprise-D3 60,000 IU Weekly Dose',
    type: 'medicine',
    time: '13:30',
    repeatDays: ['Sun'],
    instructions: 'Take 1 capsule after Sunday lunch (Sample Demo Reminder)',
    active: true,
    createdDate: '2026-11-19'
  }
];

export const DEMO_PERIOD_LOGS: PeriodCycleEntry[] = [
  {
    id: 'demo-cycle-1',
    startDate: '2026-11-04',
    cycleLengthDays: 28,
    periodDurationDays: 5,
    symptoms: ['Mild Cramps', 'Fatigue'],
    flowIntensity: 'Medium',
    notes: 'Sample cycle log entry for Live Demo exploration.'
  }
];
