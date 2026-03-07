import { describe, it, expect } from 'vitest';
import { formatLargeNumber, pct, isREIT, getAssetType } from './analyze.js';

describe('formatLargeNumber', () => {
  it('returns N/A for null', () => {
    expect(formatLargeNumber(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatLargeNumber(undefined)).toBe('N/A');
  });

  it('formats trillions', () => {
    expect(formatLargeNumber(2.5e12)).toBe('$2.50T');
  });

  it('formats billions', () => {
    expect(formatLargeNumber(1.23e9)).toBe('$1.23B');
  });

  it('formats millions', () => {
    expect(formatLargeNumber(5.67e6)).toBe('$5.67M');
  });

  it('formats small numbers with locale string', () => {
    const result = formatLargeNumber(12345);
    expect(result).toContain('$');
    expect(result).toContain('12');
  });

  it('handles negative trillions', () => {
    expect(formatLargeNumber(-1.5e12)).toBe('$-1.50T');
  });

  it('handles exact boundary at 1e12', () => {
    expect(formatLargeNumber(1e12)).toBe('$1.00T');
  });

  it('handles exact boundary at 1e9', () => {
    expect(formatLargeNumber(1e9)).toBe('$1.00B');
  });

  it('handles exact boundary at 1e6', () => {
    expect(formatLargeNumber(1e6)).toBe('$1.00M');
  });
});

describe('pct', () => {
  it('returns N/A for null', () => {
    expect(pct(null)).toBe('N/A');
  });

  it('formats decimal as percentage', () => {
    expect(pct(0.1523)).toBe('15.23%');
  });

  it('formats zero', () => {
    expect(pct(0)).toBe('0.00%');
  });

  it('formats 1 as 100%', () => {
    expect(pct(1)).toBe('100.00%');
  });

  it('formats negative values', () => {
    expect(pct(-0.05)).toBe('-5.00%');
  });
});

describe('isREIT', () => {
  it('returns true for Real Estate sector', () => {
    expect(isREIT({ summaryProfile: { sector: 'Real Estate', industry: 'REIT' } })).toBe(true);
  });

  it('returns true when industry includes REIT', () => {
    expect(isREIT({ summaryProfile: { sector: 'Other', industry: 'Residential REIT' } })).toBe(true);
  });

  it('returns false for non-REIT', () => {
    expect(isREIT({ summaryProfile: { sector: 'Technology', industry: 'Software' } })).toBe(false);
  });

  it('returns false when summaryProfile is missing', () => {
    expect(isREIT({})).toBe(false);
  });
});

describe('getAssetType', () => {
  it('returns etf for ETF quoteType', () => {
    expect(getAssetType({ price: { quoteType: 'ETF' } })).toBe('etf');
  });

  it('returns reit for Real Estate sector', () => {
    expect(getAssetType({
      price: { quoteType: 'EQUITY' },
      summaryProfile: { sector: 'Real Estate', industry: 'REIT' },
    })).toBe('reit');
  });

  it('returns stock for regular equity', () => {
    expect(getAssetType({
      price: { quoteType: 'EQUITY' },
      summaryProfile: { sector: 'Technology', industry: 'Software' },
    })).toBe('stock');
  });

  it('ETF takes priority over REIT', () => {
    expect(getAssetType({
      price: { quoteType: 'ETF' },
      summaryProfile: { sector: 'Real Estate', industry: 'REIT' },
    })).toBe('etf');
  });
});
