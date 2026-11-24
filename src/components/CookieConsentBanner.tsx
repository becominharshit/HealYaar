import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PortalModal } from './ui/PortalModal';
import { Cookie, ShieldCheck, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'healyaar_cookie_consent_v2';

export interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  timestamp: string;
}

export const CookieConsentBanner: React.FC = () => {
  const { setTab } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [allowPreferences, setAllowPreferences] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = (preferencesAllowed: boolean) => {
    const prefs: CookiePreferences = {
      essential: true,
      preferences: preferencesAllowed,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage errors
    }
    setIsVisible(false);
    setShowCustomize(false);
  };

  if (!isVisible && !showCustomize) return null;

  return (
    <>
      {isVisible && (
        <aside
          role="region"
          aria-label="Cookie and essential storage notice"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-40 animate-fade-in"
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 sm:p-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex-shrink-0">
                <Cookie className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5 flex-1">
                <h2 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Essential Storage Only — Zero Ad Trackers
                </h2>
                <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                  Strictly essential storage for your secure session, local RAG vault, and accessibility settings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => saveConsent(true)}
                aria-label="Dismiss essential storage notice"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => saveConsent(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap"
              >
                Accept Essential
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('cookies');
                  setShowCustomize(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Cookies Policy
              </button>
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="px-2 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                Settings
              </button>
            </div>
          </div>
        </aside>
      )}

      <PortalModal
        isOpen={showCustomize}
        onClose={() => setShowCustomize(false)}
        ariaLabelledBy="cookie-prefs-title"
      >
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <h3 id="cookie-prefs-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                Storage Preferences
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomize(false)}
              aria-label="Close storage preferences"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Strictly Essential Auth &amp; Vault</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Required for login sessions and per-user IndexedDB isolation.
                </p>
              </div>
              <span className="font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">Always On</span>
            </div>

            <label
              htmlFor="cookie-pref-accessibility"
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 cursor-pointer"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Accessibility &amp; Display Settings</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Remembers text size (A++), high contrast, dark mode, and language.
                </p>
              </div>
              <input
                id="cookie-pref-accessibility"
                type="checkbox"
                checked={allowPreferences}
                onChange={(e) => setAllowPreferences(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => saveConsent(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={() => saveConsent(allowPreferences)}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </PortalModal>
    </>
  );
};
