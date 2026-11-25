import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquareHeart,
  Activity,
  FileSpreadsheet,
  UtensilsCrossed,
  Stethoscope,
  Dumbbell,
  Pill,
  Brain,
  CalendarHeart,
  BellRing,
  Mic,
  MicOff,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  BookOpen,
  HeartPulse,
  PhoneCall,
  Send,
  HelpCircle,
  Bot,
  Clock,
  Calendar,
  FileText,
  RefreshCw
} from 'lucide-react';
import { NavTab } from '../types';
import { HealthOverviewIllustration } from '../components/ContextualIllustrations';
import { Tooltip } from '../components/ui/Tooltip';
import { medicalReportService } from '../services/medicalReportService';
import { prescriptionService } from '../services/prescriptionService';
import { DEMO_SOAP_NOTE } from '../data/demoData';
import {
  CapsuleTwoTone,
  StethoscopeCurved,
  NutrientMolecule,
  AppleFresh,
  MedicalCross3D,
  NeuralSynapse,
  AIOrbGlowing,
  SereneCloud,
  ReportClipboard,
  SecurityShieldCross
} from '../components/floating/FloatingThematicObjects';

export const HomeView: React.FC = () => {
  const {
    setTab,
    t,
    startVoiceListening,
    stopVoiceListening,
    isListening,
    openEmergencyModal,
    reminders,
    currentUser,
    isDemoMode
  } = useApp();

  const [quickProblemInput, setQuickProblemInput] = useState('');
  const [isSymptomVoiceActive, setIsSymptomVoiceActive] = useState(false);

  // Home AI Assistant Section Interactive States
  const [homeAssistantQuery, setHomeAssistantQuery] = useState('');
  const [isAssistantVoiceActive, setIsAssistantVoiceActive] = useState(false);
  const [homeAssistantAnswer, setHomeAssistantAnswer] = useState<{
    query: string;
    answer: string;
    suggestion: string;
  } | null>(null);

  // Recent Items Summary
  const [recentReportTitle, setRecentReportTitle] = useState<string | null>(null);
  const [recentRxTitle, setRecentRxTitle] = useState<string | null>(null);
  const [isLoadingRecentItems, setIsLoadingRecentItems] = useState<boolean>(false);
  const [recentItemsError, setRecentItemsError] = useState<string | null>(null);
  const [recentItemsReloadKey, setRecentItemsReloadKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const userId = currentUser?.id;

    if (!userId) {
      setRecentReportTitle(null);
      setRecentRxTitle(null);
      setRecentItemsError(null);
      setIsLoadingRecentItems(false);
      return () => {
        isMounted = false;
      };
    }

    const loadRecentItems = async () => {
      setIsLoadingRecentItems(true);
      setRecentItemsError(null);
      try {
        const [reportsResult, prescriptionsResult] = await Promise.allSettled([
          medicalReportService.getReports(userId),
          prescriptionService.getPrescriptions(userId)
        ]);

        if (!isMounted) return;

        const failedSources: string[] = [];

        if (reportsResult.status === 'fulfilled') {
          const reps = reportsResult.value;
          setRecentReportTitle(reps && reps.length > 0 ? reps[0].title : null);
        } else {
          failedSources.push('recent medical reports');
        }

        if (prescriptionsResult.status === 'fulfilled') {
          const rxs = prescriptionsResult.value;
          setRecentRxTitle(
            rxs && rxs.length > 0
              ? rxs[0].doctorName
                ? `Rx by ${rxs[0].doctorName}`
                : 'Uploaded Slip'
              : null
          );
        } else {
          failedSources.push('recent prescriptions');
        }

        if (failedSources.length > 0) {
          setRecentItemsError(
            `Could not load your ${failedSources.join(' and ')}. Please check your connection and try again.`
          );
        }
      } catch (err) {
        if (!isMounted) return;
        setRecentItemsError(
          err instanceof Error
            ? `Could not load your recent health records: ${err.message}`
            : 'Could not load your recent health records. Please try again.'
        );
      } finally {
        if (isMounted) {
          setIsLoadingRecentItems(false);
        }
      }
    };

    void loadRecentItems();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, recentItemsReloadKey]);

  // Next active reminder (medicine or appointment)
  const nextReminder = reminders.find((r) => r.active);

  const toolCards: {
    id: NavTab;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }[] = [
    {
      id: 'assistant',
      title: t.nav.assistant,
      description: t.home.cardAssistantDesc,
      icon: <MessageSquareHeart className="w-7 h-7 text-teal-600 dark:text-teal-400" aria-hidden="true" />,
      color: 'border-teal-200/60 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/30 hover:border-teal-400',
      badge: t.home.badgeRag
    },
    {
      id: 'symptoms',
      title: t.nav.symptoms,
      description: t.home.cardSymptomsDesc,
      icon: <Activity className="w-7 h-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />,
      color: 'border-blue-200/60 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/30 hover:border-blue-400'
    },
    {
      id: 'reports',
      title: t.nav.reports,
      description: t.home.cardReportsDesc,
      icon: <FileSpreadsheet className="w-7 h-7 text-purple-600 dark:text-purple-400" aria-hidden="true" />,
      color: 'border-purple-200/60 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/30 hover:border-purple-400',
      badge: t.home.badgeSecureOcr
    },
    {
      id: 'medicines',
      title: t.nav.medicines,
      description: t.home.cardMedicinesDesc,
      icon: <Pill className="w-7 h-7 text-rose-600 dark:text-rose-400" aria-hidden="true" />,
      color: 'border-rose-200/60 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/30 hover:border-rose-400',
      badge: t.home.badgeRxReader
    },
    {
      id: 'doctors',
      title: t.nav.doctors,
      description: t.home.cardDoctorsDesc,
      icon: <Stethoscope className="w-7 h-7 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
      color: 'border-emerald-200/60 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30 hover:border-emerald-400',
      badge: t.home.badgeNearby
    },
    {
      id: 'nutrition',
      title: t.nav.nutrition,
      description: t.home.cardNutritionDesc,
      icon: <UtensilsCrossed className="w-7 h-7 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
      color: 'border-amber-200/60 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/30 hover:border-amber-400'
    },
    {
      id: 'period',
      title: t.nav.period,
      description: t.home.cardPeriodDesc,
      icon: <CalendarHeart className="w-7 h-7 text-pink-600 dark:text-pink-400" aria-hidden="true" />,
      color: 'border-pink-200/60 dark:border-pink-800/60 bg-pink-50/40 dark:bg-pink-950/30 hover:border-pink-400',
      badge: t.home.badgePrivate
    },
    {
      id: 'reminders',
      title: t.nav.reminders,
      description: t.home.cardRemindersDesc,
      icon: <BellRing className="w-7 h-7 text-orange-600 dark:text-orange-400" aria-hidden="true" />,
      color: 'border-orange-200/60 dark:border-orange-800/60 bg-orange-50/40 dark:bg-orange-950/30 hover:border-orange-400',
      badge: t.home.badgeAlarms
    },
    {
      id: 'mental',
      title: t.nav.mental,
      description: t.home.cardMentalDesc,
      icon: <Brain className="w-7 h-7 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />,
      color: 'border-cyan-200/60 dark:border-cyan-800/60 bg-cyan-50/40 dark:bg-cyan-950/30 hover:border-cyan-400'
    },
    {
      id: 'fitness',
      title: t.nav.fitness,
      description: t.home.cardFitnessDesc,
      icon: <Dumbbell className="w-7 h-7 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />,
      color: 'border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/30 hover:border-indigo-400',
      badge: t.home.badgeDailyLog
    }
  ];

  const handleSymptomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProblemInput.trim()) return;
    sessionStorage.setItem('healyaar_pending_symptom_problem', quickProblemInput);
    setTab('symptoms');
  };

  const handleToggleSymptomVoice = () => {
    if (isSymptomVoiceActive) {
      stopVoiceListening();
      setIsSymptomVoiceActive(false);
    } else {
      setIsSymptomVoiceActive(true);
      startVoiceListening((spokenText) => {
        setIsSymptomVoiceActive(false);
        setQuickProblemInput((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
        sessionStorage.setItem('healyaar_pending_symptom_problem', spokenText);
        setTab('symptoms');
      });
    }
  };

  // Home AI Assistant Quick Answer Generator
  const handleHomeAssistantAsk = (query: string) => {
    const q = query.trim();
    if (!q) return;

    const lower = q.toLowerCase();
    let ans = 'I am here to help you understand this in simple, everyday language.';
    let sugg = 'You can ask for natural home care, dietary adjustments, or clinic guidance.';

    if (lower.includes('hba1c') || lower.includes('sugar') || lower.includes('glucose') || lower.includes('diabetes')) {
      ans = "HbA1c measures your average blood sugar over the last 2 to 3 months. A value of 6.2% is in the 'prediabetes' range (5.7% to 6.4%). It means your cells are becoming slightly resistant to insulin, but early lifestyle steps like 30 minutes of daily walking and reducing refined sugar can often reverse it.";
      sugg = 'Explore the Medical Lab Report Simplifier or check healthy Indian meal suggestions.';
    } else if (lower.includes('knee') || lower.includes('stiff') || lower.includes('joint') || lower.includes('walk')) {
      ans = 'Morning knee stiffness that eases after light movement is common in early osteoarthritis or cartilage wear. Warm compresses, gentle seated knee extensions, and avoiding sudden deep squats can significantly reduce morning aches.';
      sugg = 'Check our Senior Knee Exercise Guide or find nearby Orthopedic specialists.';
    } else if (lower.includes('cold') || lower.includes('headache') || lower.includes('fever') || lower.includes('throat')) {
      ans = 'Mild tension headaches and scratchy throats often improve with hydration, resting away from screen glare, and gentle neck relaxation. If fever stays above 101°F or lasts more than 3 days, see a general physician.';
      sugg = 'Explore safe home remedies or check emergency red flags.';
    } else {
      ans = `Regarding "${q}": Most mild symptoms can be assessed by tracking duration, intensity, and warning signs. Keeping hydrated and resting helps while observing if medical evaluation is required.`;
      sugg = 'Open the full conversation to ask specific follow-ups or check related medicines.';
    }

    setHomeAssistantAnswer({ query: q, answer: ans, suggestion: sugg });
  };

  const handleToggleAssistantVoice = () => {
    if (isAssistantVoiceActive) {
      stopVoiceListening();
      setIsAssistantVoiceActive(false);
    } else {
      setIsAssistantVoiceActive(true);
      startVoiceListening((spokenText) => {
        setIsAssistantVoiceActive(false);
        setHomeAssistantQuery(spokenText);
        handleHomeAssistantAsk(spokenText);
      });
    }
  };

  const handleOpenFullAssistant = (prefill?: string) => {
    const query = prefill || homeAssistantQuery || (homeAssistantAnswer ? homeAssistantAnswer.query : '');
    if (query) {
      sessionStorage.setItem('healyaar_pending_voice_query', query);
    }
    setTab('assistant');
  };

  return (
    <div className="space-y-10 animate-fade-in pb-16 overflow-x-clip relative">
      {/* 1. WELCOME & TRUST BANNER */}
      <section className="relative z-10 rounded-2xl glass-card-hero bg-gradient-to-r from-teal-900/75 via-teal-950/80 to-slate-900/80 text-white p-4 sm:p-5 shadow-sm border border-teal-500/30 dark:border-teal-400/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-500/30 border border-teal-400/40 text-teal-200 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-yellow-300" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-white flex flex-wrap items-center gap-2">
              <span className="break-words">
                {currentUser?.name ? `${t.home.welcomeHeading} — ${currentUser.name}` : t.home.welcomeHeading}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 text-[10px] font-semibold border border-teal-400/30 whitespace-nowrap">
                {t.home.encryptedVault}
              </span>
            </h1>
            <p className="text-xs text-teal-100/90 mt-0.5 leading-snug">
              {t.home.welcomeSubheading}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-teal-200/90 bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-700/50 self-start md:self-auto flex-shrink-0 backdrop-blur-xs">
          <Info className="w-3.5 h-3.5 text-teal-300 flex-shrink-0" aria-hidden="true" />
          <span>{t.disclaimerBadge}</span>
        </div>
      </section>

      {/* DEMO MODE: Instant Clinician SOAP Note Preview Card */}
      {isDemoMode && (
        <section
          aria-label="Demo Clinician SOAP Note Preview"
          className="relative z-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800/80 shadow-sm p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Stethoscope className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Clinician Copilot SOAP Note Preview (Sample Patient)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synthesized from Demo HbA1c Panel (6.3%), Vitamin D (19.2 ng/mL), Lipid Profile &amp; Active Rx
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('assistant')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
              >
                <span>Open Full SOAP Draft</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setTab('reports')}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                Sample Lab Reports
              </button>
              <button
                type="button"
                onClick={() => setTab('medicines')}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                Sample Rx
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                S / O — Subjective &amp; Key Labs
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{DEMO_SOAP_NOTE.subjective}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                A / P — Assessment &amp; Drug Safety Check
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{DEMO_SOAP_NOTE.assessment}</p>
              <p className="text-rose-700 dark:text-rose-300 font-semibold pt-1">
                ⚠ {DEMO_SOAP_NOTE.drugInteractionWarnings[0]}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 2. "WHAT CAN I DO NEXT?" & UPCOMING REMINDER SUMMARY */}
      <section className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{t.home.whatNextTitle}</span>
          </h2>
          <button
            onClick={() => setTab('reminders')}
            className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
          >
            {t.home.manageReminders}
          </button>
        </div>

        {recentItemsError && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="font-medium">{recentItemsError}</span>
            </div>
            <button
              type="button"
              disabled={isLoadingRecentItems}
              onClick={() => setRecentItemsReloadKey((prev) => prev + 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors disabled:opacity-50 self-start sm:self-auto whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecentItems ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isLoadingRecentItems ? 'Retrying...' : 'Retry'}</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1: Check Symptoms */}
          <button
            onClick={() => setTab('symptoms')}
            className="interactive-card p-4 rounded-2xl border border-teal-200/70 dark:border-teal-800/70 bg-white dark:bg-slate-900 hover:border-teal-400 dark:hover:border-teal-500 shadow-2xs text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block group-hover:text-teal-600">
                  {t.home.actionSymptomsTitle}
                </span>
                <span className="text-[11px] text-slate-500">{t.home.actionSymptomsSub}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Action 2: Upload Report */}
          <button
            onClick={() => setTab('reports')}
            className="interactive-card p-4 rounded-2xl border border-purple-200/70 dark:border-purple-800/70 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 shadow-2xs text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block group-hover:text-purple-600">
                  {t.home.actionReportsTitle}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {isLoadingRecentItems
                    ? 'Loading latest report...'
                    : recentReportTitle || t.home.actionReportsSub}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* Action 3: Review Prescription */}
          <button
            onClick={() => setTab('medicines')}
            className="interactive-card p-4 rounded-2xl border border-rose-200/70 dark:border-rose-800/70 bg-white dark:bg-slate-900 hover:border-rose-400 dark:hover:border-rose-500 shadow-2xs text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex-shrink-0">
                <Pill className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block group-hover:text-rose-600">
                  {t.home.actionRxTitle}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {isLoadingRecentItems
                    ? 'Loading latest prescription...'
                    : recentRxTitle || t.home.actionRxSub}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* Action 4: Find Doctor */}
          <button
            onClick={() => setTab('doctors')}
            className="interactive-card p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/70 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-2xs text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block group-hover:text-emerald-600">
                  {t.home.actionDoctorsTitle}
                </span>
                <span className="text-[11px] text-slate-500">{t.home.actionDoctorsSub}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Next Scheduled Reminder / Activity Card (if active) */}
        {nextReminder && (
          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-xl flex-shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  Next Up: {nextReminder.type === 'appointment' ? '🩺 Appointment' : '💊 Dose'}
                </span>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {nextReminder.title} at {nextReminder.time}
                </h4>
                <p className="text-slate-500 text-xs truncate max-w-md">
                  {nextReminder.instructions}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTab('reminders')}
              className="px-4 py-1.5 bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 rounded-xl font-bold text-xs hover:bg-teal-100 transition-colors self-start sm:self-auto"
            >
              View Schedule
            </button>
          </div>
        )}
      </section>

      {/* Floating 3D Artwork Bridge */}
      <div className="relative -my-6 h-0 pointer-events-none select-none z-1 overflow-visible">
        <div
          className="absolute -top-16 sm:-top-20 right-2 sm:right-10 float-drift-1"
          style={{ width: 'clamp(200px, 26vw, 300px)', opacity: 0.52 }}
          aria-hidden="true"
        >
          <CapsuleTwoTone className="w-full h-auto drop-shadow-md -rotate-24" />
        </div>
      </div>

      {/* 3. SYMPTOM GUIDANCE: "DESCRIBE YOUR PROBLEM" */}
      <section className="interactive-card glass-card rounded-3xl p-6 sm:p-8 border border-white/70 dark:border-slate-700/60 shadow-glass space-y-5 relative z-2 overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-teal-50/70 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200/60 dark:border-teal-800/60">
              <HeartPulse className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Symptom Guidance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Describe your symptoms
            </h2>
          </div>

          <div className="hidden sm:flex flex-shrink-0 p-2 rounded-2xl glass-card-subtle border border-white/60 dark:border-slate-700/50">
            <HealthOverviewIllustration size="lg" />
          </div>
        </div>

        {/* Input area — flex layout ensures placeholder never clips under voice controls in A++ mode */}
        <form onSubmit={handleSymptomSubmit} className="space-y-3">
          <label htmlFor="home-symptom-input" className="sr-only">
            {t.home.searchPlaceholder}
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border-2 border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus-within:border-teal-500 p-1.5 shadow-xs">
            <input
              id="home-symptom-input"
              type="text"
              value={quickProblemInput}
              onChange={(e) => setQuickProblemInput(e.target.value)}
              placeholder={t.home.searchPlaceholder}
              className="flex-1 min-w-0 px-3.5 py-2.5 bg-transparent text-slate-900 dark:text-slate-100 text-sm sm:text-base font-medium placeholder-slate-400 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-1.5 px-1.5 flex-shrink-0">
              {quickProblemInput && (
                <button
                  type="button"
                  onClick={() => setQuickProblemInput('')}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                >
                  {t.actions.clear}
                </button>
              )}

              <Tooltip content={isSymptomVoiceActive ? 'Stop dictation' : 'Speak symptoms'} position="top">
                <button
                  type="button"
                  onClick={handleToggleSymptomVoice}
                  className={`p-2.5 rounded-xl transition-all shadow-xs ${
                    isSymptomVoiceActive || isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                  }`}
                  aria-label="Speak symptoms"
                >
                  {isSymptomVoiceActive || isListening ? (
                    <MicOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Mic className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Quick suggestions:</span>
              {[
                'Headache since yesterday',
                'Stomach ache after lunch',
                'Knee stiffness in morning'
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setQuickProblemInput(ex);
                    sessionStorage.setItem('healyaar_pending_symptom_problem', ex);
                    setTab('symptoms');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-800 transition-colors"
                >
                  "{ex}"
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!quickProblemInput.trim()}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-extrabold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
            >
              <span>Assess</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </section>

      {/* 4. HEALTH TOOLS GRID */}
      <section className="space-y-4 relative z-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t.home.sectionToolsTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {toolCards.map((card) => (
            <button
              key={card.id}
              onClick={() => setTab(card.id)}
              className="interactive-card glass-card-content p-5 rounded-3xl border border-white/70 dark:border-slate-700/50 hover:border-teal-400 text-left shadow-glass flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 glass-card-subtle rounded-2xl group-hover:scale-105 transition-transform duration-200 border border-white/60 dark:border-slate-700/60">
                    {card.icon}
                  </div>
                  {card.badge && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                      {card.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                  {card.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">
                <span>{t.home.openLabel} {card.title}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5. PLAIN-LANGUAGE TERMS */}
      <section className="interactive-card glass-card rounded-3xl border border-white/70 dark:border-slate-700/50 p-6 shadow-glass relative z-2 space-y-4">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Medical Terms in Plain Language
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl glass-card-subtle border border-white/60 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Hypertension</h4>
            <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              High blood pressure. Blood pushes too hard against artery walls during circulation.
            </p>
          </div>
          <div className="p-4 rounded-2xl glass-card-subtle border border-white/60 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Fasting Blood Sugar</h4>
            <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Glucose level after 8+ hours without food. Evaluates insulin efficiency.
            </p>
          </div>
          <div className="p-4 rounded-2xl glass-card-subtle border border-white/60 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Hemoglobin</h4>
            <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Protein in red blood cells that carries oxygen to muscles and brain.
            </p>
          </div>
        </div>
      </section>

      {/* 6. HOME AI ASSISTANT SECTION */}
      <section
        id="home-ai-assistant"
        className="relative z-2 rounded-3xl glass-card-hero border border-teal-500/35 dark:border-teal-400/25 p-6 sm:p-8 shadow-elevated space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-teal-50/80 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-300/60 dark:border-teal-700/60">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>Grounded Assistant</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Ask anything about your health
            </h2>
          </div>

          <button
            onClick={() => handleOpenFullAssistant()}
            className="interactive-button px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 border border-teal-200 dark:border-teal-800 self-start md:self-auto"
          >
            <Bot className="w-4 h-4" />
            <span>Full Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Question Input */}
        <div className="space-y-2">
          <label htmlFor="home-assistant-input" className="sr-only">
            {t.home.searchPlaceholder}
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border-2 border-teal-200/80 dark:border-teal-800/80 bg-white/95 dark:bg-slate-900/95 focus-within:border-teal-500 p-1.5 shadow-sm">
            <input
              id="home-assistant-input"
              type="text"
              value={homeAssistantQuery}
              onChange={(e) => setHomeAssistantQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleHomeAssistantAsk(homeAssistantQuery);
                }
              }}
              placeholder={t.home.searchPlaceholder}
              className="flex-1 min-w-0 px-3.5 py-2 bg-transparent text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-1.5 px-1 flex-shrink-0">
              <Tooltip content={isAssistantVoiceActive ? 'Stop listening' : 'Speak question'} position="top">
                <button
                  type="button"
                  onClick={handleToggleAssistantVoice}
                  className={`p-2 rounded-xl transition-all shadow-xs ${
                    isAssistantVoiceActive || isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                  }`}
                  aria-label="Speak health question"
                >
                  {isAssistantVoiceActive || isListening ? (
                    <MicOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Mic className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </Tooltip>

              <button
                type="button"
                onClick={() => handleHomeAssistantAsk(homeAssistantQuery)}
                disabled={!homeAssistantQuery.trim()}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 whitespace-nowrap"
              >
                <span>{t.home.askButton}</span>
                <Send className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Popular:</span>
            {[
              "What does 'HbA1c 6.2%' mean?",
              'Morning knee stiffness tips',
              'Home care for mild cold'
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setHomeAssistantQuery(prompt);
                  handleHomeAssistantAsk(prompt);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-slate-700 dark:text-slate-300 text-[11px]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Answer Card */}
        {homeAssistantAnswer && (
          <div className="p-5 rounded-2xl glass-card-hero border border-teal-400/50 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Plain-Language Explanation:</span>
              </span>
              <span className="text-slate-400 font-normal">Just now</span>
            </div>

            <p className="text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {homeAssistantAnswer.answer}
            </p>

            <div className="pt-2 border-t border-teal-100 dark:border-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 italic">💡 {homeAssistantAnswer.suggestion}</span>
              <button
                type="button"
                onClick={() => handleOpenFullAssistant(homeAssistantAnswer.query)}
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline self-start sm:self-auto"
              >
                Open in Full Assistant →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 7. EMERGENCY SOS BAR */}
      <section
        aria-label="Emergency Medical Assistance"
        className="glass-card-subtle p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 animate-pulse" />
          <div>
            <h3 className="font-bold text-rose-950 dark:text-rose-100 text-sm">
              Chest pain, severe breathing trouble, or sudden collapse?
            </h3>
            <p className="text-rose-800 dark:text-rose-300">
              Do not wait. Call emergency medical responders (108 / 112) immediately.
            </p>
          </div>
        </div>

        <Tooltip content="Open emergency dialer" position="left">
          <button
            onClick={openEmergencyModal}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call SOS (108 / 112)</span>
          </button>
        </Tooltip>
      </section>
    </div>
  );
};
