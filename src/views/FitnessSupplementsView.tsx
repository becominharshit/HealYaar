import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SectionHero } from '../components/ui/SectionHero';
import { SupplementsIllustration } from '../components/ContextualIllustrations';
import { educationalSupplements } from '../data/educationalReferenceData';
import { SupplementInfo } from '../types';
import { supabase } from '../lib/supabase';
import { formatDisplayDate } from '../utils/healthFormatters';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  BookOpen,
  Apple,
  Stethoscope,
  Droplets,
  Footprints,
  Timer,
  Plus,
  CheckCircle2
} from 'lucide-react';

interface DailyActivityEntry {
  date: string;
  steps: number;
  walkMinutes: number;
  waterGlasses: number;
  notes?: string;
}

interface EducationalGuidanceResult {
  problemSummary: string;
  relevantNutrients: {
    name: string;
    evidenceStrength: 'Strong' | 'Moderate' | 'Limited';
    roleExplanation: string;
  }[];
  foodSourcesFirst: {
    foodName: string;
    description: string;
  }[];
  safetyConsiderations: string[];
  whenToConsultDoctor: string[];
}

const getLocalDateKey = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const FitnessSupplementsView: React.FC = () => {
  const { showToast, currentUser } = useApp();

  const [supplementCategory, setSupplementCategory] = useState<'all' | 'muscle' | 'bones' | 'hair-skin' | 'general'>('all');

  // Lightweight Daily Activity & Hydration Logger (per-user persisted, local browser timezone)
  const todayStr = getLocalDateKey();
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const [activityLogs, setActivityLogs] = useState<DailyActivityEntry[]>([]);
  const [stepsInput, setStepsInput] = useState<number>(0);
  const [walkMinutesInput, setWalkMinutesInput] = useState<number>(0);
  const [waterGlassesInput, setWaterGlassesInput] = useState<number>(0);
  const [isSavingActivity, setIsSavingActivity] = useState<boolean>(false);

  const getActivityStorageKey = (uid: string) => `healyaar_user_${uid}_activity_logs`;

  useEffect(() => {
    let isMounted = true;
    if (!currentUser?.id) {
      setActivityLogs([]);
      return;
    }

    const loadActivity = async () => {
      let localEntries: DailyActivityEntry[] = [];
      try {
        const raw = localStorage.getItem(getActivityStorageKey(currentUser.id));
        if (raw) localEntries = JSON.parse(raw);
      } catch {
        // ignore
      }

      if (supabase) {
        try {
          const { data } = await supabase
            .from('activity_logs')
            .select('log_date, steps, walk_minutes, water_glasses, notes')
            .eq('user_id', currentUser.id)
            .order('log_date', { ascending: false })
            .limit(7);
          if (data && data.length > 0) {
            localEntries = data.map((row: any) => ({
              date: row.log_date,
              steps: row.steps || 0,
              walkMinutes: row.walk_minutes || 0,
              waterGlasses: row.water_glasses || 0,
              notes: row.notes || undefined
            }));
          }
        } catch {
          // Graceful fallback to user-scoped localStorage
        }
      }

      if (!isMounted) return;
      setActivityLogs(localEntries);
      const todayEntry = localEntries.find((e) => e.date === todayStr);
      if (todayEntry) {
        setStepsInput(todayEntry.steps);
        setWalkMinutesInput(todayEntry.walkMinutes);
        setWaterGlassesInput(todayEntry.waterGlasses);
      }
    };

    void loadActivity();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, todayStr]);

  useEffect(() => {
    const handleReset = () => {
      setActivityLogs([]);
      setStepsInput(0);
      setWalkMinutesInput(0);
      setWaterGlassesInput(0);
    };
    window.addEventListener('healyaar_session_reset', handleReset);
    return () => window.removeEventListener('healyaar_session_reset', handleReset);
  }, []);

  const persistDailyActivity = async (nextSteps: number, nextWalk: number, nextWater: number, toastLabel?: string) => {
    const entry: DailyActivityEntry = {
      date: todayStr,
      steps: Math.max(0, nextSteps),
      walkMinutes: Math.max(0, nextWalk),
      waterGlasses: Math.max(0, nextWater)
    };

    setActivityLogs((prev) => {
      const updated = [entry, ...prev.filter((item) => item.date !== todayStr)].slice(0, 7);
      if (currentUser?.id) {
        try {
          localStorage.setItem(getActivityStorageKey(currentUser.id), JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return updated;
    });

    if (currentUser?.id && supabase) {
      setIsSavingActivity(true);
      try {
        await supabase
          .from('activity_logs')
          .upsert(
            {
              user_id: currentUser.id,
              log_date: todayStr,
              steps: entry.steps,
              walk_minutes: entry.walkMinutes,
              water_glasses: entry.waterGlasses
            },
            { onConflict: 'user_id,log_date' }
          );
      } catch {
        // Already saved optimistically in user-scoped localStorage
      } finally {
        setIsSavingActivity(false);
      }
    }

    if (toastLabel) showToast(toastLabel);
  };

  // "Describe Your Problem" State
  const [problemInput, setProblemInput] = useState<string>('');
  const [isAnalyzingProblem, setIsAnalyzingProblem] = useState<boolean>(false);
  const [guidanceResult, setGuidanceResult] = useState<EducationalGuidanceResult | null>(null);

  // Quick Problem Suggestion Chips
  const exampleProblems = [
    'I want to improve my workout recovery.',
    "I don't get enough protein.",
    'I feel tired during workouts.',
    "I don't get much sunlight.",
    'I have weak bones or joint stiffness.',
    'I get muscle cramps after running.'
  ];

  // Voice Assistant Event Listener
  useEffect(() => {
    const handleVoiceSupplementQuery = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>;
      const query = customEvent.detail?.query || 'workout recovery and energy';
      setProblemInput(query);
      generateEducationalGuidance(query);
      showToast('Loaded educational supplement guidance for your question.');
    };

    window.addEventListener('healyaar_voice_supplement_query', handleVoiceSupplementQuery);

    return () => {
      window.removeEventListener('healyaar_voice_supplement_query', handleVoiceSupplementQuery);
    };
  }, [showToast]);

  const generateEducationalGuidance = (rawText: string) => {
    if (!rawText.trim()) return;

    setIsAnalyzingProblem(true);

    setTimeout(() => {
      const lower = rawText.toLowerCase();
      let result: EducationalGuidanceResult;

      if (lower.includes('sunlight') || lower.includes('sun ') || lower.includes('sunshine') || lower.includes('indoor')) {
        result = {
          problemSummary: `You mentioned limited sunlight exposure: "${rawText}".`,
          relevantNutrients: [
            {
              name: 'Vitamin D3 (Cholecalciferol)',
              evidenceStrength: 'Strong',
              roleExplanation: 'This may be relevant if you spend most daytime hours indoors. Vitamin D is synthesized cutaneously when skin is exposed to UVB sunlight and is essential for calcium absorption, bone mineral density, and immune balance.'
            },
            {
              name: 'Dietary Calcium & Magnesium Co-factors',
              evidenceStrength: 'Strong',
              roleExplanation: 'This can sometimes be associated with bone metabolic balance. Vitamin D works synergistically with dietary calcium and magnesium for skeletal mineralization.'
            }
          ],
          foodSourcesFirst: [
            { foodName: 'Safe Morning Sunlight (15–20 minutes)', description: 'Brief sun exposure to arms and legs before 10 AM encourages natural cutaneous vitamin D synthesis.' },
            { foodName: 'Fortified Milk, Curd / Dahi & Plant Drinks', description: 'Often fortified with vitamin D2/D3 to support baseline dietary intake.' },
            { foodName: 'Egg Yolks & Mushrooms exposed to UV', description: 'Natural whole-food sources containing modest concentrations of bioavailable vitamin D.' }
          ],
          safetyConsiderations: [
            'A healthcare professional can determine whether testing your serum 25-hydroxy Vitamin D level is appropriate before starting high-dose weekly capsules.',
            'Never consume high-dose fat-soluble vitamins (such as Vitamin D megadoses of 60,000 IU) continuously without medical supervision, as excess accumulates in adipose tissue.',
            'Supplements do not replace balanced lifestyle factors such as outdoor activity and nutrient-dense meals.'
          ],
          whenToConsultDoctor: [
            'To order a routine 25(OH)D blood test to check your baseline level.',
            'If you experience persistent deep bone ache or generalized muscle weakness.',
            'If you have a history of kidney stones or hypercalcemia.'
          ]
        };
      } else if (lower.includes('protein') || lower.includes('muscle') || lower.includes('strength')) {
        result = {
          problemSummary: `You asked about dietary protein intake and muscular support: "${rawText}".`,
          relevantNutrients: [
            {
              name: 'Dietary Protein & Complete Amino Acids',
              evidenceStrength: 'Strong',
              roleExplanation: 'This may be relevant if your current meals lack sufficient complete proteins. Active adults generally benefit from 1.2 to 1.7 grams of protein per kilogram of body weight spread evenly across meals.'
            },
            {
              name: 'Creatine Monohydrate',
              evidenceStrength: 'Strong',
              roleExplanation: 'This can sometimes be associated with high-intensity cellular energy output. Creatine assists cellular ATP regeneration during resistance exercise and is widely researched.'
            }
          ],
          foodSourcesFirst: [
            { foodName: 'Lentils, Dals & Chickpeas (Chole / Rajma)', description: 'Rich in plant-based proteins, complex low-glycemic carbohydrates, and dietary fiber.' },
            { foodName: 'Paneer, Tofu & Greek Yogurt / Dahi', description: 'Complete protein sources providing essential branched-chain amino acids (BCAAs) and calcium.' },
            { foodName: 'Eggs, Fish & Lean Poultry (if non-vegetarian)', description: 'High biological value proteins offering complete amino acid spectrums.' }
          ],
          safetyConsiderations: [
            'Whole food protein sources provide beneficial micronutrients, fiber, and healthy lipids that isolated protein powders lack.',
            'A healthcare professional can determine whether concentrated powders are appropriate if you have any pre-existing kidney or metabolic considerations.',
            'Always maintain adequate daily hydration when consuming higher protein meals or creatine.'
          ],
          whenToConsultDoctor: [
            'If you have any history of kidney disease or elevated blood creatinine.',
            'If you experience digestive distress, persistent bloating, or nausea from commercial protein blends.',
            'Before starting specialized fitness powders during pregnancy or breastfeeding.'
          ]
        };
      } else if (lower.includes('cramp') || lower.includes('running') || lower.includes('sore') || lower.includes('recovery')) {
        result = {
          problemSummary: `You asked about workout recovery, muscle soreness, and exercise fatigue: "${rawText}".`,
          relevantNutrients: [
            {
              name: 'Magnesium (Citrate / Glycinate forms)',
              evidenceStrength: 'Moderate',
              roleExplanation: 'This can sometimes be associated with muscle relaxation and neuromuscular signaling. Athletes experiencing frequent muscle spasms often discuss magnesium intake with their clinician.'
            },
            {
              name: 'Electrolytes (Sodium & Potassium Balance)',
              evidenceStrength: 'Strong',
              roleExplanation: 'This may be relevant if you sweat heavily during training. Electrolyte depletion and intracellular dehydration are leading causes of exercise cramping.'
            }
          ],
          foodSourcesFirst: [
            { foodName: 'Bananas, Coconut Water & Melons', description: 'Natural whole-food sources of potassium and electrolytes to rehydrate cellular fluid spaces.' },
            { foodName: 'Pumpkin Seeds, Almonds & Walnuts', description: 'Abundant in natural magnesium, zinc, and anti-inflammatory polyunsaturated fats.' },
            { foodName: 'Spinach, Methi & Dark Green Leafy Greens', description: 'Natural dietary magnesium and antioxidants to support post-workout cellular repair.' }
          ],
          safetyConsiderations: [
            'Inadequate warm-up, cool-down, and fluid intake cause more cramps in healthy adults than true vitamin deficiencies.',
            'Certain forms of magnesium (like magnesium oxide) can have a mild laxative effect; gentler forms include magnesium glycinate.',
            'High supplemental magnesium can interact with certain prescription antibiotics and blood pressure medicines.'
          ],
          whenToConsultDoctor: [
            'If muscle cramps occur at rest, during sleep, or produce severe agonizing knotting.',
            'If you observe one-sided calf swelling, redness, or heat (which warrants immediate evaluation for blood clots).',
            'If you take medications that affect potassium balance (e.g. ACE inhibitors or diuretics).'
          ]
        };
      } else if (lower.includes('bone') || lower.includes('joint') || lower.includes('calcium')) {
        result = {
          problemSummary: `You asked about bone strength, joint comfort, and skeletal health: "${rawText}".`,
          relevantNutrients: [
            {
              name: 'Vitamin D3 & Dietary Calcium',
              evidenceStrength: 'Strong',
              roleExplanation: 'This may be relevant if your regular diet has limited dairy or fortified foods. Calcium forms skeletal structure, while Vitamin D facilitates active intestinal absorption.'
            },
            {
              name: 'Glucosamine & Omega-3 Lipids',
              evidenceStrength: 'Moderate',
              roleExplanation: 'This can sometimes be associated with joint cartilage maintenance and low-grade inflammatory modulation in mild joint stiffness.'
            }
          ],
          foodSourcesFirst: [
            { foodName: 'Sesame Seeds (Til) & Ragi (Finger Millet)', description: 'Traditional Indian plant sources rich in highly bioavailable dietary calcium.' },
            { foodName: 'Milk, Curd / Dahi & Fortified Plant Milks', description: 'High calcium bioavailability paired with natural proteins and phosphorus.' },
            { foodName: 'Flaxseeds (Alsi) & Walnuts', description: 'Rich in alpha-linolenic acid (ALA) omega-3s for anti-inflammatory joint support.' }
          ],
          safetyConsiderations: [
            'Nutrition science strongly recommends getting calcium primarily from food; excessive pill supplementation has been linked to vascular calcification and kidney stones.',
            'Calcium supplements can interfere with levothyroxine thyroid medication and iron absorption; take them at least 4 hours apart.',
            'A healthcare professional can determine whether bone density (DEXA) scans or Vitamin D testing are appropriate.'
          ],
          whenToConsultDoctor: [
            'If joint stiffness is accompanied by persistent heat, redness, or morning swelling lasting over 30 minutes.',
            'If you have a personal or family history of osteopenia, osteoporosis, or fragility fractures.',
            'If you have a history of kidney stones or parathyroid conditions.'
          ]
        };
      } else if (lower.includes('hair') || lower.includes('skin') || lower.includes('dry') || lower.includes('thin')) {
        result = {
          problemSummary: `You asked about hair and skin nutrition: "${rawText}".`,
          relevantNutrients: [
            {
              name: 'Omega-3 Fatty Acids (EPA & DHA)',
              evidenceStrength: 'Moderate',
              roleExplanation: 'This may be relevant for maintaining cellular lipid barriers and cutaneous hydration.'
            },
            {
              name: 'Micronutrient Spectrum (Iron, Zinc, Vitamin C)',
              evidenceStrength: 'Moderate',
              roleExplanation: 'This can sometimes be associated with hair follicle cycling. In clinical practice, diffuse hair thinning is frequently linked to low ferritin (stored iron) rather than biotin deficiencies alone.'
            }
          ],
          foodSourcesFirst: [
            { foodName: 'Flaxseeds, Chia Seeds & Walnuts', description: 'Natural plant-based omega-3s and zinc supporting keratin synthesis.' },
            { foodName: 'Amla (Indian Gooseberry) & Citrus Fruits', description: 'Abundant vitamin C, an essential cofactor for human collagen synthesis.' },
            { foodName: 'Legumes, Spinach & Beetroot', description: 'Support oxygen delivery to roots through bioavailable dietary iron.' }
          ],
          safetyConsiderations: [
            'High-dose Biotin supplements can cause dangerous false-positive or false-negative readings in emergency laboratory tests (including troponin heart markers and thyroid assays).',
            'Omega-3 supplements at higher doses have mild anti-platelet (blood thinning) actions.',
            'Supplements will not reverse genetic pattern shedding; consult a dermatologist for personalized evaluation.'
          ],
          whenToConsultDoctor: [
            'If hair shedding is sudden, patchy (circular smooth bald spots), or accompanied by eyebrow loss.',
            'If skin dryness coincides with unexplained fatigue, weight changes, or temperature sensitivity (may indicate thyroid changes).',
            'Before taking combination beauty gummies if you are on prescription medications.'
          ]
        };
      } else {
        // Generic / Energy & Vitality
        result = {
          problemSummary: `You asked for nutritional guidance regarding: "${rawText}".`,
          relevantNutrients: [
            {
              name: 'B-Complex Vitamins (B12 & Folate)',
              evidenceStrength: 'Strong',
              roleExplanation: 'This may be relevant if you follow a strictly vegetarian or plant-based diet. Vitamin B12 is essential for nerve function and red blood cell formation.'
            },
            {
              name: 'Dietary Iron & Vitamin C Pairings',
              evidenceStrength: 'Strong',
              roleExplanation: 'This can sometimes be associated with workout fatigue or low stamina. Pairing non-heme iron foods with vitamin C boosts natural absorption.'
            }
          ],
          foodSourcesFirst: [
            { foodName: 'Whole Millets (Jowar, Bajra, Ragi) & Rolled Oats', description: 'Provide sustained, low-glycemic complex carbohydrates and B vitamins.' },
            { foodName: 'Amla, Guavas & Lemon Water with Meals', description: 'Vitamin C substantially enhances plant iron uptake.' },
            { foodName: 'Soaked Almonds, Walnuts & Pumpkin Seeds', description: 'Deliver steady healthy fats, magnesium, and cellular antioxidants.' }
          ],
          safetyConsiderations: [
            'Everyday tiredness is most commonly caused by insufficient sleep, poor hydration, or psychological stress rather than a vitamin deficiency.',
            'Never consume iron supplements without verifying your hemoglobin and ferritin first; the body cannot easily excrete excess iron.',
            'Supplements are dietary adjuncts and cannot cure underlying medical conditions or substitute for professional medical care.'
          ],
          whenToConsultDoctor: [
            'If fatigue is persistent despite 8 hours of restful sleep, or accompanied by shortness of breath on mild exertion.',
            'If you have unexplained weight loss, night sweats, or recurring fevers.',
            'To order a routine Complete Blood Count (CBC) and metabolic panel.'
          ]
        };
      }

      setGuidanceResult(result);
      setIsAnalyzingProblem(false);
      showToast('Educational nutrition guidance ready.');
    }, 600);
  };

  const handleProblemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateEducationalGuidance(problemInput);
  };

  const filteredSupplements = educationalSupplements.filter((s) => {
    if (supplementCategory === 'all') return true;
    return s.category === supplementCategory;
  });

  const getEvidenceBadge = (level: SupplementInfo['evidenceStrength']) => {
    switch (level) {
      case 'Strong':
        return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black rounded-full border border-emerald-300 dark:border-emerald-800">Strong Scientific Evidence</span>;
      case 'Moderate':
        return <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-black rounded-full border border-blue-300 dark:border-blue-800">Moderate Scientific Evidence</span>;
      case 'Limited':
      case 'Mixed':
      default:
        return <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-black rounded-full border border-amber-300 dark:border-amber-800">Limited / Preliminary Evidence</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* 1. Header */}
      <SectionHero
        title="Fitness, Hydration & Supplements Library"
        badge={{
          icon: Sparkles,
          text: 'Daily Movement & Evidence',
          variant: 'teal'
        }}
        illustration={<SupplementsIllustration size="md" />}
      />

      {/* ==============================================================
          1B. LIGHTWEIGHT DAILY ACTIVITY & HYDRATION LOGGER
      ============================================================== */}
      <section className="interactive-card bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 mb-1">
              <Footprints className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Daily Activity & Hydration Logger</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Today&apos;s Movement &amp; Water Tracker ({todayFormatted})
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const nextWater = waterGlassesInput + 1;
                setWaterGlassesInput(nextWater);
                void persistDailyActivity(stepsInput, walkMinutesInput, nextWater, `Hydration updated: ${nextWater} glasses today.`);
              }}
              className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              <span>+1 Glass Water</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const nextWalk = walkMinutesInput + 10;
                const nextSteps = stepsInput + 1000;
                setWalkMinutesInput(nextWalk);
                setStepsInput(nextSteps);
                void persistDailyActivity(nextSteps, nextWalk, waterGlassesInput, `Added 10 min walk (${nextWalk} min / ${nextSteps} steps).`);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>+10 Min Walk</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void persistDailyActivity(stepsInput, walkMinutesInput, waterGlassesInput, 'Daily activity & hydration saved to your private log.');
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
        >
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <label htmlFor="daily-steps-input" className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>Steps (Goal: 7,000)</span>
            </label>
            <input
              id="daily-steps-input"
              type="number"
              min={0}
              max={60000}
              value={stepsInput}
              onChange={(e) => setStepsInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white"
            />
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((stepsInput / 7000) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <label htmlFor="daily-walk-input" className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Walk Minutes (Goal: 30)</span>
            </label>
            <input
              id="daily-walk-input"
              type="number"
              min={0}
              max={600}
              value={walkMinutesInput}
              onChange={(e) => setWalkMinutesInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white"
            />
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((walkMinutesInput / 30) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <label htmlFor="daily-water-input" className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              <span>Water Glasses (Goal: 8)</span>
            </label>
            <input
              id="daily-water-input"
              type="number"
              min={0}
              max={30}
              value={waterGlassesInput}
              onChange={(e) => setWaterGlassesInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white"
            />
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((waterGlassesInput / 8) * 100))}%` }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingActivity}
            className="h-12 px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>{isSavingActivity ? 'Saving...' : 'Save Today'}</span>
          </button>
        </form>

        {activityLogs.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              Recent Activity & Hydration Logs
            </div>
            <div className="flex flex-wrap gap-2">
              {activityLogs.slice(0, 5).map((entry) => (
                <div
                  key={entry.date}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2.5"
                >
                  <span className="font-extrabold text-slate-900 dark:text-white">{formatDisplayDate(entry.date)}</span>
                  <span className="text-indigo-700 dark:text-indigo-300 font-semibold">{entry.steps.toLocaleString()} steps</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{entry.walkMinutes} min</span>
                  <span className="text-sky-700 dark:text-sky-300 font-semibold">{entry.waterGlasses} glasses</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ==============================================================
          2. "DESCRIBE YOUR PROBLEM" INPUT AREA
      ============================================================== */}
      <section className="interactive-card glass-card rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Nutritional Explorer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Describe Your Problem or Wellness Goal
          </h2>
        </div>

        {/* Input Form */}
        <form onSubmit={handleProblemSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={2}
              value={problemInput}
              onChange={(e) => setProblemInput(e.target.value)}
              placeholder="e.g. I want to improve my workout recovery, or I don't get enough protein, or I feel tired during workouts..."
              className="w-full px-4 py-3 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none transition-colors"
            />
          </div>

          {/* Quick Problem Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Examples:</span>
            {exampleProblems.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setProblemInput(ex);
                  generateEducationalGuidance(ex);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-800 dark:hover:text-teal-300 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors"
              >
                "{ex}"
              </button>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isAnalyzingProblem || !problemInput.trim()}
              className="interactive-button px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isAnalyzingProblem ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>Reviewing Nutrition Science...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Get Safe Supplement Guidance</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* STRUCTURED RESPONSE DISPLAY */}
        {guidanceResult && (
          <div className="mt-6 p-6 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 backdrop-blur-sm border-2 border-teal-200/80 dark:border-teal-900/60 space-y-6 animate-fade-in">
            {/* 1. What You Described */}
            <div className="space-y-1 border-b border-teal-100 dark:border-teal-900/50 pb-3">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase">1. What You Described</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {guidanceResult.problemSummary}
              </p>
            </div>

            {/* 2. Relevant Nutrients with Evidence Strength */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase">2. Nutrients & Dietary Components That May Be Relevant</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {guidanceResult.relevantNutrients.map((nut, i) => (
                  <div key={i} className="interactive-card glass-card-subtle p-4 rounded-xl border border-teal-100/80 dark:border-teal-900/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{nut.name}</h4>
                      <span className="px-2 py-0.5 bg-teal-100/90 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-[10px] font-black rounded-full">
                        {nut.evidenceStrength} Evidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {nut.roleExplanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Food Sources to Try First (Whole Food First) */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                <Apple className="w-4 h-4 text-emerald-600" />
                <span>3. Whole Food Sources to Try First (Food Over Pills)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {guidanceResult.foodSourcesFirst.map((food, i) => (
                  <div key={i} className="interactive-card p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 backdrop-blur-xs border border-emerald-200/80 dark:border-emerald-900/40 space-y-1">
                    <h5 className="font-bold text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm">{food.foodName}</h5>
                    <p className="text-[11px] text-emerald-900/90 dark:text-emerald-300/90 leading-normal font-medium">{food.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Important Considerations Before Supplementing */}
            <div className="space-y-2 p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 backdrop-blur-xs border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-950 dark:text-amber-200">
              <span className="font-bold uppercase tracking-wider block text-amber-900 dark:text-amber-300">
                4. Important Considerations Before Taking Supplements:
              </span>
              <ul className="list-disc list-inside space-y-1 text-amber-900/95 dark:text-amber-200/95 font-medium">
                {guidanceResult.safetyConsiderations.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>

            {/* 5. When to Talk to a Doctor */}
            <div className="space-y-2 p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 backdrop-blur-xs border border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-950 dark:text-rose-200">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-rose-900 dark:text-rose-300">
                <Stethoscope className="w-4 h-4 text-rose-600" />
                <span>5. When to Talk to a Doctor:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-rose-900/95 dark:text-rose-200/95 font-medium">
                {guidanceResult.whenToConsultDoctor.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ==============================================================
          3. SUPPLEMENT CATALOG LIBRARY
      ============================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Explore Evidence Ratings by Category:
          </h3>
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'muscle', 'bones', 'hair-skin', 'general'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSupplementCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  supplementCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'muscle' ? 'Muscle' : cat === 'bones' ? 'Bones' : cat === 'hair-skin' ? 'Hair & Skin' : 'General'}
              </button>
            ))}
          </div>
        </div>

        {/* Supplement Cards Grid */}
        <div className="space-y-4">
          {filteredSupplements.map((sup) => (
            <div
              key={sup.id}
              className="interactive-card glass-card-content p-6 rounded-3xl shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {sup.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Target Area: {sup.commonUses}
                  </p>
                </div>
                <div>{getEvidenceBadge(sup.evidenceStrength)}</div>
              </div>

              <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {sup.plainSummary}
              </p>

              {/* Risks & Medication Interactions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-rose-50/75 dark:bg-rose-950/40 backdrop-blur-xs border border-rose-200/80 dark:border-rose-900/40 text-rose-950 dark:text-rose-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Possible Side Effects / Risks:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-900/90 dark:text-rose-300/90">
                    {sup.potentialRisks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/75 dark:bg-amber-950/40 backdrop-blur-xs border border-amber-200/80 dark:border-amber-900/40 text-amber-950 dark:text-amber-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Medication Interactions:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 dark:text-amber-300/90">
                    {sup.medicationInteractions.map((inter, i) => (
                      <li key={i}>{inter}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Verified Research Sources */}
              <div className="pt-2 border-t border-slate-100/80 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200">Verified Sources:</span>
                {sup.verifiedSources.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xs rounded-lg text-slate-700 dark:text-slate-300 font-medium border border-slate-200/80 dark:border-slate-700/80"
                  >
                    {s.organization} ({s.year}) - {s.topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==============================================================
          4. MEDICAL CAUTION (AT THE VERY BOTTOM OF THE PAGE)
      ============================================================== */}
      <footer className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/50 backdrop-blur-md border border-amber-300/80 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 flex items-start gap-3 text-xs sm:text-sm shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-amber-900 dark:text-amber-300 text-sm block">Medical Caution & Supplement Safety Notice:</strong>
          <p>
            Supplements do not substitute for a balanced whole-food diet or licensed clinical care. Never start high-dose supplements if you take prescription medications (particularly blood thinners, thyroid medicines, or antihypertensives) without consulting your prescribing physician first.
          </p>
          <p>
            HealYaar provides educational information only and does not diagnose conditions, prescribe supplement dosages, or endorse commercial brands. Always discuss persistent or severe symptoms directly with a qualified doctor.
          </p>
        </div>
      </footer>
    </div>
  );
};
