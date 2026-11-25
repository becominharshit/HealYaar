import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertOctagon,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Lock,
  Server,
  ShieldCheck
} from 'lucide-react';

type PreviewTab = 'rag' | 'soap' | 'emergency';

interface WorkspacePreviewSectionProps {
  onEnterDemo: () => void;
  onLogin: () => void;
  onOpenEmergency: () => void;
}

const PREVIEW_TABS: { id: PreviewTab; label: string }[] = [
  { id: 'rag', label: 'RAG Vault' },
  { id: 'soap', label: 'SOAP Brief' },
  { id: 'emergency', label: '108 / 112' }
];

const COMPLIANCE_SPECS = [
  {
    icon: ShieldCheck,
    title: 'DPDP Act 2023 Aligned',
    detail: 'Explicit consent, one-click JSON export, and permanent account erasure.'
  },
  {
    icon: Lock,
    title: 'PostgreSQL Row-Level Security',
    detail: 'Every health table isolates rows strictly to your authenticated user ID.'
  },
  {
    icon: Server,
    title: 'Server-Side AI Proxy',
    detail: 'Authenticated JWT gateway with rate limits so API secrets never reach the browser.'
  },
  {
    icon: CheckCircle2,
    title: 'Zero Ad Trackers',
    detail: 'No advertising pixels, behavioral cookies, or third-party health data resale.'
  }
];

