import React from 'react';
import { useApp } from '../context/AppContext';
import { HeartHandshake, ArrowLeft, CheckCircle2, Info } from 'lucide-react';

export const RefundPolicyView: React.FC = () => {
  const { setTab, currentUser } = useApp();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setTab(currentUser ? 'home' : 'landing')}
          className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 dark:text-teal-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{currentUser ? 'Back to Dashboard' : 'Back to Home'}</span>
        </button>

        {!currentUser && (
          <button
            type="button"
            onClick={() => setTab('login')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
          >
            Log In
          </button>
        )}
      </div>

      <article className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-2xl">
            <HeartHandshake className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Refund &amp; Free-Access Policy
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Effective Date: November 2026 • Policy Version 2.0
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 flex items-start gap-3 text-sm text-teal-950 dark:text-teal-200">
          <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>100% Free Public Access:</strong> HealYaar is provided free of charge for patients, seniors, caregivers, and healthcare educators. We do not collect credit cards, UPI payments, or subscription fees inside the platform.
          </p>
        </div>

        <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              1. No Commercial Transactions or Medicine Sales
            </h2>
            <p>
              HealYaar does not sell medicines, process pharmacy checkouts, or collect consultation payments. The <strong>Demo Pharmacy Cart</strong> inside the Prescriptions module is strictly an educational simulation and never charges real money or transmits orders to external vendors.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              2. Third-Party Clinics &amp; Pharmacies
            </h2>
            <p>
              When you call a nearby pharmacy or contact a clinic listed in the Doctors Nearby directory, any appointment fees, medicine purchases, billing, or refund terms are strictly between you and that independent healthcare provider or licensed pharmacy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              3. Future Paid Features Commitment
            </h2>
            <p>
              If optional paid enterprise or clinician features are ever introduced in the future, core patient accessibility tools and emergency safety features will remain free, and any paid plan will provide transparent upfront pricing and a 14-day full refund guarantee.
            </p>
          </section>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Questions regarding access or billing? Contact our accessibility support team at{' '}
            <strong className="text-slate-800 dark:text-slate-200">support@healyaar.org</strong>.
          </p>
        </div>
      </article>
    </div>
  );
};
