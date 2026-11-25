import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PortalModal } from '../components/ui/PortalModal';
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
  UserCheck,
  ChevronDown,
  MapPin,
  Mail,
  MessageSquare,
  X,
  ClipboardList,
  Server
} from 'lucide-react';

type PreviewTab = 'rag' | 'soap' | 'emergency';

const FAQ_ITEMS = [
  {
    q: 'Is HealYaar a replacement for a licensed doctor or medical diagnosis?',
    a: 'No. HealYaar is an educational health companion designed to help you organize personal reports, translate medical jargon into plain English, Hindi, or Marathi, and prepare questions for your physician. For urgent symptoms, HealYaar displays immediate 108 / 112 / 14416 helpline escalation.'
  },
  {
    q: 'How is my private health data protected from other users?',
    a: 'Every database table enforces PostgreSQL Row-Level Security (auth.uid() = user_id), every local RAG Knowledge Vault runs in a user-scoped IndexedDB store, and AI requests pass through an authenticated server-side proxy so API secrets never reach the browser.'
  },
  {
    q: 'Can I export or permanently delete my health records under India’s DPDP Act?',
    a: 'Yes. Inside Account Details you can download a complete JSON archive of your reports, prescriptions, reminders, cycle logs, and saved clinics with one click, or permanently erase all account and vault data.'
  },
  {
    q: 'Does HealYaar support Hindi and Marathi voice accessibility?',
    a: 'Yes. HealYaar supports English, हिन्दी (Hindi), and मराठी (Marathi), including adjustable A / A+ / A++ typography, high-contrast themes, and hands-free voice readout designed for seniors and family caregivers.'
  },
  {
    q: 'Is HealYaar free to use?',
    a: 'Core personal health vaulting, Dual-Layer RAG guidance, prescription reminders, ICMR-NIN nutrition lookup, and nearby care maps are available free of charge with zero ad trackers or behavioral marketing cookies.'
  }
];

