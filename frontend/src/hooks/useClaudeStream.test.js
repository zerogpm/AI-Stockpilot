import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCached, setCached } from './useClaudeStream';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('setCached / getCached round-trip', () => {
  it('stores analysis and retrieves it', () => {
    const analysis = { summary: 'Looks good', rating: 8 };
    setCached('AAPL', analysis);
    const entry = getCached('AAPL');
    expect(entry).not.toBeNull();
    expect(entry.analysis).toEqual(analysis);
  });

  it('returns the correct analysis object (deep equality)', () => {
    const analysis = { sections: [{ title: 'Growth', score: 9 }], notes: 'strong' };
    setCached('MSFT', analysis);
    expect(getCached('MSFT').analysis).toEqual(analysis);
  });

  it('returns entry with a timestamp when cache is fresh', () => {
    setCached('GOOG', { summary: 'ok' });
    const entry = getCached('GOOG');
    expect(entry).toBeTruthy();
    expect(entry.timestamp).toBeTypeOf('number');
  });
});

describe('TTL behavior', () => {
  it('returns null when cache is older than 1 hour', () => {
    setCached('AAPL', { summary: 'old' });
    // Overwrite with expired timestamp
    const key = 'analysis_AAPL';
    const stored = JSON.parse(localStorage.getItem(key));
    stored.timestamp = Date.now() - 61 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify(stored));

    expect(getCached('AAPL')).toBeNull();
  });

  it('removes expired entry from localStorage', () => {
    setCached('AAPL', { summary: 'old' });
    const key = 'analysis_AAPL';
    const stored = JSON.parse(localStorage.getItem(key));
    stored.timestamp = Date.now() - 2 * 60 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify(stored));

    getCached('AAPL');
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('returns data when cache is just under 1 hour old', () => {
    setCached('AAPL', { summary: 'fresh' });
    const key = 'analysis_AAPL';
    const stored = JSON.parse(localStorage.getItem(key));
    stored.timestamp = Date.now() - 59 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify(stored));

    const entry = getCached('AAPL');
    expect(entry).not.toBeNull();
    expect(entry.analysis.summary).toBe('fresh');
  });
});

describe('edge cases', () => {
  it('returns null when no cache exists for symbol', () => {
    expect(getCached('NOPE')).toBeNull();
  });

  it('returns null when localStorage has corrupt JSON', () => {
    localStorage.setItem('analysis_BAD', '{not valid json!!!');
    expect(getCached('BAD')).toBeNull();
  });

  it('different symbols have independent caches', () => {
    setCached('AAPL', { summary: 'apple' });
    setCached('MSFT', { summary: 'microsoft' });
    expect(getCached('AAPL').analysis.summary).toBe('apple');
    expect(getCached('MSFT').analysis.summary).toBe('microsoft');
  });

  it('setCached overwrites previous cache for same symbol', () => {
    setCached('AAPL', { summary: 'first' });
    setCached('AAPL', { summary: 'second' });
    expect(getCached('AAPL').analysis.summary).toBe('second');
  });
});

describe('cache key format', () => {
  it('uses analysis_ prefix + symbol as localStorage key', () => {
    setCached('TSLA', { summary: 'tesla' });
    expect(localStorage.getItem('analysis_TSLA')).not.toBeNull();
    expect(localStorage.getItem('TSLA')).toBeNull();
  });
});
