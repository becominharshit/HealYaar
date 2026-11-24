import React from 'react';
import { useApp } from '../context/AppContext';
import { Cookie, ArrowLeft, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export const CookiesPolicyView: React.FC = () => {
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
            <Cookie className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Cookies &amp; Local Storage Policy
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Effective Date: November 2026 • Policy Version 2.0
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-sm text-emerald-950 dark:text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Zero Advertising or Tracking Cookies:</strong> HealYaar does not load third-party ad networks, social media pixels, cross-site tracking cookies, or behavioral analytics scripts.
          </p>
        </div>

        <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              1. Strictly Essential Storage Only
            </h2>
            <p>
              To keep your health workspace secure and accessible, HealYaar uses browser storage strictly for core application functionality:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Authentication Session Tokens (Supabase Auth):</strong> Securely preserves your authenticated session and prevents unauthorized access to protected health tabs.
              </li>
              <li>
                <strong>User-Scoped IndexedDB RAG Vault (<code>HealYaar_RAG_&lt;userId&gt;</code>):</strong> Stores semantic embeddings of your uploaded reports and prescriptions locally on your device for instant private retrieval.
              </li>
              <li>
                <strong>Accessibility &amp; Display Preferences:</strong> Remembers your chosen theme (Light/Dark), text scale (A / A+ / A++), High Contrast toggle, preferred language, and cookie consent selection.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              2. Complete Cleanup on Sign Out &amp; Account Deletion
            </h2>
            <p>
              When you click <strong>Sign Out</strong>, HealYaar revokes your Supabase session, clears session storage and cached local state, stops active camera/microphone streams, and revokes all temporary file object URLs. Using <strong>Delete My Account &amp; All Health Data</strong> permanently wipes your user-scoped IndexedDB vault and cloud rows.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              3. Managing Browser Storage
            </h2>
            <p>
              You can clear local storage and IndexedDB at any time via your browser settings or from HealYaar&apos;s Account Details panel. Blocking essential authentication storage may prevent you from signing into your private vault.
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-400">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Essential-Only Storage Verified
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            Zero Third-Party Trackers
          </span>
        </div>
      </article>
    </div>
  );
};
