import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  NavTab,
  SupportedLanguage,
  TextSize,
  ReminderItem,
  PeriodCycleEntry,
  AuthGateState
} from '../types';
import {
  authService,
  AuthUser,
  LoginCredentials,
  SignUpCredentials,
  AuthResult
} from '../services/authService';
import { reminderService } from '../services/reminderService';
import { periodService } from '../services/periodService';
import { userPreferencesService } from '../services/userPreferencesService';
import { indexPeriodLog, deleteChunksBySource } from '../services/rag/ragVaultService';
import {
  handleIncomingAuthCallback,
  getStoredAuthCallbackError,
  clearStoredAuthCallbackError
} from '../services/authCallbackService';
import { getSafeTranslations, Translations } from '../i18n/translations';
import { VoiceService, VoiceCommandMatch } from '../services/voiceService';
import { teardownAllMediaAndBlobs } from '../utils/mediaSessionCleanup';
import {
  PUBLIC_TABS,
  getPathForTab,
  getTabForPath,
  resolveAuthorizedTab
} from '../utils/routePaths';

export { PUBLIC_TABS };

export interface PermissionModalState {
  isOpen: boolean;
  type: 'mic' | 'location' | 'notifications' | 'report_ocr' | 'rx_ocr';
  title: string;
  description: string;
  onGranted: () => void;
  onDenied: () => void;
}

interface AppContextType {
  tab: NavTab;
  setTab: (tab: NavTab) => void;
  intendedTab: NavTab | null;
  setIntendedTab: (tab: NavTab | null) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  toggleHighContrast: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  
  // Emergency
  isEmergencyModalOpen: boolean;
  openEmergencyModal: () => void;
  closeEmergencyModal: () => void;

  // Voice Interaction
  isListening: boolean;
  liveTranscript: string;
  voiceStatus: string;
  startVoiceListening: (customCallback?: (transcript: string) => void) => void;
  stopVoiceListening: () => void;
  isAudioPlaying: boolean;
  speakText: (text: string) => void;
  stopSpeaking: () => void;

  // Permissions Dialog
  permissionModal: PermissionModalState;
  requestPermission: (
    type: 'mic' | 'location' | 'notifications' | 'report_ocr' | 'rx_ocr',
    title: string,
    description: string,
    onGranted: () => void,
    onDenied?: () => void
  ) => void;
  closePermissionModal: () => void;

  // Permission Granted States
  permissions: {
    mic: boolean;
    location: boolean;
    notifications: boolean;
    reportOcr: boolean;
    rxOcr: boolean;
  };

  // Reminders Management
  reminders: ReminderItem[];
  addReminder: (reminder: Omit<ReminderItem, 'id' | 'createdDate'>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;

  // Period Tracker Cloud & Local Storage Management
  periodLogs: PeriodCycleEntry[];
  savePeriodLog: (entry: Omit<PeriodCycleEntry, 'id'>) => void;
  updatePeriodLog: (entry: PeriodCycleEntry) => void;
  deletePeriodLog: (id: string) => void;
  deletePeriodLogs: () => void;

  // Feedback Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Authentication Management (Supabase Auth)
  authGateState: AuthGateState;
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  sessionResetNonce: number;
  authCallbackError: { code: string; description: string } | null;
  clearAuthCallbackError: () => void;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  signup: (credentials: SignUpCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  deleteAccountAndAllData: () => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | null>(null);

function syncBrowserUrl(targetTab: NavTab, replace = false): void {
  try {
    const nextPath = getPathForTab(targetTab);
    if (window.location.pathname !== nextPath) {
      if (replace) {
        window.history.replaceState({ tab: targetTab }, '', nextPath);
      } else {
        window.history.pushState({ tab: targetTab }, '', nextPath);
      }
    }
  } catch {
    // ignore history errors in sandboxed frames
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getStoredUser());
  const currentUserRef = useRef<AuthUser | null>(currentUser);
  currentUserRef.current = currentUser;

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [sessionResetNonce, setSessionResetNonce] = useState<number>(0);
  const isManualLogoutRef = useRef<boolean>(false);
  const isAuthTransitionRef = useRef<boolean>(true);
  const toastTimerRef = useRef<number | null>(null);

  const [authCallbackError, setAuthCallbackError] = useState<{ code: string; description: string } | null>(() => {
    return getStoredAuthCallbackError();
  });

  const clearAuthCallbackError = () => {
    clearStoredAuthCallbackError();
    setAuthCallbackError(null);
  };

  const authGateState: AuthGateState = isAuthLoading
    ? 'loading'
    : currentUser
    ? 'authenticated'
    : 'unauthenticated';

  const initialRequestedTab = typeof window !== 'undefined' ? getTabForPath(window.location.pathname) : 'landing';
  const [tab, setTabState] = useState<NavTab>(() =>
    resolveAuthorizedTab(initialRequestedTab, Boolean(authService.getStoredUser()))
  );
  const [intendedTab, setIntendedTab] = useState<NavTab | null>(() =>
    !authService.getStoredUser() && !PUBLIC_TABS.includes(initialRequestedTab)
      ? initialRequestedTab
      : null
  );

  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('healyaar_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // ignore
    }
    return 'light';
  });
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);

