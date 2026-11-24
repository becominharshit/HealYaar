import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Check, X, SlidersHorizontal, ExternalLink } from 'lucide-react';
import { NavTab } from '../types';

export interface CookiePreferences {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  consentDate: string;
}

const STORAGE_KEY = 'healyaar_cookie_consent';

export function getCookiePreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

export function saveCookiePreferences(prefs: Omit<CookiePreferences, 'necessary' | 'consentDate'>): CookiePreferences {
  const full: CookiePreferences = {
    necessary: true,
    preferences: Boolean(prefs.preferences),
    analytics: Boolean(prefs.analytics),
    consentDate: new Date().toISOString()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent('healyaar_cookie_consent_updated', { detail: full }));
  } catch {
    // Ignore storage quota issues
  }
  return full;
}

export function hasConsentedTo(category: 'preferences' | 'analytics'): boolean {
  const current = getCookiePreferences();
  if (!current) return false;
  return Boolean(current[category]);
}

interface CookieConsentBannerProps {
  onNavigateTab?: (tab: NavTab) => void;
  isOpenPreferencesExternal?: boolean;
  onClosePreferencesExternal?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onNavigateTab,
  isOpenPreferencesExternal = false,
  onClosePreferencesExternal
}) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Preference modal toggles
  const [prefToggles, setPrefToggles] = useState({
    preferences: false,
    analytics: false
  });

  useEffect(() => {
    const existing = getCookiePreferences();
    if (existing) {
      setPreferences(existing);
      setPrefToggles({
        preferences: existing.preferences,
        analytics: existing.analytics
      });
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }

    const handleConsentEvent = () => {
      const updated = getCookiePreferences();
      if (updated) {
        setPreferences(updated);
        setPrefToggles({
          preferences: updated.preferences,
          analytics: updated.analytics
        });
      }
    };

    window.addEventListener('healyaar_cookie_consent_updated', handleConsentEvent);
    return () => window.removeEventListener('healyaar_cookie_consent_updated', handleConsentEvent);
  }, []);

  useEffect(() => {
    if (isOpenPreferencesExternal) {
      setModalOpen(true);
    }
  }, [isOpenPreferencesExternal]);

  const handleAcceptAll = () => {
    const saved = saveCookiePreferences({ preferences: true, analytics: true });
    setPreferences(saved);
    setShowBanner(false);
    setModalOpen(false);
    if (onClosePreferencesExternal) onClosePreferencesExternal();
  };

  const handleRejectOptional = () => {
    const saved = saveCookiePreferences({ preferences: false, analytics: false });
    setPreferences(saved);
    setShowBanner(false);
    setModalOpen(false);
    if (onClosePreferencesExternal) onClosePreferencesExternal();
  };

  const handleSaveCustom = () => {
    const saved = saveCookiePreferences({
      preferences: prefToggles.preferences,
      analytics: prefToggles.analytics
    });
    setPreferences(saved);
    setShowBanner(false);
    setModalOpen(false);
    if (onClosePreferencesExternal) onClosePreferencesExternal();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (onClosePreferencesExternal) onClosePreferencesExternal();
  };

  // Keyboard accessibility: ESC to dismiss preferences modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  return (
    <>
      {/* 1. Cookie Notice Banner (Shows once on first visit until decision made) */}
      {showBanner && !modalOpen && (
        <section
          role="region"
          aria-label="Privacy and Cookie Choices"
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in"
        >
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
                <Cookie className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <span>Your Privacy & Cookie Choices on HealYaar</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                We use strictly necessary cookies to keep your authentication session secure and provide core health accessibility features. With your permission, we also use optional preferences (to remember your email and language) and anonymous diagnostics. We never sell your health records or share your personal data with third-party advertising networks.
              </p>
              <div className="pt-1 flex items-center gap-4 text-xs font-semibold text-teal-700 dark:text-teal-300">
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('privacy')}
                  className="hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Read Privacy Policy</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('terms')}
                  className="hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Terms of Service</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Three Equal Prominence Action Buttons */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none"
              >
                <Check className="w-4 h-4" />
                <span>Accept all</span>
              </button>

              <button
                type="button"
                onClick={handleRejectOptional}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
                <span>Reject optional</span>
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-teal-700 dark:text-teal-400 border border-teal-300 dark:border-teal-700 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Manage preferences</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. Detailed Preference Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="cookie-modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Cookie & Storage Preferences
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Control how HealYaar handles browser cookies and data
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                aria-label="Close preferences"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Category 1: Strictly Necessary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Strictly Necessary (Always Active)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Required
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Required for user authentication via Supabase Auth, secure token refresh, and essential high-contrast / dark theme rendering. Cannot be disabled.
                </p>
              </div>

              {/* Category 2: Functional / Preferences */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Preferences & Convenience
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Remember login email, preferred audio playback speed, and last active tab.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3">
                    <input
                      type="checkbox"
                      checked={prefToggles.preferences}
                      onChange={(e) => setPrefToggles(prev => ({ ...prev, preferences: e.target.checked }))}
                      className="sr-only peer"
                      aria-label="Enable preferences and convenience cookies"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>

              {/* Category 3: Analytics / Diagnostics */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Anonymous Telemetry & Diagnostics
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Collects anonymous UI performance and client-side error telemetry to fix bugs. Never contains health records.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3">
                    <input
                      type="checkbox"
                      checked={prefToggles.analytics}
                      onChange={(e) => setPrefToggles(prev => ({ ...prev, analytics: e.target.checked }))}
                      className="sr-only peer"
                      aria-label="Enable anonymous telemetry and diagnostics"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleRejectOptional}
                className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Reject all optional
              </button>
              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
                >
                  Save preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
