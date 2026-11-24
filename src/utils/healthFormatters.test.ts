import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDisplayDate,
  filterRAGStopWords,
  mergeTranslationWithFallback
} from './healthFormatters';

describe('Healthcare Formatters & Translation Fallbacks', () => {
  it('formats ISO timestamps into clean "DD Mon YYYY" strings without timezone drift', () => {
    assert.equal(formatDisplayDate('2026-11-25T00:00:00+00:00'), '25 Nov 2026');
    assert.equal(formatDisplayDate('2026-03-04'), '4 Mar 2026');
    assert.equal(formatDisplayDate('2026-10-15T18:30:00.000Z'), '15 Oct 2026');
    assert.equal(formatDisplayDate(''), 'Recent');
    assert.equal(formatDisplayDate(null), 'Recent');
  });

  it('filters common English stop-words from RAG matched keywords', () => {
    const filtered = filterRAGStopWords([
      'is', 'and', 'the', 'of', 'hemoglobin', 'to', 'a', 'in', 'for', 'iron', 'how', 'what', 'HbA1c', 'hemoglobin'
    ]);
    assert.deepEqual(filtered, ['hemoglobin', 'iron', 'hba1c']);
  });

  it('falls back to English whenever a regional translation key is missing or blank', () => {
    const base = {
      tapToSpeak: 'Tap to Speak',
      nav: {
        home: 'Home',
        fitness: 'Fitness & Supplements'
      }
    };
    const partial = {
      tapToSpeak: '   ',
      nav: {
        home: 'होम',
        fitness: ''
      }
    };

    const merged = mergeTranslationWithFallback(base, partial);
    assert.equal(merged.tapToSpeak, 'Tap to Speak');
    assert.equal(merged.nav.home, 'होम');
    assert.equal(merged.nav.fitness, 'Fitness & Supplements');
  });
});
