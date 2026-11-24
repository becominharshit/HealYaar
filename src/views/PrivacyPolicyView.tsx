import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, Database, Trash2, ArrowLeft, FileCheck } from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
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
            <ShieldCheck className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Effective Date: November 2026 • Policy Version 2.0 (DPDP Act 2023 Aligned)
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              1. Data Minimization &amp; What We Collect
            </h2>
            <p>
              HealYaar follows strict data minimization. When you create an account, we only collect your <strong>full name</strong>, <strong>email address</strong>, and encrypted authentication credentials via Supabase Auth (or your Google OAuth basic profile if you choose Google Sign-In).
            </p>
            <p>
              Optional health data you choose to add—such as medical reports, prescriptions, medication reminders, menstrual cycle entries, meal logs, and daily activity logs—is stored strictly under your authenticated user ID.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              2. Per-User Isolation, Row-Level Security &amp; IndexedDB Vault
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>PostgreSQL Row-Level Security (RLS):</strong> Every database table enforces strict <code>auth.uid() = user_id</code> policies across <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, and <code>DELETE</code> operations so no user can ever access another user&apos;s health records.
              </li>
              <li>
                <strong>Local Device RAG Isolation:</strong> Dual-Layer RAG vector embeddings are stored in a user-scoped browser IndexedDB database (<code>HealYaar_RAG_&lt;userId&gt;</code>) and never shared across accounts.
              </li>
              <li>
                <strong>Voice &amp; Camera Privacy:</strong> Voice input activates strictly when you tap the microphone button. All active media tracks and temporary object URLs are immediately stopped and revoked upon sign-out.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              3. AI Processing &amp; Zero Data Resale
            </h2>
            <p>
              When AI language generation is enabled, only the minimal retrieved clinical context required to answer your prompt is processed to generate plain-language explanations. HealYaar NEVER sells, rents, or shares personal health information with advertisers, data brokers, or insurance companies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
              4. Your Rights &amp; Instant Data Deletion
            </h2>
            <p>
              You retain complete ownership of your data. At any time, you may edit or delete individual reports, prescriptions, reminders, or cycle logs, clear your local RAG Vault, or click <strong>Delete My Account &amp; All Health Data</strong> in Account Details to permanently purge your IndexedDB vault, local browser caches, and Supabase database rows.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
};
