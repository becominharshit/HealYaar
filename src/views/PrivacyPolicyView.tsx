import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Database, EyeOff, Server, Cookie, HelpCircle } from 'lucide-react';
import { NavTab } from '../types';

interface PrivacyPolicyViewProps {
  onBack: () => void;
  onOpenCookies?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack, onOpenCookies }) => {
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-2 sm:px-4 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="interactive-button px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Last Updated: October 2026
          </span>
        </div>
      </div>

      {/* Main Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200/60 dark:border-teal-800/60">
          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Verified Privacy Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
      </div>

      {/* Owner Identity Notice & Placeholders */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          <span>Entity Notice & Contact Details</span>
        </p>
        <p>
          HealYaar is operated by <strong>[Legal Entity / App Owner Name - To be provided by owner]</strong> (&quot;HealYaar&quot;, &quot;we&quot;, &quot;us&quot;). For inquiries regarding personal data protection, reach out to <strong>[Support & Data Protection Contact - e.g. privacy@healyaar.com]</strong> at <strong>[Physical Address / Jurisdiction - To be provided by owner]</strong>.
        </p>
      </div>

      {/* Section 1: Core Privacy Principles */}
      <div className="interactive-card bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>1. Core Privacy Commitments</span>
        </h2>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside">
          <li><strong>No Data Brokering:</strong> We never sell, rent, or trade your personal health logs, cycle entries, medical reports, or chat prompts to data brokers or third-party marketing companies.</li>
          <li><strong>Zero Third-Party Advertising Trackers:</strong> HealYaar does not load advertising beacons, tracking pixels, or third-party profiling scripts.</li>
          <li><strong>User Isolation:</strong> All sensitive health data is isolated strictly to your authenticated account ID using cryptographic user-scoped access control.</li>
        </ul>
      </div>

      {/* Section 2: What We Collect & How We Store It */}
      <div className="interactive-card bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>2. Data Collection and Technical Architecture</span>
        </h2>
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white">Account Authentication Credentials</h3>
            <p>
              When you create an account, Supabase Auth securely stores your email, encrypted password hash (bcrypt), and account creation timestamps. Your plaintext password is never accessible to HealYaar staff.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white">On-Device RAG Health Vault & Embeddings</h3>
            <p>
              HealYaar utilizes a private client-side Retrieval-Augmented Generation (RAG) system. Document chunks and dense embeddings derived from your reports and notes are stored locally in your browser&apos;s <code>IndexedDB</code> (database name format: <code>HealYaar_RAG_[userId]</code>). This data is indexed directly on your device.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white">Prescriptions, Period Tracker & Reminders</h3>
            <p>
              When configured with Supabase, health records are synchronized to dedicated tables (<code>medical_reports</code>, <code>period_cycles</code>, <code>medication_reminders</code>) strictly bound to your authenticated user identifier via Row-Level Security (RLS). When in offline mode, data is securely stored in your browser&apos;s user-scoped localStorage.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Cookies and Local Storage */}
      <div className="interactive-card bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Cookie className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>3. Cookies and Browser Storage</span>
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            HealYaar uses local storage keys strictly for application functionality:
          </p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>Strictly Necessary:</strong> <code>healyaar_sb_auth_token</code> (Supabase Auth session token), <code>healyaar_auth_user</code> (active session state), <code>theme</code> (UI theme preference).</li>
            <li><strong>Optional Preferences:</strong> <code>healyaar_remembered_identifier</code> (remembered email for sign in convenience, saved only with explicit user consent).</li>
            <li><strong>Consent Choice:</strong> <code>healyaar_cookie_consent</code> (stores your accepted privacy preferences).</li>
          </ul>
          {onOpenCookies && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenCookies}
                className="interactive-button px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-xs"
              >
                Change or Withdraw Cookie Consent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Your Data Rights & Erasure */}
      <div className="interactive-card bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <EyeOff className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>4. Your Rights & Data Erasure</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            You retain complete control over your health information:
          </p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>Instant Client Erasure:</strong> Signing out with cache-clearing or resetting your account immediately wipes all locally stored records, chat history, and IndexedDB RAG vaults from the current device.</li>
            <li><strong>Right to Deletion:</strong> You can request complete deletion of your Supabase profile and associated data at any time by contacting our support team at <strong>[Support Email]</strong>.</li>
            <li><strong>Right to Rectification:</strong> You may edit or delete individual reminders, cycle entries, or prescription records at any time directly through the UI.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
