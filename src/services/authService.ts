import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  getAuthRedirectUrl,
  getOAuthCallbackUrl,
  completeOAuthCallbackPayload
} from './authCallbackService';
import {
  OAUTH_BROADCAST_CHANNEL,
  OAUTH_POPUP_STORAGE_KEY,
  OAUTH_POPUP_WINDOW_NAME,
  buildPopupFeatures,
  isAllowedMessageOrigin,
  isValidOAuthAuthorizeUrl,
  mapGoogleOAuthError,
  parseOAuthCallbackPayload,
  shouldUsePopupForOAuth,
  OAuthCallbackPayload
} from './oauthPopupHelpers';
import { User, Session } from '@supabase/supabase-js';
import { teardownAllMediaAndBlobs } from '../utils/mediaSessionCleanup';
import { clearUserVault } from './rag/ragVaultService';

/**
 * HealYaar Production Authentication Service (Supabase Auth)
 *
 * Implements Supabase Auth with session persistence, profile sync,
 * password recovery, password reset, and graceful local fallback when unconfigured.
 */

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailOrPhone: string;
  rememberMe: boolean;
  loginDate: string;
  avatarUrl?: string | null;
  emailConfirmed: boolean;
}

export interface LoginCredentials {
  email: string;
  emailOrPhone?: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  emailOrPhone?: string;
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  field?: 'email' | 'emailOrPhone' | 'password' | 'name' | 'confirmPassword' | 'general';
  message?: string;
}

const STORAGE_KEY_AUTH = 'healyaar_auth_user';
const STORAGE_KEY_REMEMBERED_ID = 'healyaar_remembered_identifier';

/**
 * Validates whether string is a valid email format
 */
export function isValidEmail(input: string): boolean {
  const trimmed = input.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Validates identifier as email strictly
 */
export function validateIdentifier(input: string): { isValid: boolean; type: 'email' | 'invalid' } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, type: 'invalid' };
  }
  if (isValidEmail(trimmed)) {
    return { isValid: true, type: 'email' };
  }
  return { isValid: false, type: 'invalid' };
}

/**
 * Maps Supabase error codes & messages to patient-friendly explanations
 */
export function mapSupabaseAuthError(error: any): { message: string; field: 'email' | 'emailOrPhone' | 'password' | 'name' | 'general' } {
  if (!error) return { message: 'An unexpected authentication error occurred.', field: 'general' };

  const msg = (error.message || '').toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return {
      message: 'Incorrect email or password. Please double check and try again, or use "Forgot password".',
      field: 'password'
    };
  }
  if (msg.includes('user already registered') || msg.includes('already exists') || msg.includes('email_exists')) {
    return {
      message: 'An account with this email already exists. Please sign in or use password recovery.',
      field: 'email'
    };
  }
  if (msg.includes('password') && (msg.includes('least') || msg.includes('too short') || msg.includes('weak'))) {
    return {
      message: 'Password must be at least 8 characters long.',
      field: 'password'
    };
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return {
      message: 'Too many attempts. For your security, please wait a minute before trying again.',
      field: 'general'
    };
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return {
      message: 'Network connection issue. Please check your internet connection.',
      field: 'general'
    };
  }
  if (msg.includes('email not confirmed')) {
    return {
      message: 'Please check your email inbox to confirm your account before logging in.',
      field: 'email'
    };
  }

  return {
    message: error.message || 'Authentication error. Please try again.',
    field: 'general'
  };
}

/**
 * Converts a Supabase User object into an application-friendly AuthUser
 */
export function mapSupabaseUserToAuthUser(sbUser: User, rememberMe = true): AuthUser {
  const name =
    sbUser.user_metadata?.full_name ||
    sbUser.user_metadata?.name ||
    (sbUser.email ? sbUser.email.split('@')[0] : 'HealYaar Member');

  const isOAuthProvider =
    sbUser.app_metadata?.provider === 'google' ||
    (Array.isArray(sbUser.app_metadata?.providers) &&
      sbUser.app_metadata.providers.includes('google'));

  const isConfirmed = Boolean(
    sbUser.email_confirmed_at ||
    (sbUser as any).confirmed_at ||
    sbUser.user_metadata?.email_verified ||
    isOAuthProvider
  );

  const email = sbUser.email || '';

  return {
    id: sbUser.id,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email,
    emailOrPhone: email,
    rememberMe,
    loginDate: new Date().toISOString(),
    avatarUrl: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null,
    emailConfirmed: isConfirmed
  };
}

