/**
 * Pure, framework-agnostic helpers for Google OAuth popup & callback handling.
 * Extracted for fast unit testing and strict origin/URL validation.
 */

export const OAUTH_CALLBACK_MESSAGE_TYPE = 'HEALYAAR_OAUTH_CALLBACK';
export const OAUTH_BROADCAST_CHANNEL = 'healyaar_oauth_channel';
export const OAUTH_POPUP_STORAGE_KEY = 'healyaar_oauth_popup_result';
export const OAUTH_POPUP_WINDOW_NAME = 'healyaar_google_oauth';

export interface OAuthCallbackPayload {
  type: typeof OAUTH_CALLBACK_MESSAGE_TYPE;
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

/**
 * Strictly validates that an incoming postMessage event originates from the exact same origin.
 */
export function isAllowedMessageOrigin(eventOrigin: string, currentOrigin: string): boolean {
  if (!eventOrigin || !currentOrigin) return false;
  return eventOrigin === currentOrigin;
}

/**
 * Validates that an OAuth authorization URL returned by Supabase uses HTTPS
 * (or HTTP only on localhost for local Supabase CLI instances).
 * Blocks javascript:, data:, vbscript:, and malformed URLs.
 */
export function isValidOAuthAuthorizeUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'https:') {
      return Boolean(parsed.hostname);
    }
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Safely parses and normalizes an untrusted postMessage / BroadcastChannel payload.
 * Returns null if the message does not match HealYaar's OAuth callback contract.
 */
export function parseOAuthCallbackPayload(data: unknown): OAuthCallbackPayload | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (record.type !== OAUTH_CALLBACK_MESSAGE_TYPE) return null;

  const toNullableString = (val: unknown): string | null =>
    typeof val === 'string' && val.trim().length > 0 ? val.trim() : null;

  return {
    type: OAUTH_CALLBACK_MESSAGE_TYPE,
    code: toNullableString(record.code),
    accessToken: toNullableString(record.accessToken),
    refreshToken: toNullableString(record.refreshToken),
    errorCode: toNullableString(record.errorCode),
    errorDescription: toNullableString(record.errorDescription)
  };
}

/**
 * Determines whether Google OAuth should open in a popup window instead of a top-level redirect.
 * Inside an iframe (such as AI Studio preview), Google blocks embedded frames via X-Frame-Options,
 * so a popup window is required.
 */
export function shouldUsePopupForOAuth(isInIframe: boolean): boolean {
  return Boolean(isInIframe);
}

/**
 * Computes centered popup window features for OAuth consent screens.
 */
export function buildPopupFeatures(
  viewportWidth: number,
  viewportHeight: number,
  screenX = 0,
  screenY = 0
): string {
  const width = 520;
  const height = 660;
  const left = Math.max(0, Math.round(screenX + (viewportWidth - width) / 2));
  const top = Math.max(0, Math.round(screenY + (viewportHeight - height) / 2));
  return `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`;
}

/**
 * Validates that an avatar URL (e.g. from Google profile metadata) is a safe HTTPS image URL.
 */
export function isSafeAvatarUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Maps Supabase / Google OAuth error messages into clear, user-friendly guidance.
 */
export function mapGoogleOAuthError(error: unknown): string {
  const rawMessage =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : '';

  const lower = rawMessage.toLowerCase();

  if (lower.includes('provider is not enabled') || lower.includes('unsupported provider')) {
    return 'Google Sign-In is not enabled yet in Supabase. Enable the Google provider under Authentication → Providers in your Supabase dashboard.';
  }
  if (lower.includes('access_denied') || lower.includes('cancelled') || lower.includes('canceled')) {
    return 'Google sign-in was cancelled. You can try again anytime or sign in with email.';
  }
  if (lower.includes('popup_blocked') || lower.includes('pop-up')) {
    return 'Your browser blocked the Google sign-in pop-up. Please allow pop-ups for this site and try again.';
  }
  if (lower.includes('redirect_uri') || lower.includes('redirect url')) {
    return 'Google OAuth redirect URL is not allowed yet. Please add this app’s callback URL to Supabase Auth → URL Configuration.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Could not reach the authentication server. Please check your internet connection and try again.';
  }
  if (rawMessage.trim()) {
    return rawMessage.trim();
  }
  return 'Google sign-in could not be completed. Please try again.';
}
