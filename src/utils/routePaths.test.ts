import test from 'node:test';
import assert from 'node:assert/strict';
import { getPathForTab, getTabForPath, isPublicTab, resolveAuthorizedTab } from './routePaths';

test('maps every public and protected NavTab to canonical URL paths and back', () => {
  assert.equal(getPathForTab('landing'), '/');
  assert.equal(getPathForTab('login'), '/login');
  assert.equal(getPathForTab('privacy'), '/privacy');
  assert.equal(getPathForTab('terms'), '/terms');
  assert.equal(getPathForTab('assistant'), '/assistant');
  assert.equal(getPathForTab('doctors'), '/doctors');
  assert.equal(getPathForTab('reports'), '/reports');

  assert.equal(getTabForPath('/'), 'landing');
  assert.equal(getTabForPath('/terms'), 'terms');
  assert.equal(getTabForPath('/TERMS/'), 'terms');
  assert.equal(getTabForPath('/doctors/'), 'doctors');
  assert.equal(getTabForPath('/PRIVACY'), 'privacy');
  assert.equal(getTabForPath('/unknown-path'), 'landing');
});

test('enforces strict auth gating on protected routes while allowing public legal routes', () => {
  assert.equal(isPublicTab('landing'), true);
  assert.equal(isPublicTab('privacy'), true);
  assert.equal(isPublicTab('terms'), true);
  assert.equal(isPublicTab('cookies'), true);
  assert.equal(isPublicTab('refund'), true);
  assert.equal(isPublicTab('doctors'), false);
  assert.equal(isPublicTab('reports'), false);

  assert.equal(resolveAuthorizedTab('doctors', false), 'login');
  assert.equal(resolveAuthorizedTab('reports', false), 'login');
  assert.equal(resolveAuthorizedTab('privacy', false), 'privacy');
  assert.equal(resolveAuthorizedTab('terms', false), 'terms');
  assert.equal(resolveAuthorizedTab('landing', false), 'landing');
  assert.equal(resolveAuthorizedTab('landing', true), 'home');
  assert.equal(resolveAuthorizedTab('doctors', true), 'doctors');
});