  // Voice state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 4000);
  };

  // Permissions state
  const [permissions, setPermissions] = useState({
    mic: false,
    location: false,
    notifications: false,
    reportOcr: false,
    rxOcr: false,
  });

  const [permissionModal, setPermissionModal] = useState<PermissionModalState>({
    isOpen: false,
    type: 'mic',
    title: '',
    description: '',
    onGranted: () => {},
    onDenied: () => {},
  });

  // Reminders State
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  // Period Tracker State
  const [periodLogs, setPeriodLogs] = useState<PeriodCycleEntry[]>([]);

  const applyTab = useCallback((nextTab: NavTab, replaceUrl = false) => {
    setTabState(nextTab);
    syncBrowserUrl(nextTab, replaceUrl);
  }, []);

  // Central route guard: unauthenticated users can ONLY visit public pages (landing, login, legal policies)
  const setTab = useCallback((targetTab: NavTab) => {
    const authed = Boolean(currentUserRef.current);
    if (!authed && !PUBLIC_TABS.includes(targetTab)) {
      setIntendedTab(targetTab);
      applyTab('login', false);
      if (!isAuthTransitionRef.current) {
        showToast('Please sign in to access your private health workspace.');
      }
      return;
    }
    if (authed && targetTab === 'landing') {
      applyTab('home', false);
      return;
    }
    applyTab(targetTab, false);
  }, [applyTab]);

  // Browser Back/Forward synchronization preserving strict auth gate
  useEffect(() => {
    const handlePopState = () => {
      const requested = getTabForPath(window.location.pathname);
      const authed = Boolean(currentUserRef.current);
      const resolved = resolveAuthorizedTab(requested, authed);
      if (!authed && !PUBLIC_TABS.includes(requested)) {
        setIntendedTab(requested);
        syncBrowserUrl('login', true);
      } else if (resolved !== requested) {
        syncBrowserUrl(resolved, true);
      }
      setTabState(resolved);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync Supabase Auth session & onAuthStateChange subscription
  useEffect(() => {
    let isMounted = true;

    const processAuthCallback = async (): Promise<boolean> => {
      try {
        const callbackResult = await handleIncomingAuthCallback();
        if (!isMounted) return false;

        if (callbackResult.status === 'error') {
          setAuthCallbackError({
            code: callbackResult.errorCode || 'auth_error',
            description: callbackResult.errorDescription || 'Authentication failed.'
          });
          setCurrentUser(null);
          applyTab('login', true);
          isAuthTransitionRef.current = false;
          setIsAuthLoading(false);
          return true;
        }

        if (callbackResult.status === 'success' && callbackResult.user) {
          clearStoredAuthCallbackError();
          setAuthCallbackError(null);
          setCurrentUser(callbackResult.user);
          currentUserRef.current = callbackResult.user;
          isAuthTransitionRef.current = false;
          showToast(`Welcome to HealYaar, ${callbackResult.user.name}!`);
          applyTab('home', true);
          setIsAuthLoading(false);
          return true;
        }
      } catch (cbErr) {
        console.warn('Auth callback handling notice:', cbErr);
      }
      return false;
    };

    window.addEventListener('hashchange', processAuthCallback);
    window.addEventListener('popstate', processAuthCallback);

    (async () => {
      isAuthTransitionRef.current = true;
      const handled = await processAuthCallback();
      if (handled) return;

      try {
        const user = await authService.getCurrentUser();
        if (!isMounted) return;
        const requestedFromPath = getTabForPath(window.location.pathname);

        if (user) {
          setCurrentUser(user);
          currentUserRef.current = user;
          const resolved = resolveAuthorizedTab(requestedFromPath, true);
          const nextTab = resolved === 'login' ? 'home' : resolved;
          applyTab(nextTab, true);
          // Preload cloud data in background
          const [cloudReminders, cloudCycles, cloudPrefs] = await Promise.all([
            reminderService.getReminders(user.id),
            periodService.getCycles(user.id),
            userPreferencesService.getPreferences(user.id)
          ]);
          if (isMounted) {
            setReminders(cloudReminders);
            setPeriodLogs(cloudCycles);
            if (cloudPrefs) {
              if (cloudPrefs.theme) setTheme(cloudPrefs.theme);
              if (cloudPrefs.textSize) setTextSize(cloudPrefs.textSize);
              if (cloudPrefs.language) setLanguage(cloudPrefs.language);
              if (cloudPrefs.highContrast !== undefined) setHighContrast(cloudPrefs.highContrast);
            }
          }
        } else {
          setCurrentUser(null);
          currentUserRef.current = null;
          setReminders([]);
          setPeriodLogs([]);
          const resolved = resolveAuthorizedTab(requestedFromPath, false);
          if (!PUBLIC_TABS.includes(requestedFromPath)) {
            setIntendedTab(requestedFromPath);
          }
          applyTab(resolved, true);
        }
      } catch (err) {
        console.warn('Initial session check notice:', err);
        if (isMounted) {
          setCurrentUser(null);
          currentUserRef.current = null;
          applyTab('landing', true);
        }
      } finally {
        if (isMounted) {
          isAuthTransitionRef.current = false;
          setIsAuthLoading(false);
        }
      }
    })();

    // Subscribe to auth state updates
    const subscription = authService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        isAuthTransitionRef.current = true;
        clearStoredAuthCallbackError();
        setAuthCallbackError(null);
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          currentUserRef.current = user;
          setTabState((prev) => {
            const next = prev === 'landing' || prev === 'login' ? 'home' : prev;
            syncBrowserUrl(next, true);
            return next;
          });

          // Fetch synchronized cloud data for this authenticated user
          try {
            const [cloudReminders, cloudCycles, cloudPrefs] = await Promise.all([
              reminderService.getReminders(user.id),
              periodService.getCycles(user.id),
              userPreferencesService.getPreferences(user.id)
            ]);

            if (isMounted) {
              setReminders(cloudReminders);
              setPeriodLogs(cloudCycles);
              if (cloudPrefs) {
                if (cloudPrefs.theme) setTheme(cloudPrefs.theme);
                if (cloudPrefs.textSize) setTextSize(cloudPrefs.textSize);
                if (cloudPrefs.language) setLanguage(cloudPrefs.language);
                if (cloudPrefs.highContrast !== undefined) setHighContrast(cloudPrefs.highContrast);
              }
            }
          } catch (syncErr) {
            console.warn('Auth state fetch notice:', syncErr);
          }
        }
        isAuthTransitionRef.current = false;
      } else if (event === 'SIGNED_OUT') {
        teardownAllMediaAndBlobs();
        setCurrentUser(null);
        currentUserRef.current = null;
        setReminders([]);
        setPeriodLogs([]);
        setIntendedTab(null);
        setSessionResetNonce((n) => n + 1);
        applyTab('login', true);
        if (!isManualLogoutRef.current) {
          showToast('Your session ended. Please sign in again.');
        }
        isManualLogoutRef.current = false;
      } else if (event === 'PASSWORD_RECOVERY') {
        // Direct user to reset password flow
        applyTab('login', true);
        sessionStorage.setItem('healyaar_auth_recovery_mode', 'true');
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('hashchange', processAuthCallback);
      window.removeEventListener('popstate', processAuthCallback);
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Sync user preferences whenever user alters theme, text scale, language, or contrast
  useEffect(() => {
    if (currentUser?.id) {
      userPreferencesService.savePreferences(currentUser.id, {
        theme,
        textSize,
        language,
        highContrast
      });
    }
  }, [theme, textSize, language, highContrast, currentUser?.id]);

  // DOM scale effect for text size
  useEffect(() => {
    const scale = textSize === 'xlarge' ? 1.35 : textSize === 'large' ? 1.18 : 1.0;
    document.documentElement.style.setProperty('--app-font-scale', scale.toString());
  }, [textSize]);

  // High contrast effect
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Dark Theme sync effect
  useEffect(() => {
    try {
      localStorage.setItem('healyaar_theme', theme);
    } catch {
      // ignore
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const openEmergencyModal = () => setIsEmergencyModalOpen(true);
  const closeEmergencyModal = () => setIsEmergencyModalOpen(false);

  // Strict fallback translation resolver (never renders blank strings)
  const currentTranslation: Translations = getSafeTranslations(language);

  const requestPermission = (
    type: 'mic' | 'location' | 'notifications' | 'report_ocr' | 'rx_ocr',
    title: string,
    description: string,
    onGranted: () => void,
    onDenied?: () => void
  ) => {
    setPermissionModal({
      isOpen: true,
      type,
      title,
      description,
      onGranted: () => {
        setPermissions(prev => ({ ...prev, [type]: true }));
        setPermissionModal(p => ({ ...p, isOpen: false }));
        onGranted();
      },
      onDenied: () => {
        setPermissions(prev => ({ ...prev, [type]: false }));
        setPermissionModal(p => ({ ...p, isOpen: false }));
        if (onDenied) onDenied();
      }
    });
  };

  const closePermissionModal = () => {
    setPermissionModal(p => ({ ...p, isOpen: false }));
  };

  // Voice Listening
  const startVoiceListening = (customCallback?: (transcript: string) => void) => {
    if (!VoiceService.isSpeechRecognitionSupported()) {
      showToast("Voice input isn't supported in this browser. Please use typing or try a supported browser.");
      return;
    }

    if (!VoiceService.isSecureEnvironment()) {
      showToast('Voice recognition requires a secure connection (HTTPS or localhost). Please type instead.');
      return;
    }

    const beginRecognition = () => {
      setIsListening(true);
      setLiveTranscript('');
      setVoiceStatus(currentTranslation.listening);

      VoiceService.startListening(
        language,
        (text, isFinal) => {
          setLiveTranscript(text);
          if (isFinal) {
            setVoiceStatus(`Heard: "${text}"`);
            if (customCallback) {
              customCallback(text);
            } else {
              handleVoiceCommand(text);
            }
          }
        },
        (err) => {
          setIsListening(false);
          setVoiceStatus(err);
          showToast(err);
        },
        () => {
          setIsListening(false);
        }
      );
    };

    if (!permissions.mic) {
      requestPermission(
        'mic',
        currentTranslation.micPermissionTitle,
        currentTranslation.micPermissionDesc,
        beginRecognition
      );
    } else {
      beginRecognition();
    }
  };

  const stopVoiceListening = () => {
    VoiceService.stopListening();
    setIsListening(false);
    setVoiceStatus('Listening stopped.');
  };

  const handleVoiceCommand = (transcript: string) => {
    const match: VoiceCommandMatch = VoiceService.parseVoiceCommand(transcript);

    if (match.action === 'sos') {
      openEmergencyModal();
      showToast('Opening Emergency SOS');
    } else if (match.action === 'navigate' && match.targetTab) {
      setTab(match.targetTab);
      showToast(`Navigated to ${match.matchedPhrase}`);
    } else if (match.action === 'textSize' && match.textSize) {
      setTextSize(match.textSize);
      showToast(`Text size changed to ${match.textSize}`);
    } else if (match.action === 'contrast') {
      toggleHighContrast();
      showToast('Toggled High Contrast');
    } else if (match.action === 'language' && match.language) {
      setLanguage(match.language);
      showToast(`Language switched to ${match.language.toUpperCase()}`);
    } else if (match.action === 'query') {
      setTab('assistant');
      sessionStorage.setItem('healyaar_pending_voice_query', transcript);
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!VoiceService.isSpeechSynthesisSupported()) {
      showToast('Voice readout not supported on this device.');
      return;
    }
    setIsAudioPlaying(true);
    VoiceService.speakText(
      text,
      language,
      () => setIsAudioPlaying(true),
      () => setIsAudioPlaying(false)
    );
  };

  const stopSpeaking = () => {
    VoiceService.stopSpeaking();
    setIsAudioPlaying(false);
  };

  // Reminder actions connected to Supabase and Local Fallback (optimistic update for instant UI sync)
  const addReminder = async (rem: Omit<ReminderItem, 'id' | 'createdDate'>) => {
    const tempId = `rem-opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optimisticReminder: ReminderItem = {
      id: tempId,
      createdDate: new Date().toISOString().slice(0, 10),
      ...rem
    };
    // Immediately reflect in UI so there is zero async lag
    setReminders(prev => [optimisticReminder, ...prev]);
    showToast('Reminder saved successfully!');

    const saved = await reminderService.addReminder(currentUser?.id || '', rem);
    setReminders(prev => [saved, ...prev.filter(r => r.id !== tempId && r.id !== saved.id)]);
  };

  const toggleReminder = async (id: string) => {
    const target = reminders.find(r => r.id === id);
    if (!target) return;
    const nextActive = !target.active;
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, active: nextActive } : r)));
    await reminderService.toggleReminder(currentUser?.id || '', id, target.active);
  };

  const deleteReminder = async (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    await reminderService.deleteReminder(currentUser?.id || '', id);
    showToast('Reminder deleted.');
  };

  // Period logs actions connected to Supabase and Local Fallback (optimistic instant updates)
  const savePeriodLog = async (entry: Omit<PeriodCycleEntry, 'id'>) => {
    const tempId = `log-opt-${Date.now()}`;
    const optimisticEntry: PeriodCycleEntry = {
      id: tempId,
      ...entry
    };
    setPeriodLogs(prev => [optimisticEntry, ...prev]);
    showToast(currentUser ? 'Cycle entry saved securely to your account.' : 'Cycle entry saved privately on this device.');

    const saved = await periodService.saveCycle(currentUser?.id || '', entry);
    if (saved) {
      setPeriodLogs(prev => [saved, ...prev.filter(p => p.id !== tempId && p.id !== saved.id)]);
      if (currentUser?.id) {
        indexPeriodLog(currentUser.id, {
          id: saved.id,
          date: saved.startDate,
          flow: saved.flowIntensity,
          symptoms: saved.symptoms,
          notes: saved.notes
        }).catch(e => console.warn('RAG period indexing failed:', e));
      }
    }
  };

  const updatePeriodLog = async (entry: PeriodCycleEntry) => {
    setPeriodLogs(prev => prev.map(p => (p.id === entry.id ? entry : p)));
    showToast('Cycle entry updated.');
    const updated = await periodService.updateCycle(currentUser?.id || '', entry);
    setPeriodLogs(prev => prev.map(p => (p.id === entry.id ? updated : p)));
    if (currentUser?.id) {
      indexPeriodLog(currentUser.id, {
        id: updated.id,
        date: updated.startDate,
        flow: updated.flowIntensity,
        symptoms: updated.symptoms,
        notes: updated.notes
      }).catch(e => console.warn('RAG period re-indexing failed:', e));
    }
  };

  const deletePeriodLog = async (id: string) => {
    setPeriodLogs(prev => prev.filter(p => p.id !== id));
    showToast('Cycle entry deleted.');
    await periodService.deleteCycle(currentUser?.id || '', id);
    if (currentUser?.id) {
      deleteChunksBySource(currentUser.id, id).catch(e => console.warn('RAG chunk delete warning:', e));
    }
  };

  const deletePeriodLogs = async () => {
    setPeriodLogs([]);
    await periodService.deleteCycles(currentUser?.id || '');
    showToast('All menstrual cycle logs deleted permanently.');
  };

  // Authentication Actions
  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    isAuthTransitionRef.current = true;
    try {
      const result = await authService.login(credentials);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        currentUserRef.current = result.user;
        showToast(`Welcome back to HealYaar, ${result.user.name}!`);

        try {
          const [cloudReminders, cloudCycles] = await Promise.all([
            reminderService.getReminders(result.user.id),
            periodService.getCycles(result.user.id)
          ]);
          setReminders(cloudReminders);
          setPeriodLogs(cloudCycles);
        } catch (err) {
          console.warn('Post-login sync notice:', err);
        }
      }
      return result;
    } finally {
      isAuthTransitionRef.current = false;
    }
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    isAuthTransitionRef.current = true;
    try {
      const result = await authService.signInWithGoogle();
      if (result.success && result.user) {
        clearStoredAuthCallbackError();
        setAuthCallbackError(null);
        setCurrentUser(result.user);
        currentUserRef.current = result.user;
        showToast(`Welcome to HealYaar, ${result.user.name}!`);

        try {
          const [cloudReminders, cloudCycles, cloudPrefs] = await Promise.all([
            reminderService.getReminders(result.user.id),
            periodService.getCycles(result.user.id),
            userPreferencesService.getPreferences(result.user.id)
          ]);
          setReminders(cloudReminders);
          setPeriodLogs(cloudCycles);
          if (cloudPrefs) {
            if (cloudPrefs.theme) setTheme(cloudPrefs.theme);
            if (cloudPrefs.textSize) setTextSize(cloudPrefs.textSize);
            if (cloudPrefs.language) setLanguage(cloudPrefs.language);
            if (cloudPrefs.highContrast !== undefined) setHighContrast(cloudPrefs.highContrast);
          }
        } catch (err) {
          console.warn('Post-Google-login sync notice:', err);
        }
      }
      return result;
    } finally {
      isAuthTransitionRef.current = false;
    }
  };

  const signup = async (credentials: SignUpCredentials): Promise<AuthResult> => {
    isAuthTransitionRef.current = true;
    try {
      const result = await authService.signup(credentials);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        currentUserRef.current = result.user;
        if (result.user.emailConfirmed) {
          showToast(`Account created! Welcome to HealYaar, ${result.user.name}.`);
        } else {
          showToast(`Account created! Please check your email to verify your account.`);
        }
      }
      return result;
    } finally {
      isAuthTransitionRef.current = false;
    }
  };

  const logout = async () => {
    isManualLogoutRef.current = true;
    try {
      VoiceService.stopSpeaking();
      VoiceService.stopListening();
    } catch {}
    teardownAllMediaAndBlobs();

    const uid = currentUser?.id;

    // Immediately clear all in-memory user state and redirect to Login
    setCurrentUser(null);
    currentUserRef.current = null;
    setReminders([]);
    setPeriodLogs([]);
    setIntendedTab(null);
    setIsListening(false);
    setLiveTranscript('');
    setIsAudioPlaying(false);
    setSessionResetNonce((n) => n + 1);
    applyTab('login', true);

    try {
      window.dispatchEvent(new CustomEvent('healyaar_session_reset'));
    } catch {}

    await authService.logout(uid);
    showToast('Signed out safely. Your session has been cleared.');
  };

  const deleteAccountAndAllData = async () => {
    if (!currentUser?.id) {
      return { success: false, message: 'No active account session found.' };
    }
    isManualLogoutRef.current = true;
    try {
      VoiceService.stopSpeaking();
      VoiceService.stopListening();
    } catch {}

    const result = await authService.deleteAccountAndAllData(currentUser.id);
    setCurrentUser(null);
    currentUserRef.current = null;
    setReminders([]);
    setPeriodLogs([]);
    setIntendedTab(null);
    setSessionResetNonce((n) => n + 1);
    applyTab('landing', true);
    showToast(result.message);
    return result;
  };

  const requestPasswordReset = async (email: string) => {
    return await authService.requestPasswordReset(email);
  };

  const updatePassword = async (password: string) => {
    return await authService.updatePassword(password);
  };

  return (
    <AppContext.Provider
      value={{
        tab,
        setTab,
        intendedTab,
        setIntendedTab,
        language,
        setLanguage,
        t: currentTranslation,
        textSize,
        setTextSize,
        highContrast,
        setHighContrast,
        toggleHighContrast,
        theme,
        setTheme,
        toggleTheme,
        authGateState,
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isAuthLoading,
        sessionResetNonce,
        authCallbackError,
        clearAuthCallbackError,
        login,
        loginWithGoogle,
        signup,
        logout,
        deleteAccountAndAllData,
        requestPasswordReset,
        updatePassword,
        isEmergencyModalOpen,
        openEmergencyModal,
        closeEmergencyModal,
        isListening,
        liveTranscript,
        voiceStatus,
        startVoiceListening,
        stopVoiceListening,
        isAudioPlaying,
        speakText,
        stopSpeaking,
        permissionModal,
        requestPermission,
        closePermissionModal,
        permissions,
        reminders,
        addReminder,
        toggleReminder,
        deleteReminder,
        periodLogs,
        savePeriodLog,
        updatePeriodLog,
        deletePeriodLog,
        deletePeriodLogs,
        toastMessage,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
