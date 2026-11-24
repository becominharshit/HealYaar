import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Heart,
  ShieldCheck,
  Database,
  Mic,
  AlertOctagon,
  FileText,
  Pill,
  Utensils,
  CalendarHeart,
  Stethoscope,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sun,
  Moon,
  Sparkles,
  BookOpen,
  UserCheck
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const { setTab, theme, toggleTheme, openEmergencyModal } = useApp();

  const navigateToAuth = (mode: 'login' | 'signup') => {
    try {
      sessionStorage.setItem('healyaar_initial_auth_mode', mode);
    } catch {
      // ignore
    }
    setTab('login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation Bar (3-zone layout) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand */}
          <a
            href="#top"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-white/20" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Heal<span className="text-teal-600 dark:text-teal-400">Yaar</span>
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                हीलयार
              </span>
            </div>
          </a>

          {/* Center: Anchor Links */}
          <nav aria-label="Landing page sections" className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
              Features
            </a>
            <a href="#how-rag-works" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
              How RAG Works
            </a>
            <a href="#privacy-security" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
              Privacy &amp; Security
            </a>
          </nav>

          {/* Right: Theme Toggle + Auth CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateToAuth('login')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => navigateToAuth('signup')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
            >
              <span className="sm:hidden">Sign Up</span>
              <span className="hidden sm:inline">Create Free Account</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-teal-50/60 via-white to-[#fbfbfa] dark:from-teal-950/30 dark:via-[#0b1220] dark:to-[#090d16]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Copy */}
              <div className="lg:col-span-7 space-y-6">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Dual-Layer Private Healthcare RAG • Voice-First • India-Ready
                </p>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                  Understand your health records in plain language—privately.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  HealYaar combines your private lab reports, prescriptions, and cycle logs with verified ICMR &amp; WHO clinical references—delivering accessible voice guidance, clinician SOAP summaries, and instant 108 / 112 / 14416 emergency red-flag guardrails.
                </p>

                {/* Primary & Secondary CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigateToAuth('login')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-md transition-colors"
                  >
                    <span>Log In to Your Health Vault</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateToAuth('signup')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-base border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    <span>Create Free Account</span>
                  </button>
                </div>

                {/* Key Trust Highlights (Clean metadata row, zero pill clutter) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" aria-hidden="true" />
                    <span>Per-user Row-Level Security</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Mic className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" aria-hidden="true" />
                    <span>English, हिन्दी &amp; Voice Readout</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" aria-hidden="true" />
                    <span>108 / 112 / 14416 Red-Flag Guard</span>
                  </div>
                </div>
              </div>

              {/* Right: Architectural Preview Card */}
              <div className="lg:col-span-5">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                        <Database className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Dual-Layer RAG Grounding
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Hybrid Vector + BM25 Verification
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                      Zero Leakage
                    </span>
                  </div>

                  {/* Layer A */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-400">
                      <span>LAYER A • YOUR ISOLATED VAULT</span>
                      <span>IndexedDB + RLS</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      CBC Panel (15 Oct 2026) — Hemoglobin 10.8 g/dL, Ferritin 14 ng/mL
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Scoped strictly to your authenticated Supabase user ID. Never shared across accounts.
                    </p>
                  </div>

                  {/* Layer B */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400">
                      <span>LAYER B • CLINICAL REFERENCE</span>
                      <span>WHO / ICMR-NIN</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Iron-Rich Thali &amp; Vitamin C Absorption Guidelines
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Plain-language explanation + questions to ask your physician, with verifiable source citations.
                    </p>
                  </div>

                  {/* Safety Footer */}
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3">
                    <div className="text-xs text-rose-900 dark:text-rose-200 font-semibold">
                      Need urgent medical or mental health help right now?
                    </div>
                    <button
                      type="button"
                      onClick={openEmergencyModal}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold whitespace-nowrap transition-colors"
                    >
                      SOS 108 / 112
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Complete Accessibility &amp; Care Suite
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Built for seniors, families, and clinicians
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Every module uses clear typography, adjustable text scaling up to A++, high-contrast mode, and bilingual voice controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'Dual-Layer RAG & Clinician Copilot',
                desc: 'Ask multi-part health questions grounded in your saved reports, or toggle Clinician Copilot Mode for structured SOAP notes with differential considerations.'
              },
              {
                icon: FileText,
                title: 'Medical Report Simplifier',
                desc: 'Upload blood work or pathology reports to see every biomarker explained in plain everyday words alongside questions to ask your doctor.'
              },
              {
                icon: Pill,
                title: 'Prescription Reader & Pill Alarms',
                desc: 'Extract medication names, timings (AC/PC/BD), and safety cautions from prescriptions, then convert verified doses into daily reminders in one click.'
              },
              {
                icon: Utensils,
                title: 'Indian Nutrition & Thali Analyzer',
                desc: 'Type real household measures like "1 katori dal, 2 rotis" for ICMR-NIN calibrated macros, plus explore balanced Indian thali recipes.'
              },
              {
                icon: CalendarHeart,
                title: 'Private Period & Cycle Sanctuary',
                desc: 'Track menstrual cycles, predicted phases, symptoms, and monthly calendar views with full edit/delete control and encrypted storage.'
              },
              {
                icon: Stethoscope,
                title: 'Symptom Triage & Verified Clinics',
                desc: 'Structured symptom guidance with automatic 108/112/14416 emergency detection, breathing pacers, and nearby regional doctor directories.'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How RAG Works */}
        <section
          id="how-rag-works"
          className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-16 sm:py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Transparent Grounding Architecture
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                How HealYaar Dual-Layer RAG works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  icon: BookOpen,
                  title: 'Ingest & Chunk Locally',
                  desc: 'When you upload a lab report, prescription, or symptom log, HealYaar splits it into semantic chunks stored inside your user-scoped IndexedDB vault and RLS-protected database.'
                },
                {
                  step: '02',
                  icon: Database,
                  title: 'Hybrid Dense + BM25 Retrieval',
                  desc: 'Every query searches both Layer A (your personal health vault) and Layer B (verified WHO / ICMR clinical reference modules), filtering noise words to cite exact clinical matches.'
                },
                {
                  step: '03',
                  icon: UserCheck,
                  title: 'Grounded, Citable Guidance',
                  desc: 'Answers cite exact personal records and clinical sources via expandable RAG Source Badges, with non-diagnostic uncertainty markers and immediate 108/112 escalation for red flags.'
                }
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-widest text-teal-700 dark:text-teal-400">
                        STEP {step.step}
                      </span>
                      <Icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Zero Data Leakage & RLS Trust Section */}
        <section id="privacy-security" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="bg-slate-900 dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-800 text-white grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Zero Data Leakage &amp; Row-Level Security</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Your medical data belongs strictly to you.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                HealYaar enforces strict authenticated sessions with PostgreSQL Row-Level Security (<code className="text-teal-300">auth.uid() = user_id</code>) on every table, zero third-party ad trackers, and one-click permanent account and vault deletion.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-200">
                {[
                  'Strict Supabase Auth gate — zero guest bypass',
                  'Isolated per-user IndexedDB RAG databases',
                  'Complete session & media track teardown on sign out',
                  'Zero advertising pixels or behavioral cookies'
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3 sm:items-end">
              <button
                type="button"
                onClick={() => navigateToAuth('signup')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-base transition-colors"
              >
                <span>Create Your Private Vault</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setTab('privacy')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 transition-colors"
              >
                <span>Read Our Privacy Policy</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Public Legal Footer (All 4 policies readable without logging in) */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-white/20" aria-hidden="true" />
                </div>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  Heal<span className="text-teal-600 dark:text-teal-400">Yaar</span> (हीलयार)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Educational AI Health Companion • Plain-language guidance, not a licensed medical diagnosis.
              </p>
            </div>

            <nav aria-label="Legal policies" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setTab('privacy')}
                className="hover:text-teal-700 dark:hover:text-teal-400 underline-offset-4 hover:underline"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setTab('terms')}
                className="hover:text-teal-700 dark:hover:text-teal-400 underline-offset-4 hover:underline"
              >
                Terms &amp; Conditions
              </button>
              <button
                type="button"
                onClick={() => setTab('cookies')}
                className="hover:text-teal-700 dark:hover:text-teal-400 underline-offset-4 hover:underline"
              >
                Cookies Policy
              </button>
              <button
                type="button"
                onClick={() => setTab('refund')}
                className="hover:text-teal-700 dark:hover:text-teal-400 underline-offset-4 hover:underline"
              >
                Refund &amp; Free-Access Policy
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <p>© {new Date().getFullYear()} HealYaar. Built with Row-Level Security &amp; Accessibility first.</p>
            <p>India Emergency Helplines: Ambulance 108 • National 112 • Tele-MANAS 14416</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
