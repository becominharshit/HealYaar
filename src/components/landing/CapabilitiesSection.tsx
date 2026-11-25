import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarHeart, FileText, MapPin, Stethoscope, Utensils } from 'lucide-react';

export const CapabilitiesSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="border-t border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#0D1119] py-20 sm:py-28"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 space-y-12 sm:space-y-14">
        <h2 className="font-display font-semibold tracking-[-0.025em] text-[#0F172A] dark:text-[#F8FAFC] text-[clamp(1.875rem,3.4vw,2.85rem)] leading-[1.08] max-w-2xl">
          Designed for patients, families, and clinicians.
        </h2>

        {/* Top Row: Two Featured White Elevated Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[24px] squircle bg-[#FFFFFF] dark:bg-[#111827] border border-black/[0.06] dark:border-white/[0.08] p-7 sm:p-9 flex flex-col justify-between gap-6 landing-card-hover"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[12px] squircle bg-[#F0FDFA] dark:bg-[#0F766E]/20 text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center">
                <FileText className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#0F172A] dark:text-[#F8FAFC]">
                Lab &amp; Prescription Vision
              </h3>
              <p className="font-body text-sm sm:text-base text-[#475569] dark:text-[#CBD5E1] leading-relaxed max-w-xl">
                Upload blood reports or handwritten prescriptions to extract biomarkers, medicine timings, and one-click daily pill reminders.
              </p>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] font-body text-xs sm:text-sm font-medium text-[#475569] dark:text-[#94A3B8]">
              Biomarker extraction · Plain-language notes · One-click pill alarms
            </div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[24px] squircle bg-[#FFFFFF] dark:bg-[#111827] border border-black/[0.06] dark:border-white/[0.08] p-7 sm:p-9 flex flex-col justify-between gap-6 landing-card-hover"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[12px] squircle bg-[#F0FDFA] dark:bg-[#0F766E]/20 text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center">
                <MapPin className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#0F172A] dark:text-[#F8FAFC]">
                Live Care Map &amp; Saved Clinics
              </h3>
              <p className="font-body text-sm sm:text-base text-[#475569] dark:text-[#CBD5E1] leading-relaxed max-w-xl">
                Search nearby hospitals, clinics, doctors, and pharmacies with GPS or PIN code, compare distances, open one-click directions, and save trusted clinics to your account.
              </p>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] font-body text-xs sm:text-sm font-medium text-[#475569] dark:text-[#94A3B8]">
              Haversine distance · Saved favorites · Interactive Leaflet map
            </div>
          </motion.div>
        </div>

        {/* Bottom Band: Open 3-Column Typographic Row (no boxed card clutter) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
          <div className="border-t border-black/[0.08] dark:border-white/[0.1] pt-6 space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#0F766E] dark:text-[#2DD4BF]">
              <Utensils className="w-4 h-4 shrink-0" aria-hidden="true" />
              <h3 className="font-display text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                ICMR-NIN Indian Nutrition
              </h3>
            </div>
            <p className="font-body text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
              Log meals using everyday Indian household measures like &ldquo;1 katori dal, 2 rotis&rdquo; or analyze food photos with ICMR-NIN reference tables.
            </p>
          </div>

          <div className="border-t border-black/[0.08] dark:border-white/[0.1] pt-6 space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#BE123C] dark:text-rose-400">
              <CalendarHeart className="w-4 h-4 shrink-0" aria-hidden="true" />
              <h3 className="font-display text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Private Cycle Sanctuary
              </h3>
            </div>
            <p className="font-body text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
              Track periods, predicted phases, symptoms, and monthly calendar views with full edit and delete control under user-isolated database encryption.
            </p>
          </div>

          <div className="border-t border-black/[0.08] dark:border-white/[0.1] pt-6 space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#0F766E] dark:text-[#2DD4BF]">
              <Stethoscope className="w-4 h-4 shrink-0" aria-hidden="true" />
              <h3 className="font-display text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Senior Voice &amp; A++ Text
              </h3>
            </div>
            <p className="font-body text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
              Structured symptom check-ins, 4-4-6 calming breathing pacers, daily medication alarms, high-contrast mode, and hands-free voice guidance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
