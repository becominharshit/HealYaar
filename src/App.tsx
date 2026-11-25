import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { VoiceAssistantProvider } from './context/VoiceAssistantContext';
import { Navbar } from './components/Navbar';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { PermissionModal } from './components/PermissionModal';
import { VoiceAssistantBanner } from './components/VoiceAssistantBanner';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingBackground, FloatingTheme } from './components/FloatingBackground';
import { NavTab } from './types';

// Eager Landing View for instant first paint
import { LandingView } from './views/LandingView';
import { EmailVerificationPrompt } from './components/EmailVerificationPrompt';
import { AuthCallbackRecovery } from './components/AuthCallbackRecovery';

// Lazy-loaded non-landing views
const HomeView = lazy(() => import('./views/HomeView').then((m) => ({ default: m.HomeView })));
const AssistantView = lazy(() => import('./views/AssistantView').then((m) => ({ default: m.AssistantView })));
const SymptomGuidanceView = lazy(() => import('./views/SymptomGuidanceView').then((m) => ({ default: m.SymptomGuidanceView })));
const ReportsView = lazy(() => import('./views/ReportsView').then((m) => ({ default: m.ReportsView })));
const FoodNutritionView = lazy(() => import('./views/FoodNutritionView').then((m) => ({ default: m.FoodNutritionView })));
const DoctorsNearbyView = lazy(() => import('./views/DoctorsNearbyView').then((m) => ({ default: m.DoctorsNearbyView })));
const FitnessSupplementsView = lazy(() => import('./views/FitnessSupplementsView').then((m) => ({ default: m.FitnessSupplementsView })));
const PrescriptionsMedicinesView = lazy(() => import('./views/PrescriptionsMedicinesView').then((m) => ({ default: m.PrescriptionsMedicinesView })));
const MentalWellbeingView = lazy(() => import('./views/MentalWellbeingView').then((m) => ({ default: m.MentalWellbeingView })));
const PeriodTrackerView = lazy(() => import('./views/PeriodTrackerView').then((m) => ({ default: m.PeriodTrackerView })));
const RemindersView = lazy(() => import('./views/RemindersView').then((m) => ({ default: m.RemindersView })));
const LoginView = lazy(() => import('./views/LoginView').then((m) => ({ default: m.LoginView })));
const PrivacyPolicyView = lazy(() => import('./views/PrivacyPolicyView').then((m) => ({ default: m.PrivacyPolicyView })));
const TermsOfServiceView = lazy(() => import('./views/TermsOfServiceView').then((m) => ({ default: m.TermsOfServiceView })));
const CookiesPolicyView = lazy(() => import('./views/CookiesPolicyView').then((m) => ({ default: m.CookiesPolicyView })));
const RefundPolicyView = lazy(() => import('./views/RefundPolicyView').then((m) => ({ default: m.RefundPolicyView })));

import { Heart, AlertOctagon, Sparkles, Loader2, LogIn, Eye } from 'lucide-react';

const EMAIL_VERIFICATION_PROTECTED_TABS: NavTab[] = ['reports', 'medicines', 'period', 'reminders'];

const TAB_THEME_MAP: Record<NavTab, FloatingTheme> = {
  landing: 'home',
  home: 'home',
  assistant: 'assistant',
  symptoms: 'symptoms',
  reports: 'reports',
  nutrition: 'nutrition',
  doctors: 'doctors',
  fitness: 'supplements',
  medicines: 'medicines',
  mental: 'mental-wellbeing',
  period: 'period',
  reminders: 'reminders',
  login: 'login',
  privacy: 'home',
  terms: 'home',
  cookies: 'home',
  refund: 'home'
};

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[45vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
    <Loader2 className="w-7 h-7 text-teal-600 dark:text-teal-400 animate-spin" aria-hidden="true" />
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading workspace...</p>
  </div>
);