export const authService = {
  /**
   * Retrieves saved identifier if "Remember me" was previously checked
   */
  getRememberedIdentifier(): string {
    try {
      return localStorage.getItem(STORAGE_KEY_REMEMBERED_ID) || '';
    } catch {
      return '';
    }
  },

  /**
   * Fetches current Supabase session
   */
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return null;
      return data.session;
    } catch (err) {
      console.warn('Error fetching Supabase session:', err);
      return null;
    }
  },

  /**
   * Supabase Auth is the only source of truth for identity.
   * Client-side localStorage flags are NEVER trusted as proof of authentication.
   */
  getStoredUser(): AuthUser | null {
    return null;
  },

  /**
   * Retrieves currently authenticated user (async, validates session via Supabase Auth)
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return null;
      }

      const authUser = mapSupabaseUserToAuthUser(user);

      // Attempt to enrich with profile record
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.full_name) {
          authUser.name = profile.full_name;
        }
        if (profile?.avatar_url) {
          authUser.avatarUrl = profile.avatar_url;
        }
      } catch (profileErr) {
        console.warn('Profile fetch notice:', profileErr);
      }

      return authUser;
    } catch (e) {
      console.warn('Supabase auth.getUser() error:', e);
      return null;
    }
  },

  /**
   * Sign In with email + password strictly via Supabase Auth
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const rawEmail = credentials.email || credentials.emailOrPhone || '';
    const email = rawEmail.trim();
    const { password, rememberMe = true } = credentials;

    if (!email) {
      return { success: false, error: 'Please enter your email.', field: 'email' };
    }
    if (!isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address.', field: 'email' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.', field: 'password' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.', field: 'password' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Authentication service is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.',
        field: 'general'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        const mapped = mapSupabaseAuthError(error);
        return { success: false, error: mapped.message, field: mapped.field };
      }

      if (!data.user) {
        return { success: false, error: 'Invalid login credentials.', field: 'general' };
      }

      const authUser = mapSupabaseUserToAuthUser(data.user, rememberMe);

      // Fetch or ensure profile row exists linked to data.user.id
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile?.full_name) {
          authUser.name = profile.full_name;
        } else {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: authUser.name,
            email,
            avatar_url: null
          });
        }
      } catch (profileErr) {
        console.warn('Profile sync notice:', profileErr);
      }

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_REMEMBERED_ID, email);
      } else {
        localStorage.removeItem(STORAGE_KEY_REMEMBERED_ID);
      }

      return { success: true, user: authUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please try again.', field: 'general' };
    }
  },

  /**
   * Ensures a public.profiles record exists for an authenticated user (e.g. first Google OAuth login)
   */
  async ensureUserProfile(sbUser: User): Promise<void> {
    if (!isSupabaseConfigured() || !sbUser?.id) return;
    try {
      const mapped = mapSupabaseUserToAuthUser(sbUser);
      await supabase.from('profiles').upsert(
        {
          id: sbUser.id,
          full_name: mapped.name,
          email: mapped.email,
          avatar_url: mapped.avatarUrl || null
        },
        { onConflict: 'id' }
      );
    } catch (profileErr) {
      console.warn('OAuth profile sync notice:', profileErr);
    }
  },

  /**
   * Sign In / Sign Up with Google via Supabase Auth OAuth.
   * Uses a direct-to-provider popup flow when embedded in an iframe (e.g., AI Studio preview)
   * and standard redirect flow when opened at top-level.
   */
  async signInWithGoogle(): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          'Google Sign-In requires Supabase to be configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment, then enable Google in Supabase Auth.',
        field: 'general'
      };
    }

    try {
      const redirectTo = getOAuthCallbackUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: mapGoogleOAuthError(error),
          field: 'general'
        };
      }

      if (!data?.url || !isValidOAuthAuthorizeUrl(data.url)) {
        return {
          success: false,
          error: 'Could not start Google Sign-In. Please verify Google OAuth is enabled in Supabase.',
          field: 'general'
        };
      }

      let isInIframe = false;
      try {
        isInIframe = window.self !== window.top;
      } catch {
        // Cross-origin frame access throws SecurityError -> definitely inside an iframe
        isInIframe = true;
      }

      if (!shouldUsePopupForOAuth(isInIframe)) {
        window.location.assign(data.url);
        return {
          success: true,
          message: 'Redirecting to Google...'
        };
      }

      // Iframe-safe popup flow: open OAuth provider URL directly in a centered popup window
      const features = buildPopupFeatures(
        window.outerWidth || window.innerWidth || 1280,
        window.outerHeight || window.innerHeight || 800,
        window.screenX || 0,
        window.screenY || 0
      );

      // Clear any stale popup payload before launching
      try {
        localStorage.removeItem(OAUTH_POPUP_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }

      const popup = window.open(data.url, OAUTH_POPUP_WINDOW_NAME, features);
      if (!popup) {
        return {
          success: false,
          error: mapGoogleOAuthError('popup_blocked'),
          field: 'general'
        };
      }

      return await new Promise<AuthResult>((resolve) => {
        let settled = false;
        let broadcastChannel: BroadcastChannel | null = null;
        let closePollTimer: number | null = null;
        let timeoutTimer: number | null = null;

        const cleanup = () => {
          window.removeEventListener('message', handleMessage);
          window.removeEventListener('storage', handleStorage);
          if (broadcastChannel) {
            try {
              broadcastChannel.close();
            } catch {}
            broadcastChannel = null;
          }
          if (closePollTimer !== null) {
            window.clearInterval(closePollTimer);
            closePollTimer = null;
          }
          if (timeoutTimer !== null) {
            window.clearTimeout(timeoutTimer);
            timeoutTimer = null;
          }
          try {
            localStorage.removeItem(OAUTH_POPUP_STORAGE_KEY);
          } catch {}
        };

        const finish = (result: AuthResult) => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(result);
        };

        const handlePayload = async (payload: OAuthCallbackPayload) => {
          if (settled) return;
          settled = true;
          cleanup();
          try {
            if (!popup.closed) popup.close();
          } catch {}

          const callbackResult = await completeOAuthCallbackPayload(payload);
          if (callbackResult.status === 'success' && callbackResult.user) {
            resolve({ success: true, user: callbackResult.user });
          } else {
            resolve({
              success: false,
              error: mapGoogleOAuthError(callbackResult.errorDescription || callbackResult.errorCode),
              field: 'general'
            });
          }
        };

        const handleMessage = (event: MessageEvent) => {
          if (!isAllowedMessageOrigin(event.origin, window.location.origin)) return;
          const payload = parseOAuthCallbackPayload(event.data);
          if (payload) {
            void handlePayload(payload);
          }
        };

        const handleStorage = (event: StorageEvent) => {
          if (event.key !== OAUTH_POPUP_STORAGE_KEY || !event.newValue) return;
          try {
            const parsed = JSON.parse(event.newValue);
            const payload = parseOAuthCallbackPayload(parsed);
            if (payload) {
              void handlePayload(payload);
            }
          } catch {
            // ignore malformed JSON
          }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('storage', handleStorage);

        try {
          if (typeof BroadcastChannel !== 'undefined') {
            broadcastChannel = new BroadcastChannel(OAUTH_BROADCAST_CHANNEL);
            broadcastChannel.onmessage = (event: MessageEvent) => {
              const payload = parseOAuthCallbackPayload(event.data);
              if (payload) {
                void handlePayload(payload);
              }
            };
          }
        } catch {
          // BroadcastChannel optional
        }

        closePollTimer = window.setInterval(() => {
          if (popup.closed) {
            // Give postMessage/BroadcastChannel a brief moment to arrive before treating as cancelled
            window.setTimeout(() => {
              finish({
                success: false,
                error: mapGoogleOAuthError('cancelled'),
                field: 'general'
              });
            }, 600);
          }
        }, 500);

        timeoutTimer = window.setTimeout(() => {
          finish({
            success: false,
            error: 'Google sign-in timed out. Please try again.',
            field: 'general'
          });
        }, 180000);
      });
    } catch (err: any) {
      return {
        success: false,
        error: mapGoogleOAuthError(err),
        field: 'general'
      };
    }
  },

  /**
   * Sign Up / Register new account with Supabase Auth
   */
  async signup(credentials: SignUpCredentials): Promise<AuthResult> {
    const rawEmail = credentials.email || credentials.emailOrPhone || '';
    const email = rawEmail.trim();
    const { name, password, confirmPassword, rememberMe = true } = credentials;
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { success: false, error: 'Please enter your full name.', field: 'name' };
    }
    if (!email) {
      return { success: false, error: 'Please enter your email.', field: 'email' };
    }
    if (!isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address.', field: 'email' };
    }
    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.', field: 'password' };
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.', field: 'confirmPassword' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Authentication service is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.',
        field: 'general'
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          data: {
            full_name: trimmedName,
            name: trimmedName
          }
        }
      });

      if (error) {
        const mapped = mapSupabaseAuthError(error);
        return { success: false, error: mapped.message, field: mapped.field };
      }

      // Check if duplicate user: Supabase returns identities: [] when user already exists
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in or use password recovery.',
          field: 'email'
        };
      }

      if (!data.user) {
        return { success: false, error: 'Registration could not be completed. Please try again.', field: 'general' };
      }

      const authUser = mapSupabaseUserToAuthUser(data.user, rememberMe);
      authUser.name = trimmedName;

      // Ensure profile row exists linked strictly to user.id
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: trimmedName,
          email,
          avatar_url: null
        });
      } catch (profileErr) {
        console.warn('Profile creation notice:', profileErr);
      }

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_REMEMBERED_ID, email);
      }

      return {
        success: true,
        user: authUser,
        message: data.user.email_confirmed_at
          ? 'Account created successfully!'
          : 'Account created! Please check your email to confirm your account before logging in.'
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed. Please try again.', field: 'general' };
    }
  },

  /**
   * Request password reset link / recovery email
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Authentication service is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: getAuthRedirectUrl()
      });

      if (error) {
        const mapped = mapSupabaseAuthError(error);
        return { success: false, message: mapped.message };
      }

      return {
        success: true,
        message: `If an account with ${trimmed} exists, a secure password reset link has been sent to your inbox.`
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Unable to send password reset link.' };
    }
  },

  /**
   * Update password (e.g. after clicking reset link)
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters long.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Authentication service is not configured.'
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        const mapped = mapSupabaseAuthError(error);
        return { success: false, message: mapped.message };
      }
      return { success: true, message: 'Password updated successfully! You can now sign in with your new password.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update password.' };
    }
  },

  /**
   * Resends verification email to an unconfirmed user
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Authentication service is not configured.'
      };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmed,
        options: {
          emailRedirectTo: getAuthRedirectUrl()
        }
      });

      if (error) {
        const mapped = mapSupabaseAuthError(error);
        return { success: false, message: mapped.message };
      }

      return {
        success: true,
        message: `Verification link sent to ${trimmed}. Please check your inbox and spam folder.`
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Unable to resend verification email.' };
    }
  },

  /**
   * Persists explicit user policy consent in consent_records + user-scoped localStorage
   */
  async recordConsent(userId: string, consentTypeOrVersion = '2.0', policyVersion?: string): Promise<void> {
    if (!userId) return;
    const acceptedAt = new Date().toISOString();
    const consentType = policyVersion ? consentTypeOrVersion : 'terms_and_privacy';
    const resolvedVersion = policyVersion ?? consentTypeOrVersion;
    try {
      localStorage.setItem(
        `healyaar_user_${userId}_consent_${consentType}`,
        JSON.stringify({ consentType, policyVersion: resolvedVersion, acceptedAt })
      );
      localStorage.setItem(
        `healyaar_user_${userId}_consent`,
        JSON.stringify({ consentType, policyVersion: resolvedVersion, acceptedAt })
      );
    } catch {
      // ignore
    }

    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from('consent_records').insert({
        user_id: userId,
        consent_type: consentType,
        policy_version: resolvedVersion,
        accepted_at: acceptedAt
      });
    } catch {
      // Non-blocking if migration not yet applied
    }
  },

  /**
   * Clears all locally cached data scoped to a user or all legacy keys
   */
  clearUserLocalData(userId?: string): void {
    try {
      if (userId) {
        const prefix = `healyaar_user_${userId}_`;
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem('healyaar_reminders');
      localStorage.removeItem('healyaar_period_logs');
      localStorage.removeItem('healyaar_report_history');
      localStorage.removeItem('healyaar_prescriptions');
      localStorage.removeItem('healyaar_user_preferences');
      localStorage.removeItem('healyaar_cycle_preferences');
      localStorage.removeItem('healyaar_guest_mode');
      sessionStorage.removeItem(STORAGE_KEY_AUTH);
      sessionStorage.removeItem('healyaar_active_prescription');
      sessionStorage.removeItem('healyaar_pending_voice_query');
      sessionStorage.removeItem('healyaar_guest_mode');
      sessionStorage.removeItem('healyaar_user_location');
      sessionStorage.removeItem('healyaar_initial_auth_mode');
    } catch {
      // ignore
    }
  },

  /**
   * Sign Out with complete media track teardown, blob revocation, and session cleanup
   */
  async logout(userId?: string): Promise<void> {
    teardownAllMediaAndBlobs();

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }

    this.clearUserLocalData(userId);
  },

  /**
   * Permanently deletes all user health data across IndexedDB RAG Vault, localStorage, and Supabase tables,
   * then signs the user out completely.
   */
  async deleteAccountAndAllData(userId: string): Promise<{ success: boolean; message: string }> {
    if (!userId) {
      return { success: false, message: 'No active user session found.' };
    }

    teardownAllMediaAndBlobs();

    // 1. Purge user-scoped IndexedDB RAG Vault
    try {
      await clearUserVault(userId);
    } catch (err) {
      console.warn('IndexedDB vault purge warning:', err);
    }

    // 2. Delete all user rows from Supabase tables (RLS enforces auth.uid() = user_id)
    if (isSupabaseConfigured()) {
      const userTables = [
        'medical_reports',
        'prescriptions',
        'medication_reminders',
        'period_cycles',
        'meal_logs',
        'food_analyses',
        'activity_logs',
        'consent_records',
        'favorite_places',
        'user_preferences'
      ];

      await Promise.allSettled(
        userTables.map((table) => supabase.from(table).delete().eq('user_id', userId))
      );

      try {
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (err) {
        console.warn('Profile delete notice:', err);
      }

      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out after data deletion warning:', err);
      }
    }

    // 3. Purge all user-scoped localStorage and sessionStorage keys
    this.clearUserLocalData(userId);

    return {
      success: true,
      message: 'All your health records, local RAG vault, and profile data have been permanently deleted.'
    };
  },

  /**
   * DPDP Act 2023 Right to Data Portability: exports all authenticated user records as structured JSON.
   */
  async exportAllUserData(user: AuthUser): Promise<Record<string, unknown>> {
    const userId = user.id;
    const localSnapshot: Record<string, unknown> = {};

    try {
      const prefix = `healyaar_user_${userId}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const raw = localStorage.getItem(key);
          try {
            localSnapshot[key.replace(prefix, '')] = raw ? JSON.parse(raw) : null;
          } catch {
            localSnapshot[key.replace(prefix, '')] = raw;
          }
        }
      }
    } catch {
      // ignore storage read errors
    }

    const cloudSnapshot: Record<string, unknown> = {};
    if (isSupabaseConfigured()) {
      const tables = [
        'medical_reports',
        'prescriptions',
        'medication_reminders',
        'period_cycles',
        'meal_logs',
        'food_analyses',
        'activity_logs',
        'favorite_places',
        'consent_records',
        'user_preferences'
      ];

      await Promise.allSettled(
        tables.map(async (table) => {
          const { data } = await supabase.from(table).select('*').eq('user_id', userId);
          if (data) cloudSnapshot[table] = data;
        })
      );
    }

    return {
      exportedAt: new Date().toISOString(),
      platform: 'HealYaar (हीलयार)',
      complianceStandard: 'India DPDP Act 2023 — Right to Data Portability',
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailConfirmed: user.emailConfirmed
      },
      cloudRecords: cloudSnapshot,
      localDeviceVault: localSnapshot
    };
  },

  /**
   * Subscribes to Supabase Auth State changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} };
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  }
};
