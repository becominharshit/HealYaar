import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OAUTH_CALLBACK_MESSAGE_TYPE,
  isAllowedMessageOrigin,
  isValidOAuthAuthorizeUrl,
  parseOAuthCallbackPayload,
  shouldUsePopupForOAuth,
  buildPopupFeatures,
  isSafeAvatarUrl,
  mapGoogleOAuthError
} from './oauthPopupHelpers';

test('isAllowedMessageOrigin enforces exact same-origin match', () => {
  assert.equal(
    isAllowedMessageOrigin('https://app.run.app', 'https://app.run.app'),
    true
  );
  assert.equal(
    isAllowedMessageOrigin('https://evil.run.app', 'https://app.run.app'),
    false
  );
  assert.equal(
    isAllowedMessageOrigin('http://app.run.app', 'https://app.run.app'),
    false
  );
  assert.equal(isAllowedMessageOrigin('', 'https://app.run.app'), false);
});

test('isValidOAuthAuthorizeUrl permits HTTPS and localhost HTTP only', () => {
  assert.equal(
    isValidOAuthAuthorizeUrl('https://xyz.supabase.co/auth/v1/authorize?provider=google'),
    true
  );
  assert.equal(
    isValidOAuthAuthorizeUrl('http://localhost:54321/auth/v1/authorize?provider=google'),
    true
  );
  assert.equal(isValidOAuthAuthorizeUrl('javascript:alert(1)'), false);
  assert.equal(isValidOAuthAuthorizeUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isValidOAuthAuthorizeUrl('http://example.com/oauth'), false);
  assert.equal(isValidOAuthAuthorizeUrl(''), false);
  assert.equal(isValidOAuthAuthorizeUrl(null), false);
});

test('parseOAuthCallbackPayload parses valid PKCE and implicit payloads and ignores foreign messages', () => {
  const pkce = parseOAuthCallbackPayload({
    type: OAUTH_CALLBACK_MESSAGE_TYPE,
    code: '  abc-123  ',
    accessToken: null,
    refreshToken: null,
    errorCode: null,
    errorDescription: null
  });
  assert.deepEqual(pkce, {
    type: OAUTH_CALLBACK_MESSAGE_TYPE,
    code: 'abc-123',
    accessToken: null,
    refreshToken: null,
    errorCode: null,
    errorDescription: null
  });

  const errPayload = parseOAuthCallbackPayload({
    type: OAUTH_CALLBACK_MESSAGE_TYPE,
    errorCode: 'access_denied',
    errorDescription: 'User denied access'
  });
  assert.equal(errPayload?.errorCode, 'access_denied');
  assert.equal(errPayload?.errorDescription, 'User denied access');
  assert.equal(errPayload?.code, null);

  assert.equal(parseOAuthCallbackPayload({ type: 'OTHER_EVENT', code: '123' }), null);
  assert.equal(parseOAuthCallbackPayload(null), null);
  assert.equal(parseOAuthCallbackPayload('string'), null);
});

test('shouldUsePopupForOAuth returns true inside iframe and false at top level', () => {
  assert.equal(shouldUsePopupForOAuth(true), true);
  assert.equal(shouldUsePopupForOAuth(false), false);
});

test('buildPopupFeatures computes centered non-negative coordinates', () => {
  const features = buildPopupFeatures(1440, 900, 100, 50);
  assert.match(features, /width=520/);
  assert.match(features, /height=660/);
  assert.match(features, /left=560/);
  assert.match(features, /top=170/);

  const smallViewport = buildPopupFeatures(390, 600, 0, 0);
  assert.match(smallViewport, /left=0/);
  assert.match(smallViewport, /top=0/);
});

test('isSafeAvatarUrl allows only HTTPS URLs', () => {
  assert.equal(isSafeAvatarUrl('https://lh3.googleusercontent.com/a/photo.jpg'), true);
  assert.equal(isSafeAvatarUrl('javascript:alert(1)'), false);
  assert.equal(isSafeAvatarUrl('http://insecure.example.com/a.png'), false);
  assert.equal(isSafeAvatarUrl(null), false);
});

test('mapGoogleOAuthError maps common Supabase Google OAuth errors clearly', () => {
  assert.match(
    mapGoogleOAuthError({ message: 'Unsupported provider: provider is not enabled' }),
    /not enabled yet in Supabase/i
  );
  assert.match(
    mapGoogleOAuthError({ message: 'access_denied' }),
    /cancelled/i
  );
  assert.match(
    mapGoogleOAuthError({ message: 'popup_blocked' }),
    /blocked the Google sign-in pop-up/i
  );
  assert.match(
    mapGoogleOAuthError({ message: 'Invalid redirect_uri' }),
    /redirect URL/i
  );
  assert.match(
    mapGoogleOAuthError({ message: 'Failed to fetch' }),
    /internet connection/i
  );
});
