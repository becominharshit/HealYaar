import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Mail,
  MessageSquare,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PortalModal } from '../components/ui/PortalModal';
import { StethoscopeScrollHero } from '../components/landing/StethoscopeScrollHero';
import { WorkspacePreviewSection } from '../components/landing/WorkspacePreviewSection';
import { CareFlowSection } from '../components/landing/CareFlowSection';
import { CapabilitiesSection } from '../components/landing/CapabilitiesSection';

gsap.registerPlugin(ScrollTrigger);

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
  const shouldReduceMotion = useReducedMotion();

  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [contactOpen, setContactOpen] = useState<boolean>(false);
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);

  // Smooth wheel scrolling synchronized with GSAP ScrollTrigger
  useEffect(() => {
    if (shouldReduceMotion) return;

    const root = document.documentElement;
    root.classList.add('lenis-active');

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      root.classList.remove('lenis-active');
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [shouldReduceMotion]);

  const navigateToAuth = (mode: 'login' | 'signup') => {
    try {
      sessionStorage.setItem('healyaar_initial_auth_mode', mode);
    } catch {
      // ignore storage availability errors
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
    <div className="min-h-screen flex flex-col font-body bg-[#FAFAFA] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F8FAFC] transition-colors duration-200 selection:bg-teal-200/70 selection:text-[#0F172A]">
      <main id="top" className="flex-1">
        {/* Section 1: Full-Bleed Scroll-Scrubbed Stethoscope Cinema Stage */}
        <StethoscopeScrollHero
          onGetStarted={() => navigateToAuth('signup')}
          onLogin={() => navigateToAuth('login')}
          onEnterDemo={enterDemoMode}
          onOpenEmergency={openEmergencyModal}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Section 2: Interactive Workspace Preview + Architectural Privacy Ledger */}
        <WorkspacePreviewSection
          onEnterDemo={enterDemoMode}
          onLogin={() => navigateToAuth('login')}
          onOpenEmergency={openEmergencyModal}
        />

        {/* Section 3: 3-Step Private Care Flow */}
        <CareFlowSection />

        {/* Section 4: Core Care Suite */}
        <CapabilitiesSection />

        {/* Section 5: Private Vault Commitment + Compact FAQ */}
        <section
          id="privacy-security"
          className="border-t border-black/[0.06] dark:border-white/[0.08] bg-[#FFFFFF] dark:bg-[#0B0F17] py-20 sm:py-28"
        >
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 space-y-20 sm:space-y-24">
            {/* Private Vault Commitment Band */}
            <div className="rounded-[24px] squircle bg-[#0F172A] dark:bg-[#111827] border border-black/10 dark:border-white/[0.08] p-8 sm:p-14 text-[#F8FAFC] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <h2 className="font-display font-semibold tracking-[-0.025em] text-[#F8FAFC] text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.1]">
                  Your medical records stay strictly yours.
                </h2>
                <p className="font-body text-sm sm:text-base text-[#CBD5E1] leading-relaxed max-w-prose">
                  Authenticated Supabase sessions enforce PostgreSQL Row-Level Security across every table, isolated per-user IndexedDB RAG vaults, DPDP one-click JSON export, and full teardown on sign out.
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-3">
                <motion.button
                  type="button"
                  whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => navigateToAuth('signup')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[12px] squircle bg-[#0D9488] hover:bg-[#14B8A6] text-white font-body text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Create your private vault</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => setTab('privacy')}
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-[12px] squircle border border-white/20 hover:border-white/45 text-[#F8FAFC] font-body text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  Read privacy policy
                </motion.button>
              </div>
            </div>

            {/* Compact FAQ Accordion */}
            <div id="faq" className="max-w-4xl mx-auto space-y-8">
              <h2 className="font-display font-semibold tracking-[-0.025em] text-[#0F172A] dark:text-[#F8FAFC] text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.12]">
                Privacy, clinical safety, and accessibility answers.
              </h2>

              <div className="divide-y divide-black/[0.08] dark:divide-white/[0.08] border-t border-b border-black/[0.08] dark:border-white/[0.08]">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={item.q}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${idx}`}
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        className="w-full py-5 text-left flex items-center justify-between gap-4 hover:opacity-75 transition-opacity cursor-pointer"
                      >
                        <span className="font-display text-sm sm:text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#475569] dark:text-[#94A3B8] shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#0F766E] dark:text-[#2DD4BF]' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`faq-panel-${idx}`}
                            initial={shouldReduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
                            animate={
                              shouldReduceMotion
                                ? { opacity: 1 }
                                : { height: 'auto', opacity: 1 }
                            }
                            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="pb-5 pr-8 font-body text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed max-w-prose">
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Public Legal Footer (Bottom clearance prevents cookie banner overlap) */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#0D1119] pt-10 pb-40 sm:pb-32 px-5 sm:px-8 lg:px-10">
        <div className="max-w-[1360px] mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <img
                src="/logo.png"
                alt="HealYaar"
                className="h-7 w-auto object-contain"
              />
              <p className="font-body text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                Educational AI Health Companion · Plain-language guidance, not a licensed medical diagnosis.
              </p>
            </div>

            <nav
              aria-label="Legal policies and support"
              className="flex flex-wrap items-center gap-x-6 gap-y-2.5 font-body text-xs sm:text-sm font-medium text-[#475569] dark:text-[#CBD5E1]"
            >
              <button
                type="button"
                onClick={() => setTab('privacy')}
                className="hover:text-[#0F172A] dark:hover:text-white underline-offset-4 hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setTab('terms')}
                className="hover:text-[#0F172A] dark:hover:text-white underline-offset-4 hover:underline cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
              <button
                type="button"
                onClick={() => setTab('cookies')}
                className="hover:text-[#0F172A] dark:hover:text-white underline-offset-4 hover:underline cursor-pointer"
              >
                Cookies Policy
              </button>
              <button
                type="button"
                onClick={() => setTab('refund')}
                className="hover:text-[#0F172A] dark:hover:text-white underline-offset-4 hover:underline cursor-pointer"
              >
                Refund &amp; Free-Access Policy
              </button>
              <button
                type="button"
                onClick={() => {
                  setContactSubmitted(false);
                  setContactOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-[#0F766E] dark:text-[#2DD4BF] font-semibold hover:underline underline-offset-4 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Contact &amp; Support</span>
              </button>
            </nav>
          </div>

          <div className="pt-5 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-body text-xs text-[#475569] dark:text-[#94A3B8]">
            <p>© {new Date().getFullYear()} HealYaar. Built with Row-Level Security &amp; Accessibility first.</p>
            <p className="tabular-nums">
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
        <div className="bg-[#FFFFFF] dark:bg-[#111827] rounded-[24px] squircle p-6 max-w-md w-full border border-black/[0.08] dark:border-white/[0.1] shadow-2xl space-y-4 text-[#0F172A] dark:text-[#F8FAFC]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="contact-support-title"
                className="font-display text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
              >
                Contact HealYaar Support
              </h3>
              <p className="font-body text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
                Questions about accessibility, privacy, or DPDP data requests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setContactOpen(false)}
              className="p-1.5 rounded-[10px] text-[#475569] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close support dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 rounded-[16px] squircle bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/[0.06] dark:border-white/[0.08] font-body text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              <Mail className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" aria-hidden="true" />
              <span>Privacy &amp; Grievance Desk: privacy@healyaar.in</span>
            </div>
            <p className="text-[#475569] dark:text-[#94A3B8]">
              For medical emergencies, do not use this form — call 108 or 112 immediately.
            </p>
          </div>

          {contactSubmitted ? (
            <div className="p-4 rounded-[16px] squircle bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/20 dark:border-emerald-400/30 text-emerald-900 dark:text-emerald-200 font-body text-xs space-y-2">
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
                  className="px-5 py-2 rounded-[10px] bg-[#0F766E] text-white font-body text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-3 font-body">
              <div>
                <label
                  htmlFor="support-name"
                  className="block text-xs font-medium text-[#475569] dark:text-[#CBD5E1] mb-1"
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
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/10 dark:border-white/15 text-xs sm:text-sm text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label
                  htmlFor="support-email"
                  className="block text-xs font-medium text-[#475569] dark:text-[#CBD5E1] mb-1"
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
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/10 dark:border-white/15 text-xs sm:text-sm text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label
                  htmlFor="support-message"
                  className="block text-xs font-medium text-[#475569] dark:text-[#CBD5E1] mb-1"
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
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/10 dark:border-white/15 text-xs sm:text-sm text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  className="px-4 py-2 rounded-[10px] border border-black/15 dark:border-white/15 text-xs font-medium text-[#475569] dark:text-[#CBD5E1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[10px] bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-semibold transition-colors cursor-pointer"
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
