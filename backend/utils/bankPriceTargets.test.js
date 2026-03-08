import { describe, it, expect } from 'vitest';
import { computeBankPriceTargets } from './bankPriceTargets.js';

const baseInputs = {
  currentEPS: 10,
  forwardEPS: 11,
  bookValuePerShare: 80,
  currentPrice: 120,
  historicalAvgPE: 11,
  dividendRate: 4,
};

describe('computeBankPriceTargets', () => {
  it('computes fair value using triple model (PE + PB + DDM)', () => {
    const result = computeBankPriceTargets(baseInputs);
    // PE model: 11 * 10 = 110
    expect(result.fairValue.peModel).toBe(110);
    // PB model: 80 * 1.5 = 120
    expect(result.fairValue.pbModel).toBe(120);
    // DDM model: 4 / (0.09 - 0.05) = 100
    expect(result.fairValue.ddmModel).toBe(100);
    // Blended: (110 + 120 + 100) / 3 = 110
    expect(result.fairValue.blended).toBe(110);
  });

  it('computes all 9 scenario cells', () => {
    const result = computeBankPriceTargets(baseInputs);
    for (const horizon of ['3m', '6m', '12m']) {
      for (const scenario of ['bear', 'base', 'bull']) {
        expect(result.scenarios[horizon][scenario]).toBeDefined();
        expect(result.scenarios[horizon][scenario].targetPrice).toBeGreaterThan(0);
      }
    }
  });

  it('uses correct bear scenario multiples with DDM', () => {
    const result = computeBankPriceTargets(baseInputs);
    const bear = result.scenarios['12m'].bear;
    expect(bear.peMultiple).toBe(8);
    expect(bear.pbMultiple).toBe(1.1);
    // PE: 11 * 8 = 88, PB: 80 * 1.1 = 88, DDM: 100
    expect(bear.peFairPrice).toBe(88);
    expect(bear.pbFairPrice).toBe(88);
    expect(bear.ddmFairPrice).toBe(100);
    // target: (88 + 88 + 100) / 3 = 92
    expect(bear.targetPrice).toBe(92);
  });

  it('uses correct base scenario multiples with DDM', () => {
    const result = computeBankPriceTargets(baseInputs);
    const base = result.scenarios['12m'].base;
    expect(base.peMultiple).toBe(10);
    expect(base.pbMultiple).toBe(1.5);
    // PE: 11 * 10 = 110, PB: 80 * 1.5 = 120, DDM: 100
    expect(base.peFairPrice).toBe(110);
    expect(base.pbFairPrice).toBe(120);
    expect(base.ddmFairPrice).toBe(100);
    // target: (110 + 120 + 100) / 3 = 110
    expect(base.targetPrice).toBe(110);
  });

  it('uses correct bull scenario multiples with DDM', () => {
    const result = computeBankPriceTargets(baseInputs);
    const bull = result.scenarios['12m'].bull;
    expect(bull.peMultiple).toBe(12);
    expect(bull.pbMultiple).toBe(1.8);
    // PE: 11 * 12 = 132, PB: 80 * 1.8 = 144, DDM: 100
    expect(bull.peFairPrice).toBe(132);
    expect(bull.pbFairPrice).toBe(144);
    expect(bull.ddmFairPrice).toBe(100);
    // target: (132 + 144 + 100) / 3 = 125.33
    expect(bull.targetPrice).toBe(125.33);
  });

  it('falls back to 2-model blend when dividendRate is null', () => {
    const result = computeBankPriceTargets({ ...baseInputs, dividendRate: null });
    expect(result.fairValue.ddmModel).toBeNull();
    // Blended: (110 + 120) / 2 = 115
    expect(result.fairValue.blended).toBe(115);
    // Bear scenario: (88 + 88) / 2 = 88
    expect(result.scenarios['12m'].bear.targetPrice).toBe(88);
    expect(result.scenarios['12m'].bear.ddmFairPrice).toBeNull();
  });

  it('falls back to 2-model blend when dividendRate is 0', () => {
    const result = computeBankPriceTargets({ ...baseInputs, dividendRate: 0 });
    expect(result.fairValue.ddmModel).toBeNull();
    expect(result.fairValue.blended).toBe(115);
  });

  it('uses forwardEPS when available', () => {
    const result = computeBankPriceTargets(baseInputs);
    expect(result.scenarios['12m'].base.eps).toBe(11);
  });

  it('falls back to currentEPS when forwardEPS is null', () => {
    const result = computeBankPriceTargets({ ...baseInputs, forwardEPS: null });
    expect(result.scenarios['12m'].base.eps).toBe(10);
  });

  it('returns null for negative EPS', () => {
    expect(computeBankPriceTargets({ ...baseInputs, currentEPS: -1 })).toBeNull();
  });

  it('returns null for null currentEPS', () => {
    expect(computeBankPriceTargets({ ...baseInputs, currentEPS: null })).toBeNull();
  });

  it('returns null for null bookValuePerShare', () => {
    expect(computeBankPriceTargets({ ...baseInputs, bookValuePerShare: null })).toBeNull();
  });

  it('returns null for zero bookValuePerShare', () => {
    expect(computeBankPriceTargets({ ...baseInputs, bookValuePerShare: 0 })).toBeNull();
  });

  it('includes inputs in result', () => {
    const result = computeBankPriceTargets(baseInputs);
    expect(result.inputs).toEqual(baseInputs);
  });

  it('includes normal ranges', () => {
    const result = computeBankPriceTargets(baseInputs);
    expect(result.normalRanges.pe).toEqual({ low: 9, high: 11 });
    expect(result.normalRanges.pb).toEqual({ low: 1.2, high: 1.8 });
  });

  it('includes DDM params', () => {
    const result = computeBankPriceTargets(baseInputs);
    expect(result.ddmParams.requiredReturn).toBe(0.09);
    expect(result.ddmParams.dividendGrowth).toBe(0.05);
  });
});
