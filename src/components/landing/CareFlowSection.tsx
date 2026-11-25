import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

const CARE_STEPS = [
  {
    num: '01',
    title: 'Upload privately',
    desc: 'Sign in with Email or Google and add lab reports, handwritten prescriptions, or cycle logs — or explore read-only Demo Mode first. Real records stay strictly scoped to your account.'
  },
  {
    num: '02',
    title: 'Ask in your language',
    desc: 'Dual-Layer RAG combines your personal vault with WHO and ICMR-NIN clinical references, explaining values clearly in English, हिन्दी, or मराठी with hands-free voice readout.'
  },
  {
    num: '03',
    title: 'Walk in prepared',
    desc: 'Generate structured Clinician SOAP summaries, create one-click daily pill alarms, and locate nearby hospitals, doctors, and pharmacies on a live care map.'
  }
];

export const CareFlowSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="border-t border-black/[0.06] dark:border-white/[0.08] bg-[#FFFFFF] dark:bg-[#0B0F17] py-20 sm:py-28"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 space-y-12 sm:space-y-16">
        <h2 className="font-display font-semibold tracking-[-0.025em] text-[#0F172A] dark:text-[#F8FAFC] text-[clamp(1.875rem,3.4vw,2.85rem)] leading-[1.08] max-w-2xl">
          From handwritten slip to doctor-ready brief.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left 5 cols: Studio Macro Still with Clip-Path Reveal */}
          <div className="lg:col-span-5">
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { clipPath: 'inset(0 0 12% 0)', opacity: 0.75 }
              }
              whileInView={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { clipPath: 'inset(0 0 0% 0)', opacity: 1 }
              }
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[24px] squircle overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#111827] aspect-[16/11]"
            >
              <img
                src="/images/clinical-instruments-still.webp"
                alt="Brushed-titanium stethoscope chestpiece resting beside a frosted-glass clinical vial on a clean alabaster tray"
                loading="lazy"
                className="w-full h-full object-cover object-center dark:brightness-[0.86] dark:contrast-[1.05]"
              />
            </motion.div>
          </div>

          {/* Right 7 cols: Clean 3-Step Sequential Progression (no boxed cards) */}
          <div className="lg:col-span-7 divide-y divide-black/[0.08] dark:divide-white/[0.08] border-t border-b border-black/[0.08] dark:border-white/[0.08]">
            {CARE_STEPS.map((step) => (
              <div
                key={step.num}
                className="py-6 sm:py-7 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-baseline"
              >
                <div className="sm:col-span-2 font-display text-sm font-semibold tabular-nums text-[#0F766E] dark:text-[#2DD4BF]">
                  {step.num}
                </div>
                <div className="sm:col-span-10 space-y-2">
                  <h3 className="font-display text-lg sm:text-xl font-semibold tracking-[-0.015em] text-[#0F172A] dark:text-[#F8FAFC]">
                    {step.title}
                  </h3>
                  <p className="font-body text-sm sm:text-base text-[#475569] dark:text-[#CBD5E1] leading-relaxed max-w-prose">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