export const WorkspacePreviewSection: React.FC<WorkspacePreviewSectionProps> = ({
  onEnterDemo,
  onLogin,
  onOpenEmergency
}) => {
  const [previewTab, setPreviewTab] = useState<PreviewTab>('rag');
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="workspace-preview"
      className="border-t border-black/[0.06] dark:border-white/[0.08] bg-[#FAFAFA] dark:bg-[#0D1119] py-20 sm:py-28"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 space-y-10 sm:space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h2 className="font-display font-semibold tracking-[-0.025em] text-[#0F172A] dark:text-[#F8FAFC] text-[clamp(1.875rem,3.4vw,2.85rem)] leading-[1.08] max-w-2xl">
            See how HealYaar answers with proof.
          </h2>
          <p className="font-body text-sm text-[#475569] dark:text-[#94A3B8]">
            Gemini 4 Hydrogen · Gemini Embedding 2 · ICMR-NIN &amp; WHO
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left 8 cols: Pure White Elevated Workspace Card */}
          <div className="lg:col-span-8 rounded-[24px] squircle bg-[#FFFFFF] dark:bg-[#111827] border border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between overflow-hidden">
            {/* Segmented Control Header */}
            <div className="p-4 sm:p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div
                className="grid grid-cols-3 sm:inline-flex items-center gap-1 p-1 rounded-[12px] bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/[0.05] dark:border-white/[0.06] w-full sm:w-auto"
                role="tablist"
                aria-label="Product capability preview"
              >
                {PREVIEW_TABS.map((item) => {
                  const isActive = previewTab === item.id;
                  const isEmergency = item.id === 'emergency';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setPreviewTab(item.id)}
                      className={`relative px-2 sm:px-4 py-2 rounded-[10px] font-body text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap text-center cursor-pointer ${
                        isActive
                          ? 'text-white'
                          : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="workspace-preview-tab"
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 380, damping: 30 }
                          }
                          className={`absolute inset-0 rounded-[10px] ${
                            isEmergency
                              ? 'bg-[#BE123C]'
                              : 'bg-[#0F766E]'
                          }`}
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { x: 2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={onEnterDemo}
                className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-[#0F766E] dark:text-[#2DD4BF] hover:text-[#0D9488] transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                <span>Try live demo</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </motion.button>
            </div>

            {/* Tab Content Panel */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
              <AnimatePresence mode="wait">
                {previewTab === 'rag' && (
                  <motion.div
                    key="rag"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(2px)' }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  >
                    <div className="p-5 rounded-[16px] squircle bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/[0.05] dark:border-white/[0.06] space-y-2.5">
                      <div className="flex items-center justify-between font-body text-xs font-medium text-[#0F766E] dark:text-[#2DD4BF]">
                        <span>Layer A · Personal Vault</span>
                        <span>IndexedDB + RLS</span>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Your lab panels &amp; active prescriptions
                      </h3>
                      <p className="font-body text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                        Retrieves strictly from your authenticated user ID — cross-referencing your biomarkers and dosage schedules with zero cross-account leakage.
                      </p>
                    </div>

                    <div className="p-5 rounded-[16px] squircle bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/[0.05] dark:border-white/[0.06] space-y-2.5">
                      <div className="flex items-center justify-between font-body text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                        <span>Layer B · Clinical Reference</span>
                        <span>ICMR-NIN &amp; WHO</span>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Verifiable provenance &amp; plain language
                      </h3>
                      <p className="font-body text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                        Every answer attaches expandable source excerpts, similarity scores, and clear questions prepared for your next physician visit.
                      </p>
                    </div>
                  </motion.div>
                )}

                {previewTab === 'soap' && (
                  <motion.div
                    key="soap"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(2px)' }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        <ClipboardList className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" aria-hidden="true" />
                        <span>Clinician Copilot SOAP Brief</span>
                      </div>
                      <span className="font-body text-xs text-[#475569] dark:text-[#94A3B8]">
                        Non-diagnostic · Requires physician review
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {[
                        {
                          label: 'Subjective',
                          text: 'Structured symptom timeline, severity markers, and patient-reported triggers.'
                        },
                        {
                          label: 'Objective',
                          text: 'Vault biomarkers, lab reference ranges, and active prescription schedule.'
                        },
                        {
                          label: 'Assessment',
                          text: 'Educational differential considerations paired with explicit uncertainty notes.'
                        },
                        {
                          label: 'Plan',
                          text: 'Follow-up physician discussion checklist and medication interaction precautions.'
                        }
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="p-4 rounded-[16px] squircle bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/[0.05] dark:border-white/[0.06]"
                        >
                          <div className="font-display text-xs font-semibold text-[#0F766E] dark:text-[#2DD4BF]">
                            {item.label}
                          </div>
                          <p className="font-body text-xs sm:text-sm text-[#475569] dark:text-[#CBD5E1] mt-1.5 leading-relaxed">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {previewTab === 'emergency' && (
                  <motion.div
                    key="emergency"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(2px)' }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-4"
                  >
                    <div className="p-5 rounded-[16px] squircle bg-rose-50/90 dark:bg-rose-950/35 border border-rose-700/15 dark:border-rose-400/20 space-y-2">
                      <div className="flex items-center gap-2 font-display text-sm font-semibold text-[#9F1239] dark:text-rose-200">
                        <AlertOctagon className="w-4 h-4 text-[#BE123C] dark:text-rose-400" aria-hidden="true" />
                        <span>Deterministic Red-Flag Escalation</span>
                      </div>
                      <p className="font-body text-sm text-[#881337] dark:text-rose-200/90 leading-relaxed">
                        Chest pain, breathing distress, sudden facial droop, severe bleeding, or self-harm cues immediately bypass normal chat and surface one-tap emergency calling.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-4 rounded-[16px] squircle bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/[0.05] dark:border-white/[0.06]">
                        <div className="font-display text-xl sm:text-2xl font-bold tabular-nums text-[#BE123C] dark:text-rose-400">
                          108
                        </div>
                        <div className="font-body text-xs text-[#475569] dark:text-[#94A3B8] mt-1">
                          Ambulance
                        </div>
                      </div>
                      <div className="p-4 rounded-[16px] squircle bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/[0.05] dark:border-white/[0.06]">
                        <div className="font-display text-xl sm:text-2xl font-bold tabular-nums text-[#BE123C] dark:text-rose-400">
                          112
                        </div>
                        <div className="font-body text-xs text-[#475569] dark:text-[#94A3B8] mt-1">
                          National SOS
                        </div>
                      </div>
                      <div className="p-4 rounded-[16px] squircle bg-[#F5F5F7] dark:bg-[#0B0F17] border border-black/[0.05] dark:border-white/[0.06]">
                        <div className="font-display text-xl sm:text-2xl font-bold tabular-nums text-[#0F766E] dark:text-[#2DD4BF]">
                          14416
                        </div>
                        <div className="font-body text-xs text-[#475569] dark:text-[#94A3B8] mt-1">
                          Tele-MANAS
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emergency Quick Trigger Strip */}
              <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <span className="font-body text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                  Need urgent medical or crisis guidance right now?
                </span>
                <motion.button
                  type="button"
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  onClick={onOpenEmergency}
                  className="px-4 py-2 rounded-[10px] squircle bg-[#BE123C] hover:bg-[#9F1239] text-white font-body text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  Open SOS 108 / 112
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right 4 cols: Clean Hairline Architectural Specification Ledger (no nested cards) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6 py-2">
            <div className="space-y-1 pb-4 border-b border-black/[0.08] dark:border-white/[0.1]">
              <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[#0F172A] dark:text-[#F8FAFC]">
                Built for private Indian healthcare
              </h3>
            </div>

            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08] flex-1">
              {COMPLIANCE_SPECS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="py-4 first:pt-0 last:pb-0 flex items-start gap-3.5">
                    <Icon
                      className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF] shrink-0 mt-1"
                      aria-hidden="true"
                    />
                    <div className="space-y-1">
                      <div className="font-display text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {item.title}
                      </div>
                      <p className="font-body text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.1] flex items-center justify-between gap-3">
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { x: 2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={onLogin}
                className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] hover:text-[#0F766E] dark:hover:text-[#2DD4BF] transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Log in to vault</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </motion.button>
              <span className="font-body font-devanagari text-xs text-[#475569] dark:text-[#94A3B8]">
                EN · हिन्दी · मराठी
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
