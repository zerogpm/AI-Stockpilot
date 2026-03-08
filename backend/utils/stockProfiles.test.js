import { describe, it, expect, beforeEach } from 'vitest';
import { getStockProfile, invalidateCache } from './stockProfiles.js';

beforeEach(() => {
  invalidateCache();
});

describe('getStockProfile', () => {
  it('returns defense profile for LMT by ticker match', () => {
    const profile = getStockProfile('LMT', '');
    expect(profile).not.toBeNull();
    expect(profile.matched.ticker).toBe(true);
    expect(profile.matched.industry).toBe('Aerospace & Defense');
    expect(profile.sectorPEOverride).toBe(22);
    expect(profile.fairPERange).toEqual([20, 25]);
  });

  it('returns defense profile for lowercase ticker', () => {
    const profile = getStockProfile('lmt', '');
    expect(profile).not.toBeNull();
    expect(profile.matched.industry).toBe('Aerospace & Defense');
  });

  it('merges ticker additionalContext into promptContext', () => {
    const profile = getStockProfile('LMT', '');
    expect(profile.promptContext.length).toBeGreaterThan(3);
    expect(profile.promptContext.some(c => c.includes('F-35'))).toBe(true);
    expect(profile.promptContext.some(c => c.includes('20-25x P/E'))).toBe(true);
  });

  it('returns industry profile by yahoo industry string', () => {
    const profile = getStockProfile('UNKNOWN_TICKER', 'Semiconductors');
    expect(profile).not.toBeNull();
    expect(profile.matched.ticker).toBe(false);
    expect(profile.matched.industry).toBe('Semiconductors');
    expect(profile.sectorPEOverride).toBe(25);
  });

  it('returns null for unrecognized ticker and industry', () => {
    const profile = getStockProfile('AAPL', 'Consumer Electronics');
    expect(profile).toBeNull();
  });

  it('returns null for completely unknown stock', () => {
    const profile = getStockProfile('XYZZY', '');
    expect(profile).toBeNull();
  });

  it('includes scenario overrides for defense stocks', () => {
    const profile = getStockProfile('LMT', '');
    expect(profile.scenarios).toBeDefined();
    expect(profile.scenarios.bear.peMin).toBe(16);
    expect(profile.scenarios.bull.peMax).toBe(30);
  });

  it('returns ticker-only profile without additionalContext', () => {
    const profile = getStockProfile('LHX', '');
    expect(profile).not.toBeNull();
    expect(profile.matched.ticker).toBe(true);
    expect(profile.matched.industry).toBe('Aerospace & Defense');
    expect(profile.promptContext.some(c => c.includes('20-25x P/E'))).toBe(true);
  });

  it('returns oil & gas profile for XOM', () => {
    const profile = getStockProfile('XOM', '');
    expect(profile.sectorPEOverride).toBe(12);
    expect(profile.promptContext.some(c => c.includes('EV/EBITDA'))).toBe(true);
    expect(profile.promptContext.some(c => c.includes('Pioneer'))).toBe(true);
  });

  it('returns pharma profile for PFE', () => {
    const profile = getStockProfile('PFE', '');
    expect(profile.sectorPEOverride).toBe(18);
    expect(profile.promptContext.some(c => c.includes('pipeline'))).toBe(true);
  });

  it('returns utility profile for NEE', () => {
    const profile = getStockProfile('NEE', '');
    expect(profile.sectorPEOverride).toBe(17);
    expect(profile.promptContext.some(c => c.includes('regulated'))).toBe(true);
  });

  it('returns telecom profile for T', () => {
    const profile = getStockProfile('T', '');
    expect(profile.sectorPEOverride).toBe(14);
    expect(profile.promptContext.some(c => c.includes('ARPU'))).toBe(true);
  });

  it('returns tobacco profile for MO', () => {
    const profile = getStockProfile('MO', '');
    expect(profile.sectorPEOverride).toBe(15);
    expect(profile.promptContext.some(c => c.includes('Declining cigarette volumes'))).toBe(true);
  });

  it('ticker industry takes precedence over yahoo industry', () => {
    const profile = getStockProfile('NVDA', 'Some Other Industry');
    expect(profile.matched.industry).toBe('Semiconductors');
    expect(profile.sectorPEOverride).toBe(25);
  });

  it('returns dataOverrides with forward EPS guidance for LMT', () => {
    const profile = getStockProfile('LMT', '');
    expect(profile.dataOverrides).not.toBeNull();
    expect(profile.dataOverrides.forwardEPS.range).toEqual([29.35, 30.25]);
    expect(profile.dataOverrides.forwardEPS.source).toContain('FY2026');
  });

  it('returns valuationNotes for LMT', () => {
    const profile = getStockProfile('LMT', '');
    expect(profile.valuationNotes).not.toBeNull();
    expect(profile.valuationNotes).toContain('temporarily depressed');
    expect(profile.valuationNotes).toContain('29.35');
  });

  it('returns null dataOverrides for tickers without overrides', () => {
    const profile = getStockProfile('NOC', '');
    expect(profile.dataOverrides).toBeNull();
    expect(profile.valuationNotes).toBeNull();
  });

  it('returns null dataOverrides for industry-only matches', () => {
    const profile = getStockProfile('UNKNOWN', 'Semiconductors');
    expect(profile.dataOverrides).toBeNull();
    expect(profile.valuationNotes).toBeNull();
  });
});
