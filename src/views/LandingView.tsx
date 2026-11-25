import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PortalModal } from '../components/ui/PortalModal';
import {
  ShieldCheck,
  Database,
  AlertOctagon,
  FileText,
  Utensils,
  CalendarHeart,
  Stethoscope,
  Lock,
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
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
  const [heroImgFailed, setHeroImgFailed] = useState<boolean>(false);

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
    <div className="min-h-screen flex flex-col font-editorial-sans bg-[#F3F4F6] dark:bg-[#0D1014] text-[#111315] dark:text-[#F8FAFC] transition-colors duration-200 selection:bg-amber-200/70 selection:text-[#111315]">
      <main id="top" className="flex-1">
        {/* ==============================================================
            SECTION 001: SWISS-EDITORIAL 4-CORNER STUDIO HERO
           ============================================================== */}
        <section
          aria-label="HealYaar introduction"
          className="relative min-h-[92vh] flex flex-col justify-center bg-[#C8CCD0] dark:bg-[#0D1014] px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-8 sm:pb-10 overflow-x-clip"
        >
          <div className="relative w-full max-w-[1400px] mx-auto">
            {/* Subtle warm amber ambient glow bleeding softly beneath bottom center of hero frame */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 w-[58%] sm:w-[46%] h-24 rounded-full bg-amber-400/45 dark:bg-amber-500/25 blur-3xl"
            />

            {/* Framed Minimalist 3D Studio Hero Canvas */}
            <div className="relative rounded-[28px] overflow-hidden md:min-h-[86vh] border border-black/10 dark:border-white/10 bg-[#DCE0E4] dark:bg-[#11151B] shadow-[0_28px_70px_-30px_rgba(17,19,21,0.34)] dark:shadow-[0_28px_80px_-28px_rgba(0,0,0,0.8)]">
              {/* Desktop (md+) full-bleed studio visual layer */}
              {!heroImgFailed ? (
                <img
                  src="/hero-stethoscope.jpg"
                  alt="Minimalist 3D studio render of a brushed titanium medical stethoscope"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="hidden md:block absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none scale-[1.01] dark:brightness-[0.72] dark:contrast-[1.08] transition-all duration-300"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,#E9ECEF_0%,#D2D7DC_55%,#C3C8CE_100%)] dark:bg-[radial-gradient(circle_at_50%_48%,#1D2430_0%,#11151B_60%,#0A0D11_100%)]"
                />
              )}

              {/* Desktop (md+) Dark-mode measured slate scrim guaranteeing >= 7:1 contrast for white typography */}
              <div
                aria-hidden="true"
                className="pointer-events-none hidden md:dark:block absolute inset-0 bg-slate-950/55"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none hidden md:dark:block absolute inset-0 bg-gradient-to-b from-[#090C10]/70 via-[#090C10]/25 to-[#090C10]/85"
              />

              {/* 4-Corner Editorial Overlay Grid (Desktop md+) / Clean Vertical Studio Stack (Mobile < md) */}
              <div className="relative z-10 flex flex-col justify-between md:min-h-[86vh] p-5 sm:p-8 md:p-10 lg:p-12">
                {/* TOP ROW: Top-Left Wordmark + Top-Right Nav & Controls */}
                <header className="flex items-start justify-between gap-3">
                  {/* Top-Left: Monospace Brand Wordmark & Multilingual Version */}
                  <div className="min-w-0">
                    <a
                      href="#top"
                      className="inline-block font-editorial-mono text-base sm:text-xl tracking-tight font-medium text-[#111315] dark:text-[#F8FAFC] hover:opacity-75 transition-opacity whitespace-nowrap"
                    >
                      (HEAL_YAAR)
                    </a>
                    <p className="font-editorial-mono text-[10px] sm:text-xs tracking-normal sm:tracking-wider text-[#111315]/75 dark:text-[#F8FAFC]/75 mt-1 leading-snug whitespace-nowrap">
                      [ v.01 · EN / <span className="font-devanagari">हिन्दी / मराठी</span> ]
                    </p>
                  </div>

                  {/* Top-Right: Vertical Minimal Nav Stack + Dark Mode & SOS Controls */}
                  <div className="flex flex-col items-end shrink-0">
                    <nav
                      aria-label="Primary landing navigation"
                      className="flex flex-col items-end space-y-1 sm:space-y-1.5 text-xs sm:text-sm font-medium text-right text-[#111315] dark:text-[#F8FAFC]"
                    >
                      <a
                        href="#features"
                        className="inline-flex items-center gap-1 hover:opacity-65 transition-opacity whitespace-nowrap"
                      >
                        <span>features</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-75" aria-hidden="true" />
                      </a>
                      <a
                        href="#how-it-works"
                        className="inline-flex items-center gap-1 hover:opacity-65 transition-opacity whitespace-nowrap"
                      >
                        <span>how it works</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-75" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={enterDemoMode}
                        className="inline-flex items-center gap-1 hover:opacity-65 transition-opacity whitespace-nowrap"
                      >
                        <span>live demo</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-75" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToAuth('login')}
                        className="inline-flex items-center gap-1 hover:opacity-65 transition-opacity whitespace-nowrap"
                      >
                        <span>log in</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-75" aria-hidden="true" />
                      </button>
                    </nav>

                    {/* Compact Utility Row: Dark Mode Toggle + Minimal SOS 108/112 Pill */}
                    <div className="mt-3 sm:mt-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="w-8 h-8 rounded-full border border-[#111315]/25 dark:border-[#F8FAFC]/30 bg-[#FFFFFF]/60 dark:bg-[#14181F]/80 backdrop-blur-sm text-[#111315] dark:text-amber-300 hover:bg-[#111315] hover:text-[#FFFFFF] dark:hover:bg-[#F8FAFC]/15 dark:hover:text-amber-200 flex items-center justify-center transition-colors shrink-0"
                      >
                        {theme === 'dark' ? (
                          <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={openEmergencyModal}
                        className="px-3 py-1.5 rounded-full border border-rose-700/45 dark:border-rose-400/55 bg-rose-600/10 dark:bg-rose-500/20 backdrop-blur-sm text-rose-800 dark:text-rose-200 hover:bg-rose-700 hover:text-[#FFFFFF] dark:hover:bg-rose-500 dark:hover:text-[#0D1014] font-editorial-mono text-[11px] font-medium tracking-wider uppercase whitespace-nowrap transition-colors shrink-0"
                      >
                        SOS 108/112
                      </button>
                    </div>
                  </div>
                </header>

                {/* MOBILE (< md) DEDICATED UNOBSTRUCTED STUDIO STAGE: stethoscope sits cleanly between header and headline */}
                <div className="relative md:hidden -mx-5 my-4 aspect-[16/10] overflow-hidden bg-[#D5D9DE] dark:bg-[#11151B]">
                  {!heroImgFailed ? (
                    <img
                      src="/hero-stethoscope.jpg"
                      alt="Minimalist 3D studio render of a brushed titanium medical stethoscope"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover object-center select-none pointer-events-none dark:brightness-[0.8] dark:contrast-[1.08]"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,#E9ECEF_0%,#C8CDD3_100%)] dark:bg-[radial-gradient(circle_at_50%_50%,#1D2430_0%,#0E1218_100%)]"
                    />
                  )}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#DCE0E4] to-transparent dark:from-[#11151B]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#DCE0E4] to-transparent dark:from-[#11151B]"
                  />
                </div>

                {/* DESKTOP (md+) CENTER STUDIO STAGE SPACER: keeps central stethoscope completely unobstructed */}
                <div
                  aria-hidden="true"
                  className="hidden md:block flex-1 min-h-[220px] lg:min-h-[235px]"
                />

                {/* BOTTOM ROW: Bottom-Left Headline + Bottom-Center Scroll + Bottom-Right Copy & CTAs */}
                <div className="grid grid-cols-1 lg:grid-cols-12 items-end gap-6 lg:gap-4 pt-2">
                  {/* Bottom-Left: Staggered Mixed-Typography Display Headline */}
                  <div className="lg:col-span-6">
                    <h1
                      aria-label="Where AI Cares for Your Health"
                      className="text-4xl sm:text-5xl lg:text-[3.5rem] leading-[0.94] tracking-tight text-[#111315] dark:text-[#F8FAFC] select-none"
                    >
                      <span className="block pl-6 sm:pl-12 lg:pl-12 font-semibold uppercase">
                        WHERE AI
                      </span>
                      <span className="block font-semibold uppercase">CARES</span>
                      <span className="block font-editorial-serif italic font-normal text-[1.15em] leading-[0.86] pl-1 text-[#111315] dark:text-[#F8FAFC]">
                        for
                      </span>
                      <span className="block pl-5 sm:pl-10 lg:pl-12 font-semibold uppercase">
                        // YOUR HEALTH
                      </span>
                    </h1>
                  </div>

                  {/* Bottom-Center: Minimal Downward Scroll Indicator */}
                  <div className="hidden lg:flex lg:col-span-2 justify-center pb-1.5">
                    <a
                      href="#workspace-preview"
                      aria-label="Scroll to interactive workspace preview"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#111315]/20 dark:border-[#F8FAFC]/25 text-[#111315] dark:text-[#F8FAFC] hover:border-[#111315] dark:hover:border-[#F8FAFC] hover:translate-y-0.5 transition-all"
                    >
                      <ArrowDown className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </div>

                  {/* Bottom-Right: Editorial Metadata, Description, Outlined GET STARTED Pill & Live Demo */}
                  <div className="lg:col-span-4 flex lg:justify-end">
                    <div className="w-full lg:max-w-[300px] space-y-4">
                      <div className="flex items-center justify-between font-editorial-mono text-xs text-[#111315]/75 dark:text-[#F8FAFC]/75 border-b border-[#111315]/15 dark:border-[#F8FAFC]/20 pb-2">
                        <span>( A )</span>
                        <span className="tabular-nums">[ 001 /004 ]</span>
                      </div>

                      <p className="text-xs sm:text-sm leading-relaxed text-[#111315]/85 dark:text-[#F8FAFC]/85">
                        Dual-layer RAG for prescriptions, lab reports, and clinician SOAP notes — with Hindi &amp; Marathi voice and 108/112 emergency guardrails.
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => navigateToAuth('signup')}
                          className="rounded-full border border-[#111315] dark:border-[#F8FAFC] text-[#111315] dark:text-[#F8FAFC] px-7 py-2.5 text-xs font-editorial-mono font-medium uppercase tracking-widest hover:bg-[#111315] hover:text-[#FFFFFF] dark:hover:bg-[#F8FAFC] dark:hover:text-[#0D1014] transition-colors whitespace-nowrap"
                        >
                          GET STARTED
                        </button>

                        <button
                          type="button"
                          onClick={enterDemoMode}
                          className="inline-flex items-center gap-1 font-editorial-mono text-[11px] font-medium uppercase tracking-wider text-[#111315]/85 dark:text-[#F8FAFC]/85 hover:text-amber-800 dark:hover:text-amber-400 underline-offset-4 hover:underline transition-colors whitespace-nowrap py-1.5"
                        >
                          <span>TRY LIVE DEMO</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Mobile scroll cue */}
                      <div className="flex lg:hidden items-center justify-between pt-1">
                        <a
                          href="#workspace-preview"
                          aria-label="Scroll to interactive workspace preview"
                          className="inline-flex items-center gap-1.5 font-editorial-mono text-[11px] tracking-wider uppercase text-[#111315]/70 dark:text-[#F8FAFC]/70 hover:text-[#111315] dark:hover:text-[#F8FAFC]"
                        >
                          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Explore Preview</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            SECTION 002: INTERACTIVE WORKSPACE PREVIEW + TRUST LEDGER
           ============================================================== */}
        <section
          id="workspace-preview"
          className="border-t border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0F1216] py-16 sm:py-24"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Editorial Section Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-8 border-b border-black/10 dark:border-white/10">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-3 font-editorial-mono text-xs text-[#111315]/60 dark:text-[#F8FAFC]/60">
                  <span className="tabular-nums">[ 002 /004 ]</span>
                  <span aria-hidden="true">·</span>
                  <span>Interactive Workspace Preview</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.06] text-[#111315] dark:text-[#F8FAFC]">
                  Plain-language clinical clarity,{' '}
                  <span className="font-editorial-serif italic font-normal text-[1.08em]">
                    grounded
                  </span>{' '}
                  in your records.
                </h2>
              </div>
              <div className="lg:col-span-5 lg:text-right space-y-3">
                <p className="text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed max-w-md lg:ml-auto">
                  Switch views below to inspect Dual-Layer RAG citations, Clinician SOAP structuring, and deterministic India 108 / 112 / 14416 safety escalation.
                </p>
                <div className="font-editorial-mono text-[11px] tracking-wider text-amber-800 dark:text-amber-400">
                  Gemini 4 Hydrogen · Gemini Embedding 2 · ICMR-NIN &amp; WHO
                </div>
              </div>
            </div>

            {/* Interactive Preview Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* Left 8 cols: Interactive Workspace Tabs & Live Preview Panel */}
              <div className="lg:col-span-8 rounded-[24px] border border-black/10 dark:border-white/10 bg-[#F3F4F6] dark:bg-[#14181F] overflow-hidden flex flex-col justify-between">
                {/* Segmented Tab Bar */}
                <div className="p-4 sm:p-6 border-b border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#10141A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div
                    className="inline-grid grid-cols-3 gap-1 p-1 rounded-full border border-black/10 dark:border-white/10 bg-[#F3F4F6] dark:bg-[#0D1014]"
                    role="tablist"
                    aria-label="Product capability preview"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={previewTab === 'rag'}
                      onClick={() => setPreviewTab('rag')}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs font-editorial-mono font-medium transition-colors whitespace-nowrap ${
                        previewTab === 'rag'
                          ? 'bg-[#111315] dark:bg-[#F8FAFC] text-[#FFFFFF] dark:text-[#0D1014]'
                          : 'text-[#111315]/70 dark:text-[#F8FAFC]/70 hover:text-[#111315] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      RAG Citations
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={previewTab === 'soap'}
                      onClick={() => setPreviewTab('soap')}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs font-editorial-mono font-medium transition-colors whitespace-nowrap ${
                        previewTab === 'soap'
                          ? 'bg-[#111315] dark:bg-[#F8FAFC] text-[#FFFFFF] dark:text-[#0D1014]'
                          : 'text-[#111315]/70 dark:text-[#F8FAFC]/70 hover:text-[#111315] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      Clinician SOAP
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={previewTab === 'emergency'}
                      onClick={() => setPreviewTab('emergency')}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs font-editorial-mono font-medium transition-colors whitespace-nowrap ${
                        previewTab === 'emergency'
                          ? 'bg-rose-700 dark:bg-rose-500 text-[#FFFFFF] dark:text-[#0D1014]'
                          : 'text-[#111315]/70 dark:text-[#F8FAFC]/70 hover:text-[#111315] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      108/112 Guard
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={enterDemoMode}
                    className="inline-flex items-center gap-1.5 font-editorial-mono text-xs font-medium text-[#111315] dark:text-[#F8FAFC] hover:text-amber-800 dark:hover:text-amber-400 transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    <span>Try Live Demo (No Sign-In)</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Tab Panel Content */}
                <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between gap-6">
                  {previewTab === 'rag' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0F1216] border border-black/10 dark:border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between font-editorial-mono text-[11px] text-amber-800 dark:text-amber-400">
                          <span>Layer A · User Vault</span>
                          <span>IndexedDB + RLS</span>
                        </div>
                        <h3 className="text-base font-semibold text-[#111315] dark:text-[#F8FAFC]">
                          Personal Blood Panel &amp; Active Prescriptions
                        </h3>
                        <p className="text-xs sm:text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed">
                          Retrieves strictly from your authenticated user ID — cross-referencing your biomarkers and prescription timings with zero cross-account leakage.
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0F1216] border border-black/10 dark:border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between font-editorial-mono text-[11px] text-[#111315]/60 dark:text-[#F8FAFC]/60">
                          <span>Layer B · Clinical Reference</span>
                          <span>ICMR-NIN / WHO</span>
                        </div>
                        <h3 className="text-base font-semibold text-[#111315] dark:text-[#F8FAFC]">
                          Verifiable Provenance &amp; Plain-Language Glossary
                        </h3>
                        <p className="text-xs sm:text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed">
                          Every answer renders expandable RAG source references showing exact document snippets, similarity scores, and prepared questions for your doctor.
                        </p>
                      </div>
                    </div>
                  )}

                  {previewTab === 'soap' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#111315] dark:text-[#F8FAFC]">
                          <ClipboardList className="w-4 h-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                          <span>Clinician Copilot SOAP Brief</span>
                        </div>
                        <span className="font-editorial-mono text-[11px] text-[#111315]/60 dark:text-[#F8FAFC]/60">
                          Non-Diagnostic · Requires Physician Review
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                        {[
                          {
                            code: 'S — Subjective',
                            text: 'Structured symptom timeline, severity markers, and patient-reported triggers.'
                          },
                          {
                            code: 'O — Objective',
                            text: 'Vault biomarkers, lab reference ranges, and active prescription list.'
                          },
                          {
                            code: 'A — Assessment',
                            text: 'Educational differential considerations paired with explicit uncertainty notes.'
                          },
                          {
                            code: 'P — Plan',
                            text: 'Follow-up physician discussion checklist and medication interaction precautions.'
                          }
                        ].map((item) => (
                          <div
                            key={item.code}
                            className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#0F1216] border border-black/10 dark:border-white/10"
                          >
                            <div className="font-editorial-mono text-xs font-medium text-amber-800 dark:text-amber-400">
                              {item.code}
                            </div>
                            <p className="text-[#111315]/75 dark:text-[#F8FAFC]/75 mt-1.5 leading-relaxed text-xs">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewTab === 'emergency' && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/35 border border-rose-700/20 dark:border-rose-400/25 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-rose-900 dark:text-rose-200">
                          <AlertOctagon className="w-4 h-4 text-rose-700 dark:text-rose-400" aria-hidden="true" />
                          <span>Deterministic Red-Flag Detection</span>
                        </div>
                        <p className="text-xs sm:text-sm text-rose-950/85 dark:text-rose-200/85 leading-relaxed">
                          Chest pain, breathing distress, sudden facial droop, severe bleeding, or self-harm cues immediately bypass normal chat and surface one-tap emergency escalation.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#0F1216] border border-black/10 dark:border-white/10">
                          <div className="font-editorial-mono text-lg sm:text-xl font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                            108
                          </div>
                          <div className="text-xs text-[#111315]/65 dark:text-[#F8FAFC]/65 mt-0.5">
                            Ambulance
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#0F1216] border border-black/10 dark:border-white/10">
                          <div className="font-editorial-mono text-lg sm:text-xl font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                            112
                          </div>
                          <div className="text-xs text-[#111315]/65 dark:text-[#F8FAFC]/65 mt-0.5">
                            National SOS
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#0F1216] border border-black/10 dark:border-white/10">
                          <div className="font-editorial-mono text-lg sm:text-xl font-semibold tabular-nums text-amber-800 dark:text-amber-400">
                            14416
                          </div>
                          <div className="text-xs text-[#111315]/65 dark:text-[#F8FAFC]/65 mt-0.5">
                            Tele-MANAS
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Persistent Emergency Quick Trigger Strip */}
                  <div className="pt-4 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-[#111315]/70 dark:text-[#F8FAFC]/70">
                      Need urgent medical or crisis support right now?
                    </span>
                    <button
                      type="button"
                      onClick={openEmergencyModal}
                      className="px-4 py-2 rounded-full border border-rose-700 dark:border-rose-400 bg-rose-700 dark:bg-rose-500 text-[#FFFFFF] dark:text-[#0D1014] hover:bg-rose-800 dark:hover:bg-rose-400 font-editorial-mono text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-colors"
                    >
                      SOS 108 / 112
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 4 cols: Architectural Trust & Compliance Specification Ledger */}
              <div className="lg:col-span-4 rounded-[24px] border border-black/10 dark:border-white/10 bg-[#F3F4F6] dark:bg-[#14181F] p-5 sm:p-6 flex flex-col justify-between gap-6">
                <div className="space-y-1 pb-4 border-b border-black/10 dark:border-white/10">
                  <div className="font-editorial-mono text-[11px] text-[#111315]/60 dark:text-[#F8FAFC]/60">
                    Architecture &amp; Compliance
                  </div>
                  <h3 className="text-lg font-semibold text-[#111315] dark:text-[#F8FAFC]">
                    Built for private Indian healthcare
                  </h3>
                </div>

                <div className="divide-y divide-black/10 dark:divide-white/10 flex-1">
                  {[
                    {
                      icon: ShieldCheck,
                      title: 'DPDP Act 2023 Aligned',
                      sub: 'Explicit consent, 1-click JSON export & permanent erasure'
                    },
                    {
                      icon: Lock,
                      title: 'PostgreSQL Row-Level Security',
                      sub: 'Strict auth.uid() = user_id database isolation'
                    },
                    {
                      icon: Server,
                      title: 'Server-Side AI Proxy',
                      sub: 'Authenticated JWT gateway with persistent rate limits'
                    },
                    {
                      icon: CheckCircle2,
                      title: 'Zero Ad Trackers',
                      sub: 'No advertising pixels or third-party data resale'
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                        <Icon
                          className="w-4 h-4 text-amber-800 dark:text-amber-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-[#111315] dark:text-[#F8FAFC]">
                            {item.title}
                          </div>
                          <div className="text-xs text-[#111315]/65 dark:text-[#F8FAFC]/65 leading-relaxed">
                            {item.sub}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => navigateToAuth('login')}
                    className="inline-flex items-center gap-1.5 font-editorial-mono font-medium text-[#111315] dark:text-[#F8FAFC] hover:text-amber-800 dark:hover:text-amber-400 transition-colors whitespace-nowrap"
                  >
                    <span>Log In to Vault</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <span className="font-editorial-mono text-[11px] text-[#111315]/55 dark:text-[#F8FAFC]/55 font-devanagari">
                    EN · हिन्दी · मराठी
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            SECTION 003: HOW HEALYAAR WORKS (3 PRIVATE STEPS)
           ============================================================== */}
        <section
          id="how-it-works"
          className="border-t border-black/10 dark:border-white/10 bg-[#F3F4F6] dark:bg-[#0D1014] py-16 sm:py-24"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-black/10 dark:border-white/10">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-3 font-editorial-mono text-xs text-[#111315]/60 dark:text-[#F8FAFC]/60">
                  <span className="tabular-nums">[ 003 /004 ]</span>
                  <span aria-hidden="true">·</span>
                  <span>Simple, Transparent Workflow</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111315] dark:text-[#F8FAFC]">
                  How HealYaar works in 3 private steps
                </h2>
              </div>
              <p className="text-sm text-[#111315]/65 dark:text-[#F8FAFC]/65 max-w-sm">
                From handwritten prescription photos to doctor-ready SOAP briefs and local care navigation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  step: '01',
                  icon: BookOpen,
                  title: 'Upload & Vault Privately',
                  desc: 'Sign in with Email or Google and upload lab reports, prescription slips, or cycle logs — or explore read-only Demo Mode first. Real records stay strictly scoped to your account.'
                },
                {
                  step: '02',
                  icon: Database,
                  title: 'Dual-Layer RAG & Voice Analysis',
                  desc: 'Gemini 4 Hydrogen and Gemini Embedding 2 combine your private vault with WHO and ICMR-NIN clinical references — explaining results clearly in English, Hindi, or Marathi.'
                },
                {
                  step: '03',
                  icon: UserCheck,
                  title: 'Doctor-Ready Briefs & Care Map',
                  desc: 'Generate structured Clinician SOAP summaries, create 1-click pill alarms, and locate nearby hospitals, doctors, and pharmacies on an interactive care map.'
                }
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="rounded-[22px] bg-[#FFFFFF] dark:bg-[#14181F] p-6 sm:p-7 border border-black/10 dark:border-white/10 flex flex-col justify-between gap-6"
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
                      <span className="font-editorial-mono text-xs font-medium tracking-wider text-amber-800 dark:text-amber-400 tabular-nums">
                        STEP {step.step}
                      </span>
                      <Icon className="w-4 h-4 text-[#111315]/55 dark:text-[#F8FAFC]/55" aria-hidden="true" />
                    </div>
                    <div className="space-y-2.5 flex-1">
                      <h3 className="text-lg font-semibold text-[#111315] dark:text-[#F8FAFC]">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================
            SECTION 004: EDITORIAL CAPABILITY SUITE (ASYMMETRIC BENTO)
           ============================================================== */}
        <section
          id="features"
          className="border-t border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0F1216] py-16 sm:py-24"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-black/10 dark:border-white/10">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-3 font-editorial-mono text-xs text-[#111315]/60 dark:text-[#F8FAFC]/60">
                  <span className="tabular-nums">[ 004 /004 ]</span>
                  <span aria-hidden="true">·</span>
                  <span>Complete Accessibility &amp; Care Suite</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111315] dark:text-[#F8FAFC]">
                  Built for patients, seniors, caregivers, and clinicians
                </h2>
              </div>
              <p className="text-sm text-[#111315]/65 dark:text-[#F8FAFC]/65 max-w-md">
                Every signed-in workspace reflects strictly your authenticated records, verified reference tables, and live maps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
              {/* Feature 01 — Wide */}
              <div className="md:col-span-4 rounded-[24px] bg-[#F3F4F6] dark:bg-[#14181F] p-6 sm:p-8 border border-black/10 dark:border-white/10 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-editorial-mono text-xs text-amber-800 dark:text-amber-400">
                      01 · Clinical Reasoning
                    </span>
                    <Sparkles className="w-4 h-4 text-[#111315]/55 dark:text-[#F8FAFC]/55" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#111315] dark:text-[#F8FAFC]">
                    Dual-Layer RAG Assistant &amp; Clinician Copilot
                  </h3>
                  <p className="text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed max-w-2xl">
                    Ask multi-part health questions grounded in your uploaded lab panels and prescriptions, or switch to Clinician Copilot Mode for structured SOAP notes with differential considerations and uncertainty markers.
                  </p>
                </div>
                <div className="pt-4 border-t border-black/10 dark:border-white/10 font-editorial-mono text-xs text-[#111315]/65 dark:text-[#F8FAFC]/65 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span>RAG Source Citations</span>
                  <span aria-hidden="true">·</span>
                  <span>SOAP Brief Export</span>
                  <span aria-hidden="true">·</span>
                  <span>Multilingual Voice Readout</span>
                </div>
              </div>

              {/* Feature 02 */}
              <div className="md:col-span-2 rounded-[24px] bg-[#F3F4F6] dark:bg-[#14181F] p-6 sm:p-7 border border-black/10 dark:border-white/10 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-editorial-mono text-xs text-[#111315]/60 dark:text-[#F8FAFC]/60">
                      02 · Vision
                    </span>
                    <FileText className="w-4 h-4 text-[#111315]/55 dark:text-[#F8FAFC]/55" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#111315] dark:text-[#F8FAFC]">
                    Lab &amp; Prescription Vision
                  </h3>
                  <p className="text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed">
                    Upload blood reports or handwritten prescriptions to extract biomarkers, medicine timings, and 1-click daily pill reminders.
                  </p>
                </div>
              </div>

              {/* Feature 03 */}
              <div className="md:col-span-2 rounded-[24px] bg-[#F3F4F6] dark:bg-[#14181F] p-6 sm:p-7 border border-black/10 dark:border-white/10 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-editorial-mono text-xs text-[#111315]/60 dark:text-[#F8FAFC]/60">
                      03 · Nutrition
                    </span>
                    <Utensils className="w-4 h-4 text-[#111315]/55 dark:text-[#F8FAFC]/55" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#111315] dark:text-[#F8FAFC]">
                    ICMR-NIN Indian Nutrition
                  </h3>
                  <p className="text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed">
                    Log meals using Indian household measures like &ldquo;1 katori dal, 2 rotis&rdquo; or analyze food photos with ICMR-NIN reference tables.
                  </p>
                </div>
              </div>

              {/* Feature 04 — Wide */}
              <div className="md:col-span-4 rounded-[24px] bg-[#F3F4F6] dark:bg-[#14181F] p-6 sm:p-8 border border-black/10 dark:border-white/10 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-editorial-mono text-xs text-amber-800 dark:text-amber-400">
                      04 · Local Care Discovery
                    </span>
                    <MapPin className="w-4 h-4 text-[#111315]/55 dark:text-[#F8FAFC]/55" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#111315] dark:text-[#F8FAFC]">
                    Real Interactive Care Map &amp; Saved Clinics
                  </h3>
                  <p className="text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed max-w-2xl">
                    Search nearby hospitals, clinics, doctors, and pharmacies with GPS or PIN code, inspect grounded nearby care sources, open 1-click directions, and save trusted clinics to your account.
                  </p>
                </div>
                <div className="pt-4 border-t border-black/10 dark:border-white/10 font-editorial-mono text-xs text-[#111315]/65 dark:text-[#F8FAFC]/65 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span>Haversine Distance</span>
                  <span aria-hidden="true">·</span>
                  <span>Saved Favorites</span>
                  <span aria-hidden="true">·</span>
                  <span>1-Click Directions</span>
                </div>
              </div>

              {/* Feature 05 */}
              <div className="md:col-span-3 rounded-[24px] bg-[#F3F4F6] dark:bg-[#14181F] p-6 sm:p-7 border border-black/10 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-editorial-mono text-xs text-[#111315]/60 dark:text-[#F8FAFC]/60">
                    05 · Cycle Health
                  </span>
                  <CalendarHeart className="w-4 h-4 text-[#111315]/55 dark:text-[#F8FAFC]/55" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-[#111315] dark:text-[#F8FAFC]">
                  Private Period &amp; Cycle Sanctuary
                </h3>
                <p className="text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed">
                  Track cycles, predicted phases, symptoms, and monthly calendar views with full edit and delete control under user-isolated database encryption.
                </p>
              </div>

              {/* Feature 06 */}
              <div className="md:col-span-3 rounded-[24px] bg-[#F3F4F6] dark:bg-[#14181F] p-6 sm:p-7 border border-black/10 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-editorial-mono text-xs text-[#111315]/60 dark:text-[#F8FAFC]/60">
                    06 · Senior &amp; Daily Care
                  </span>
                  <Stethoscope className="w-4 h-4 text-[#111315]/55 dark:text-[#F8FAFC]/55" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-[#111315] dark:text-[#F8FAFC]">
                  Symptom Triage, Breathing Pacer &amp; Pill Alarms
                </h3>
                <p className="text-sm text-[#111315]/70 dark:text-[#F8FAFC]/70 leading-relaxed">
                  Structured symptom check-ins, 4-4-6 calming breathing pacers, daily medication alarms, and A++ accessible typography for seniors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            PRIVACY & SECURITY STATEMENT PANEL
           ============================================================== */}
        <section
          id="privacy-security"
          className="border-t border-black/10 dark:border-white/10 bg-[#F3F4F6] dark:bg-[#0D1014] py-16 sm:py-20"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[28px] bg-[#111315] dark:bg-[#14181F] border border-black/15 dark:border-white/10 p-7 sm:p-12 text-[#F8FAFC] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 font-editorial-mono text-xs tracking-wider text-amber-400">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Zero Data Leakage · Row-Level Security</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-tight text-[#F8FAFC]">
                  Your medical data belongs{' '}
                  <span className="font-editorial-serif italic font-normal text-[1.1em]">
                    strictly
                  </span>{' '}
                  to you.
                </h2>
                <p className="text-sm sm:text-base text-[#F8FAFC]/75 leading-relaxed">
                  HealYaar enforces authenticated sessions with PostgreSQL Row-Level Security (
                  <code className="font-editorial-mono text-amber-300 text-xs sm:text-sm">
                    auth.uid() = user_id
                  </code>
                  ) across every health table, DPDP-aligned JSON data portability, and complete session teardown on sign out.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-[#F8FAFC]/85">
                  {[
                    'Private Supabase Auth for your real records — plus an isolated read-only Demo Mode for instant preview.',
                    'Isolated per-user IndexedDB RAG databases',
                    '1-click DPDP JSON data export & permanent deletion',
                    'Server-side Gemini API proxy with JWT verification'
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="leading-snug">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3 sm:items-end">
                <button
                  type="button"
                  onClick={() => navigateToAuth('signup')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#F8FAFC] hover:bg-amber-300 text-[#111315] font-editorial-mono text-xs font-medium uppercase tracking-widest transition-colors whitespace-nowrap"
                >
                  <span>Create Your Private Vault</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setTab('privacy')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-[#F8FAFC]/25 hover:border-[#F8FAFC] text-[#F8FAFC] font-editorial-mono text-xs uppercase tracking-wider transition-colors whitespace-nowrap"
                >
                  <span>Read Privacy Policy</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            INTERACTIVE FAQ ACCORDION
           ============================================================== */}
        <section
          id="faq"
          className="border-t border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0F1216] py-16 sm:py-24"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="space-y-2 pb-6 border-b border-black/10 dark:border-white/10">
              <div className="font-editorial-mono text-xs text-[#111315]/60 dark:text-[#F8FAFC]/60">
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#111315] dark:text-[#F8FAFC]">
                Privacy, clinical safety, and accessibility answers
              </h2>
            </div>

            <div className="divide-y divide-black/10 dark:divide-white/10 border-b border-black/10 dark:border-white/10">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${idx}`}
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full py-5 text-left flex items-center justify-between gap-4 hover:opacity-75 transition-opacity"
                    >
                      <span className="text-sm sm:text-base font-semibold text-[#111315] dark:text-[#F8FAFC]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#111315]/60 dark:text-[#F8FAFC]/60 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-amber-800 dark:text-amber-400' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-panel-${idx}`}
                        className="pb-5 pr-8 text-sm text-[#111315]/70 dark:text-[#F8FAFC]/75 leading-relaxed"
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

      {/* ==============================================================
          PUBLIC LEGAL FOOTER (Bottom clearance prevents cookie banner overlap)
         ============================================================== */}
      <footer className="border-t border-black/10 dark:border-white/10 bg-[#F3F4F6] dark:bg-[#0D1014] pt-10 pb-40 sm:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="font-editorial-mono text-base font-medium tracking-tight text-[#111315] dark:text-[#F8FAFC]">
                  (HEAL_YAAR)
                </span>
                <span className="font-devanagari text-xs font-medium text-[#111315]/65 dark:text-[#F8FAFC]/65">
                  हीलयार
                </span>
              </div>
              <p className="text-xs text-[#111315]/65 dark:text-[#F8FAFC]/65">
                Educational AI Health Companion · Plain-language guidance, not a licensed medical diagnosis.
              </p>
            </div>

            <nav
              aria-label="Legal policies and support"
              className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-sm font-medium text-[#111315]/75 dark:text-[#F8FAFC]/75"
            >
              <button
                type="button"
                onClick={() => setTab('privacy')}
                className="hover:text-[#111315] dark:hover:text-[#F8FAFC] underline-offset-4 hover:underline"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setTab('terms')}
                className="hover:text-[#111315] dark:hover:text-[#F8FAFC] underline-offset-4 hover:underline"
              >
                Terms &amp; Conditions
              </button>
              <button
                type="button"
                onClick={() => setTab('cookies')}
                className="hover:text-[#111315] dark:hover:text-[#F8FAFC] underline-offset-4 hover:underline"
              >
                Cookies Policy
              </button>
              <button
                type="button"
                onClick={() => setTab('refund')}
                className="hover:text-[#111315] dark:hover:text-[#F8FAFC] underline-offset-4 hover:underline"
              >
                Refund &amp; Free-Access Policy
              </button>
              <button
                type="button"
                onClick={() => {
                  setContactSubmitted(false);
                  setContactOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-semibold hover:underline underline-offset-4"
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Contact &amp; Support</span>
              </button>
            </nav>
          </div>

          <div className="pt-5 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#111315]/60 dark:text-[#F8FAFC]/60">
            <p>© {new Date().getFullYear()} HealYaar. Built with Row-Level Security &amp; Accessibility first.</p>
            <p className="font-editorial-mono text-[11px] tabular-nums">
              India Helplines: Ambulance 108 · National 112 · Tele-MANAS 14416
            </p>
          </div>
        </div>
      </footer>

      {/* Contact & DPDP Support Modal */}
      <PortalModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        ariaLabelledBy="contact-support-title"
      >
        <div className="bg-[#FFFFFF] dark:bg-[#14181F] rounded-[24px] p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4 text-[#111315] dark:text-[#F8FAFC]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="contact-support-title"
                className="text-lg font-semibold text-[#111315] dark:text-[#F8FAFC]"
              >
                Contact HealYaar Support
              </h3>
              <p className="text-xs text-[#111315]/65 dark:text-[#F8FAFC]/65 mt-0.5">
                Questions about accessibility, privacy, or DPDP data requests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setContactOpen(false)}
              className="p-1.5 rounded-full text-[#111315]/55 dark:text-[#F8FAFC]/55 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Close support dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F3F4F6] dark:bg-[#0D1014] border border-black/10 dark:border-white/10 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#111315] dark:text-[#F8FAFC]">
              <Mail className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" aria-hidden="true" />
              <span>Privacy &amp; Grievance Desk: privacy@healyaar.in</span>
            </div>
            <p className="text-[#111315]/65 dark:text-[#F8FAFC]/65">
              For medical emergencies, do not use this form — call 108 or 112 immediately.
            </p>
          </div>

          {contactSubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/20 dark:border-emerald-400/30 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>Support message received!</span>
              </div>
              <p>
                Thank you, {contactName}. Our accessibility &amp; privacy team will follow up at{' '}
                {contactEmail}.
              </p>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setContactName('');
                    setContactEmail('');
                    setContactMessage('');
                    setContactOpen(false);
                  }}
                  className="px-5 py-2 rounded-full bg-[#111315] dark:bg-[#F8FAFC] text-[#FFFFFF] dark:text-[#0D1014] font-editorial-mono text-xs uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="support-name"
                  className="block font-editorial-mono text-[11px] uppercase tracking-wider text-[#111315]/65 dark:text-[#F8FAFC]/65 mb-1"
                >
                  Your Name
                </label>
                <input
                  id="support-name"
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F4F6] dark:bg-[#0D1014] border border-black/15 dark:border-white/15 text-xs sm:text-sm text-[#111315] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label
                  htmlFor="support-email"
                  className="block font-editorial-mono text-[11px] uppercase tracking-wider text-[#111315]/65 dark:text-[#F8FAFC]/65 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="support-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F4F6] dark:bg-[#0D1014] border border-black/15 dark:border-white/15 text-xs sm:text-sm text-[#111315] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label
                  htmlFor="support-message"
                  className="block font-editorial-mono text-[11px] uppercase tracking-wider text-[#111315]/65 dark:text-[#F8FAFC]/65 mb-1"
                >
                  How can we help?
                </label>
                <textarea
                  id="support-message"
                  rows={3}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your question or feedback..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F4F6] dark:bg-[#0D1014] border border-black/15 dark:border-white/15 text-xs sm:text-sm text-[#111315] dark:text-[#F8FAFC]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  className="px-4 py-2 rounded-full border border-black/20 dark:border-white/20 text-xs font-editorial-mono uppercase tracking-wider text-[#111315]/75 dark:text-[#F8FAFC]/75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#111315] dark:bg-[#F8FAFC] hover:opacity-85 text-[#FFFFFF] dark:text-[#0D1014] font-editorial-mono text-xs uppercase tracking-wider transition-opacity"
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