const MainLayout: React.FC = () => {
  const {
    tab,
    setTab,
    toastMessage,
    openEmergencyModal,
    currentUser,
    isDemoMode,
    exitDemoMode,
    isAuthLoading,
    sessionResetNonce,
    logout,
    authCallbackError,
    clearAuthCallbackError
  } = useApp();

  // 1. Session verification loading state: prevent content flash (FOUC)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white flex items-center justify-center font-black shadow-lg shadow-teal-500/20 animate-pulse">
            <Heart className="w-8 h-8 fill-white/20" aria-hidden="true" />
          </div>
          <Loader2 className="w-7 h-7 text-teal-600 dark:text-teal-400 animate-spin" aria-hidden="true" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Verifying HealYaar Session...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connecting to secure health vault
          </p>
        </div>
      </div>
    );
  }

  // 2. Strict Authentication Gate (Public entry = LandingView + Login + 4 Public Legal Policies ONLY)
  if (!currentUser) {
    const renderPublicView = () => {
      if (authCallbackError) {
        return (
          <main id="main-content" className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <AuthCallbackRecovery
              errorCode={authCallbackError.code}
              errorDescription={authCallbackError.description}
              onClearError={clearAuthCallbackError}
            />
          </main>
        );
      }

      if (tab === 'privacy') {
        return (
          <main id="main-content" className="flex-1 relative z-10 pb-36 sm:pb-28">
            <Suspense fallback={<RouteLoadingFallback />}>
              <PrivacyPolicyView />
            </Suspense>
          </main>
        );
      }
      if (tab === 'terms') {
        return (
          <main id="main-content" className="flex-1 relative z-10 pb-36 sm:pb-28">
            <Suspense fallback={<RouteLoadingFallback />}>
              <TermsOfServiceView />
            </Suspense>
          </main>
        );
      }
      if (tab === 'cookies') {
        return (
          <main id="main-content" className="flex-1 relative z-10 pb-36 sm:pb-28">
            <Suspense fallback={<RouteLoadingFallback />}>
              <CookiesPolicyView />
            </Suspense>
          </main>
        );
      }
      if (tab === 'refund') {
        return (
          <main id="main-content" className="flex-1 relative z-10 pb-36 sm:pb-28">
            <Suspense fallback={<RouteLoadingFallback />}>
              <RefundPolicyView />
            </Suspense>
          </main>
        );
      }
      if (tab === 'login') {
        return (
          <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
            <FloatingBackground theme="login" />
            <main id="main-content" className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 relative z-10">
              <Suspense fallback={<RouteLoadingFallback />}>
                <LoginView />
              </Suspense>
            </main>
            <footer className="border-t border-slate-200/60 dark:border-slate-800/60 pt-6 pb-44 sm:pb-32 px-4 text-center text-xs text-slate-500 dark:text-slate-400 relative z-10 space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-4 font-semibold">
                <button type="button" onClick={() => setTab('landing')} className="hover:text-teal-700 dark:hover:text-teal-400 hover:underline">
                  Home
                </button>
                <button type="button" onClick={() => setTab('privacy')} className="hover:text-teal-700 dark:hover:text-teal-400 hover:underline">
                  Privacy Policy
                </button>
                <button type="button" onClick={() => setTab('terms')} className="hover:text-teal-700 dark:hover:text-teal-400 hover:underline">
                  Terms &amp; Conditions
                </button>
                <button type="button" onClick={() => setTab('cookies')} className="hover:text-teal-700 dark:hover:text-teal-400 hover:underline">
                  Cookies Policy
                </button>
                <button type="button" onClick={() => setTab('refund')} className="hover:text-teal-700 dark:hover:text-teal-400 hover:underline">
                  Refund &amp; Free-Access
                </button>
              </div>
              <p>© {new Date().getFullYear()} HealYaar • Accessible AI Health Companion. Row-level encrypted &amp; verified.</p>
            </footer>
          </div>
        );
      }

      // Default unauthenticated landing experience
      return <LandingView />;
    };

    return (
      <div className="min-h-screen flex flex-col bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
        <ErrorBoundary onNavigateHome={() => setTab('landing')}>
          {renderPublicView()}
        </ErrorBoundary>

        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white shadow-xl border border-slate-700/80 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in max-w-md"
          >
            <Sparkles className="w-4 h-4 text-teal-400 flex-shrink-0" aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
        )}

        <EmergencySOSModal />
        <CookieConsentBanner />
      </div>
    );
  }

  // 3. Authenticated (or Read-Only Demo) Application Views
  const renderActiveView = () => {
    const requiresVerifiedEmail = EMAIL_VERIFICATION_PROTECTED_TABS.includes(tab);

    if (!isDemoMode && requiresVerifiedEmail && currentUser && !currentUser.emailConfirmed) {
      return <EmailVerificationPrompt user={currentUser} onSignOut={logout} />;
    }

    switch (tab) {
      case 'home':
      case 'landing':
        return <HomeView />;
      case 'assistant':
        return <AssistantView />;
      case 'symptoms':
        return <SymptomGuidanceView />;
      case 'reports':
        return <ReportsView />;
      case 'nutrition':
        return <FoodNutritionView />;
      case 'doctors':
        return <DoctorsNearbyView />;
      case 'fitness':
        return <FitnessSupplementsView />;
      case 'medicines':
        return <PrescriptionsMedicinesView />;
      case 'mental':
        return <MentalWellbeingView />;
      case 'period':
        return <PeriodTrackerView />;
      case 'reminders':
        return <RemindersView />;
      case 'login':
        return <LoginView />;
      case 'privacy':
        return <PrivacyPolicyView />;
      case 'terms':
        return <TermsOfServiceView />;
      case 'cookies':
        return <CookiesPolicyView />;
      case 'refund':
        return <RefundPolicyView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Skip to Main Content Link for Screen Readers & Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-xl focus:shadow-xl font-bold"
      >
        Skip to main content
      </a>

      {/* Left Vertical Sidebar & Sticky Top Header */}
      <Navbar />

      {/* Main Content & Footer Area Offset Beside Sidebar */}
      <div className="flex-1 flex flex-col md:pl-20 lg:pl-64 xl:pl-72 transition-all duration-200 min-w-0 relative">
        {/* Subtle Demo Mode Top Banner */}
        {isDemoMode && (
          <div
            role="region"
            aria-label="Live Demo Mode notice"
            className="sticky top-[60px] md:top-[57px] z-20 bg-amber-50/95 dark:bg-amber-950/90 backdrop-blur-md border-b border-amber-200 dark:border-amber-800/80 px-4 sm:px-6 lg:px-8 py-2"
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 dark:text-amber-100">
              <div className="flex items-center gap-2 font-semibold">
                <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
                <span>
                  <strong>Live Demo Mode (Read-Only):</strong> Exploring sample lab reports, prescriptions &amp; Clinician SOAP preview.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exitDemoMode('login')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign In for Real Storage</span>
                </button>
                <button
                  type="button"
                  onClick={() => exitDemoMode('landing')}
                  className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-semibold text-xs transition-colors"
                >
                  Exit Demo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Atmospheric Floating Thematic Background Layer (Changes per page) */}
        <FloatingBackground
          theme={TAB_THEME_MAP[tab] || 'home'}
          className="md:left-20 lg:left-64 xl:left-72"
        />

        {/* Main Content View Container (pb-28 ensures floating Voice Assistant never covers controls) */}
        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-28 relative z-10">
          <ErrorBoundary key={`${tab}-${sessionResetNonce}`} onNavigateHome={() => setTab('home')}>
            <Suspense fallback={<RouteLoadingFallback />}>
              {renderActiveView()}
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Accessible Footer with Legal Links (generous bottom clearance so cookie banner never overlaps links) */}
        <footer className="mt-auto border-t border-white/60 dark:border-slate-800/60 glass-card-subtle backdrop-blur-xl pt-8 pb-44 sm:pb-36 px-4 sm:px-6 lg:px-8 text-slate-600 dark:text-slate-400 text-xs sm:text-sm relative z-10">
          <div className="max-w-7xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white flex items-center justify-center font-black shadow-xs flex-shrink-0">
                  <Heart className="w-5 h-5 fill-white/20" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Heal<span className="text-teal-600 dark:text-teal-400">Yaar</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Accessible AI Health Companion • Verified Plain-Language Guidance
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <nav aria-label="Legal policy links" className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <button type="button" onClick={() => setTab('privacy')} className="hover:text-teal-700 dark:hover:text-teal-400 hover:underline">
                    Privacy
                  </button>
                  <button type="button" onClick={() => setTab('terms')} className="hover:text-teal-700 dark:hover:text-teal-400 hover:underline">
                    Terms
                  </button>
                  <button type="button" onClick={() => setTab('cookies')} className="hover:text-teal-700 dark:hover:text-teal-400 hover:underline">
                    Cookies
                  </button>
                  <button type="button" onClick={() => setTab('refund')} className="hover:text-teal-700 dark:hover:text-teal-400 hover:underline">
                    Refund Policy
                  </button>
                </nav>

                <button
                  type="button"
                  onClick={openEmergencyModal}
                  className="interactive-button px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                  <span>Emergency SOS (112 / 108)</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200/70 dark:border-slate-800/60 pt-4 space-y-1.5">
              <p>
                <strong>Important Medical Disclaimer:</strong> HealYaar is an educational and communication support platform designed to explain medical terms, test reports, and health concepts in simple, plain language. It does not provide medical diagnosis, write prescriptions, recommend stopping or changing treatments, or replace the care of a licensed healthcare professional.
              </p>
              <p>
                <strong>Privacy Guarantee:</strong> Health records, menstrual cycle entries, and medicine reminders are isolated strictly to your authenticated account with PostgreSQL Row-Level Security and user-scoped IndexedDB vaults.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-4 sm:right-6 z-50 p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white shadow-xl border border-slate-700/80 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in max-w-md"
        >
          <Sparkles className="w-4 h-4 text-teal-400 flex-shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals, Cookie Banner & Floating Voice Banner */}
      <EmergencySOSModal />
      <PermissionModal />
      <CookieConsentBanner />
      <VoiceAssistantBanner />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <VoiceAssistantProvider>
        <MainLayout />
      </VoiceAssistantProvider>
    </AppProvider>
  );
}

export default App;