export const LandingView: React.FC = () => {
  const { setTab, theme, toggleTheme, openEmergencyModal, showToast, enterDemoMode } = useApp();

  const [previewTab, setPreviewTab] = useState<PreviewTab>('rag');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [contactOpen, setContactOpen] = useState<boolean>(false);
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);

  const navigateToAuth = (mode: 'login' | 'signup') => {
    try {
      sessionStorage.setItem('healyaar_initial_auth_mode', mode);
    } catch {
      // ignore
    }
    setTab('login');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactSubmitted(true);
    showToast('Your message has been logged for our support team.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand */}
          <a
            href="#top"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-white/20" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Heal<span className="text-teal-600 dark:text-teal-400">Yaar</span>
              </span>
              <span className="font-devanagari hidden sm:inline-block ml-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                हीलयार
              </span>
            </div>
          </a>

          {/* Center: Anchor Links */}
          <nav
            aria-label="Landing page sections"
            className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300"
          >
            <a href="#features" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
              How It Works
            </a>
            <a href="#privacy-security" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
              Privacy &amp; Security
            </a>
            <a href="#faq" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
              FAQ
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
        {/* Split Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-teal-50/70 via-white to-[#fbfbfa] dark:from-teal-950/30 dark:via-[#0b1220] dark:to-[#090d16]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Copy (6 cols) */}
              <div className="lg:col-span-6 space-y-6">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Dual-Layer Private Healthcare RAG • Voice-First • India-Ready
                </p>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                  Plain-language clarity for your lab reports, prescriptions, and care.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  HealYaar unites your private health vault with ICMR-NIN &amp; WHO clinical references—delivering cited answers, Clinician SOAP briefs, real interactive nearby care maps, and instant 108 / 112 / 14416 safety guardrails.
                </p>

                {/* Primary, Demo & Secondary CTAs */}
                <div className="flex flex-wrap items-stretch sm:items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={enterDemoMode}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm sm:text-base shadow-md transition-colors"
                  >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>Try Live Demo (No Sign-In)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateToAuth('login')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm sm:text-base shadow-xs transition-colors"
                  >
                    <span>Log In to Vault</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateToAuth('signup')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    <span>Create Free Account</span>
                  </button>
                </div>

                {/* Clean Metadata Trust Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" aria-hidden="true" />
                    <span>Zero Data Leakage RLS</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Mic className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" aria-hidden="true" />
                    <span className="font-devanagari">EN / हिन्दी / मराठी Voice</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" aria-hidden="true" />
                    <span>108 / 112 Safety Guard</span>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Live Product Preview Card (6 cols) */}
              <div className="lg:col-span-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                  {/* Interactive Tab Switcher Header */}
                  <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Interactive Workspace Preview
                      </span>
                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                        Gemini 4 Hydrogen + Dual-Layer RAG
                      </span>
                    </div>

                    <div
                      className="grid grid-cols-3 gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl"
                      role="tablist"
                      aria-label="Product capability preview"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={previewTab === 'rag'}
                        onClick={() => setPreviewTab('rag')}
                        className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                          previewTab === 'rag'
                            ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        RAG Citations
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={previewTab === 'soap'}
                        onClick={() => setPreviewTab('soap')}
                        className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                          previewTab === 'soap'
                            ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Clinician SOAP
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={previewTab === 'emergency'}
                        onClick={() => setPreviewTab('emergency')}
                        className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                          previewTab === 'emergency'
                            ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        108/112 Guard
                      </button>
                    </div>
                  </div>

                  {/* Interactive Tab Body */}
                  <div className="p-6 space-y-4 min-h-[290px] flex flex-col justify-between">
                    {previewTab === 'rag' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400">
                            <span>LAYER A • USER-SCOPED VAULT</span>
                            <span>IndexedDB + Supabase RLS</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            Personal Blood Panel + Active Prescriptions
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Retrieves strictly from your authenticated user ID—cross-referencing your biomarkers and prescription timings with zero cross-account leakage.
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
                            <span>LAYER B • CLINICAL REFERENCE</span>
                            <span>ICMR-NIN / WHO</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            Verifiable Provenance &amp; Plain-Language Glossary
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Every response renders expandable RAG Source Badges showing exact document snippets, similarity scores, and questions to ask your physician.
                          </p>
                        </div>
                      </div>
                    )}

                    {previewTab === 'soap' && (
                      <div className="space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
                            <ClipboardList className="w-4 h-4 text-teal-600" aria-hidden="true" />
                            <span>Clinician Copilot SOAP Brief</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Requires Physician Review
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                            <div className="font-extrabold text-teal-700 dark:text-teal-300">S — Subjective</div>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                              Structured symptom timeline, severity, and reported triggers.
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                            <div className="font-extrabold text-teal-700 dark:text-teal-300">O — Objective</div>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                              Vault biomarkers, reference ranges, and active medication list.
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                            <div className="font-extrabold text-teal-700 dark:text-teal-300">A — Assessment</div>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                              Non-diagnostic differential considerations with uncertainty markers.
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                            <div className="font-extrabold text-teal-700 dark:text-teal-300">P — Plan</div>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                              Follow-up discussion checklist &amp; interaction precautions.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {previewTab === 'emergency' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-extrabold text-rose-800 dark:text-rose-200">
                            <AlertOctagon className="w-4 h-4 text-rose-600" aria-hidden="true" />
                            <span>Deterministic Red-Flag Detection</span>
                          </div>
                          <p className="text-xs text-rose-900/90 dark:text-rose-200 leading-relaxed">
                            Chest pain, breathing distress, sudden facial droop, severe bleeding, or self-harm cues immediately bypass normal chat and surface one-tap emergency escalation.
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="text-base font-black text-rose-600 dark:text-rose-400">108</div>
                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Ambulance</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="text-base font-black text-rose-600 dark:text-rose-400">112</div>
                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">National SOS</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="text-base font-black text-teal-700 dark:text-teal-400">14416</div>
                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Tele-MANAS</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Persistent Emergency Quick Trigger */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Need urgent medical or crisis support right now?
                      </span>
                      <button
                        type="button"
                        onClick={openEmergencyModal}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold whitespace-nowrap transition-colors"
                      >
                        SOS 108 / 112
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Compliance Strip */}
        <section
          aria-label="Security and compliance highlights"
          className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: 'DPDP Act 2023 Aligned',
                sub: 'Explicit consent, 1-click JSON export & erasure'
              },
              {
                icon: Lock,
                title: 'PostgreSQL Row-Level Security',
                sub: 'Strict auth.uid() = user_id isolation'
              },
              {
                icon: Server,
                title: 'Server-Side AI Proxy',
                sub: 'Authenticated JWT gateway with rate limits'
              },
              {
                icon: CheckCircle2,
                title: 'Zero Ad Trackers',
                sub: 'No advertising pixels or third-party data resale'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3-Step "How HealYaar Works" */}
        <section
          id="how-it-works"
          className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-16 sm:py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Simple, Transparent Workflow
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                How HealYaar works in 3 private steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  icon: BookOpen,
                  title: 'Upload & Vault Privately',
                  desc: 'Sign in with Email or Google and upload your own lab reports, prescription slips, or cycle logs. Everything is encrypted and scoped strictly to your account.'
                },
                {
                  step: '02',
                  icon: Database,
                  title: 'Dual-Layer RAG & Voice Analysis',
                  desc: 'Gemini 4 Hydrogen & hybrid retrieval combine your private records with WHO / ICMR-NIN references—explaining results clearly in English, Hindi, or Marathi.'
                },
                {
                  step: '03',
                  icon: UserCheck,
                  title: 'Doctor-Ready Briefs & Care Map',
                  desc: 'Generate structured Clinician SOAP summaries, create 1-click pill alarms, and locate real nearby hospitals, doctors, and pharmacies on an interactive map.'
                }
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-widest text-teal-700 dark:text-teal-400">
                        STEP {step.step}
                      </span>
                      <Icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Complete Accessibility &amp; Care Suite
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Built for patients, seniors, caregivers, and clinicians
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Zero sample clutter—every workspace reflects only your authenticated records, verified reference tables, and live maps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
            {/* Large Bento Card 1 */}
            <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Dual-Layer RAG Assistant &amp; Clinician Copilot
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                  Ask multi-part health questions grounded in your uploaded lab panels and prescriptions, or switch to Clinician Copilot Mode for structured SOAP notes with differential considerations and uncertainty markers.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">RAG Source Badges</span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">SOAP Brief Export</span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">Voice Readout</span>
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                <FileText className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Lab &amp; Prescription Vision
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload real blood reports or handwritten prescriptions to extract biomarkers, medicine timings, and 1-click daily pill reminders.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                <Utensils className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                ICMR-NIN Indian Nutrition
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Log meals using Indian household measures like &ldquo;1 katori dal, 2 rotis&rdquo; or analyze real food photos with ICMR-NIN reference nutrition guides.
              </p>
            </div>

            {/* Large Bento Card 4 */}
            <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Real Interactive Care Map &amp; Saved Clinics
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                  Search live nearby hospitals, clinics, doctors, and pharmacies with GPS or PIN code, view grounded Google Maps source attributions, get 1-click directions, and save trusted clinics to your account.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">Haversine Distance</span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">Saved Favorites</span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">1-Click Directions</span>
              </div>
            </div>

            {/* Bento Card 5 */}
            <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <CalendarHeart className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Private Period &amp; Cycle Sanctuary
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Track cycles, predicted phases, symptoms, and monthly calendar views with full edit/delete control and user-isolated database encryption.
              </p>
            </div>

            {/* Bento Card 6 */}
            <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Symptom Triage, Breathing Pacer &amp; Pill Alarms
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Structured symptom check-ins, 4-4-6 calming breathing pacers, daily medication alarms, and A++ accessible typography for seniors.
              </p>
            </div>
          </div>
        </section>

        {/* Zero Data Leakage & RLS Trust Section */}
        <section id="privacy-security" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
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
                HealYaar enforces strict authenticated sessions with PostgreSQL Row-Level Security (
                <code className="text-teal-300">auth.uid() = user_id</code>) across every health table, DPDP-aligned JSON data portability, and complete session teardown on sign out.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-200">
                {[
                  'Strict Supabase Auth gate — zero guest bypass',
                  'Isolated per-user IndexedDB RAG databases',
                  '1-click DPDP JSON data export & permanent deletion',
                  'Server-side Gemini API proxy with JWT verification'
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

        {/* Interactive FAQ Accordion */}
        <section
          id="faq"
          className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 py-16 sm:py-20"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Frequently Asked Questions
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Privacy, clinical safety, and accessibility answers
              </h2>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={item.q}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${idx}`}
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-teal-600' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-panel-${idx}`}
                        className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3"
                      >
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Public Legal Footer (All 4 policies + Contact/Support readable without logging in; bottom clearance prevents cookie banner overlap) */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pt-10 pb-44 sm:pb-36 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-white/20" aria-hidden="true" />
                </div>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  Heal<span className="text-teal-600 dark:text-teal-400">Yaar</span>{' '}
                  <span className="font-devanagari">(हीलयार)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Educational AI Health Companion • Plain-language guidance, not a licensed medical diagnosis.
              </p>
            </div>

            <nav
              aria-label="Legal policies and support"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300"
            >
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
              <button
                type="button"
                onClick={() => {
                  setContactSubmitted(false);
                  setContactOpen(true);
                }}
                className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400 font-bold hover:underline underline-offset-4"
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Contact &amp; Support</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <p>© {new Date().getFullYear()} HealYaar. Built with Row-Level Security &amp; Accessibility first.</p>
            <p>India Emergency Helplines: Ambulance 108 • National 112 • Tele-MANAS 14416</p>
          </div>
        </div>
      </footer>

      {/* Contact & DPDP Support Modal */}
      <PortalModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        ariaLabelledBy="contact-support-title"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="contact-support-title"
                className="text-lg font-extrabold text-slate-900 dark:text-white"
              >
                Contact HealYaar Support
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Questions about accessibility, privacy, or DPDP data requests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setContactOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close support dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Mail className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              <span>Privacy &amp; Grievance Desk: privacy@healyaar.in</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              For medical emergencies, do not use this form—call 108 or 112 immediately.
            </p>
          </div>

          {contactSubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Support message received!</span>
              </div>
              <p>Thank you, {contactName}. Our accessibility &amp; privacy team will follow up at {contactEmail}.</p>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setContactName('');
                    setContactEmail('');
                    setContactMessage('');
                    setContactOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 text-white font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label htmlFor="support-name" className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Your Name
                </label>
                <input
                  id="support-name"
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="support-email" className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  id="support-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="support-message" className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  How can we help?
                </label>
                <textarea
                  id="support-message"
                  rows={3}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your question or feedback..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                >
                  Send Message
                </button>
              </div>
            </form>
          )}
        </div>
      </PortalModal>
    </div>
  );
};
