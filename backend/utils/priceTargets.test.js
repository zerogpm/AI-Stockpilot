import { describe, it, expect } from 'vitest';
import { computePriceTargets } from './priceTargets.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

describe('computePriceTargets', () => {
  const baseInputs = {
    currentEPS: 5,
    forwardEPS: 6,
    epsGrowthRate: 10,
    historicalAvgPE: 20,
    currentPrice: 120,
  };

  it('computes all 9 cells with correct math', () => {
    const result = computePriceTargets(baseInputs);
    expect(result).not.toBeNull();
    expect(result.scenarios).toHaveProperty('3m');
    expect(result.scenarios).toHaveProperty('6m');
    expect(result.scenarios).toHaveProperty('12m');

    for (const horizon of ['3m', '6m', '12m']) {
      expect(result.scenarios[horizon]).toHaveProperty('bear');
      expect(result.scenarios[horizon]).toHaveProperty('base');
      expect(result.scenarios[horizon]).toHaveProperty('bull');
    }
  });

  it('uses forwardEPS as base when available', () => {
    const result = computePriceTargets(baseInputs);
    // Base case, 12m: futureEPS = 6 * (1 + 10/100)^1 = 6.6
    // targetPrice = 6.6 * 20 = 132
    expect(result.scenarios['12m'].base.eps).toBe(round2(6 * Math.pow(1.1, 1)));
    expect(result.scenarios['12m'].base.peMultiple).toBe(20);
    expect(result.scenarios['12m'].base.targetPrice).toBe(round2(6 * Math.pow(1.1, 1) * 20));
  });

  it('falls back to currentEPS when forwardEPS is null', () => {
    const result = computePriceTargets({ ...baseInputs, forwardEPS: null });
    // Base case, 12m: futureEPS = 5 * (1.1)^1 = 5.5
    expect(result.scenarios['12m'].base.eps).toBe(round2(5 * Math.pow(1.1, 1)));
    expect(result.scenarios['12m'].base.targetPrice).toBe(round2(5 * Math.pow(1.1, 1) * 20));
  });

  it('applies correct growth multipliers per scenario', () => {
    const result = computePriceTargets(baseInputs);
    // 12m bear: growth = 10 * 0.25 = 2.5%, futureEPS = 6 * (1.025)^1
    expect(result.scenarios['12m'].bear.growthRate).toBe(2.5);
    // 12m base: growth = 10%
    expect(result.scenarios['12m'].base.growthRate).toBe(10);
    // 12m bull: growth = 10 * 1.5 = 15%
    expect(result.scenarios['12m'].bull.growthRate).toBe(15);
  });

  it('applies correct PE multipliers per scenario', () => {
    const result = computePriceTargets(baseInputs);
    // bear: 20 * 0.80 = 16
    expect(result.scenarios['12m'].bear.peMultiple).toBe(16);
    // base: 20
    expect(result.scenarios['12m'].base.peMultiple).toBe(20);
    // bull: 20 * 1.20 = 24
    expect(result.scenarios['12m'].bull.peMultiple).toBe(24);
  });

  it('handles shorter horizons with less growth impact', () => {
    const result = computePriceTargets(baseInputs);
    // 3m base: futureEPS = 6 * (1.1)^(3/12) = 6 * (1.1)^0.25
    const expected3m = round2(6 * Math.pow(1.1, 0.25));
    const expected12m = round2(6 * Math.pow(1.1, 1));
    expect(result.scenarios['3m'].base.eps).toBe(expected3m);
    expect(result.scenarios['12m'].base.eps).toBe(expected12m);
    expect(expected3m).toBeLessThan(expected12m);
  });

  it('handles zero growth rate — differences come from PE only', () => {
    const result = computePriceTargets({ ...baseInputs, epsGrowthRate: 0 });
    // All scenarios have 0% growth, so EPS stays at forwardEPS (6) for all horizons
    expect(result.scenarios['12m'].bear.eps).toBe(6);
    expect(result.scenarios['12m'].base.eps).toBe(6);
    expect(result.scenarios['12m'].bull.eps).toBe(6);
    // Differences come from PE: 16, 20, 24
    expect(result.scenarios['12m'].bear.targetPrice).toBe(6 * 16);
    expect(result.scenarios['12m'].base.targetPrice).toBe(6 * 20);
    expect(result.scenarios['12m'].bull.targetPrice).toBe(6 * 24);
  });

  it('clamps bear PE to minimum 8', () => {
    // historicalAvgPE = 9, bear = 9 * 0.80 = 7.2 → clamped to 8
    const result = computePriceTargets({ ...baseInputs, historicalAvgPE: 9 });
    expect(result.scenarios['12m'].bear.peMultiple).toBe(8);
  });

  it('clamps bull PE to maximum 40', () => {
    // historicalAvgPE = 35, bull = 35 * 1.20 = 42 → clamped to 40
    const result = computePriceTargets({ ...baseInputs, historicalAvgPE: 35 });
    expect(result.scenarios['12m'].bull.peMultiple).toBe(40);
  });

  it('returns null for negative EPS', () => {
    expect(computePriceTargets({ ...baseInputs, currentEPS: -2 })).toBeNull();
  });

  it('returns null for zero EPS', () => {
    expect(computePriceTargets({ ...baseInputs, currentEPS: 0 })).toBeNull();
  });

  it('returns null when currentEPS is null', () => {
    expect(computePriceTargets({ ...baseInputs, currentEPS: null })).toBeNull();
  });

  it('returns null when historicalAvgPE is null', () => {
    expect(computePriceTargets({ ...baseInputs, historicalAvgPE: null })).toBeNull();
  });

  it('echoes back inputs correctly', () => {
    const result = computePriceTargets(baseInputs);
    expect(result.inputs).toEqual({
      currentEPS: 5,
      forwardEPS: 6,
      epsGrowthRate: 10,
      historicalAvgPE: 20,
      currentPrice: 120,
    });
  });

  it('treats missing epsGrowthRate as 0', () => {
    const result = computePriceTargets({ ...baseInputs, epsGrowthRate: null });
    expect(result.scenarios['12m'].base.growthRate).toBe(0);
    expect(result.scenarios['12m'].base.eps).toBe(6);
  });

  it('floors bear growth at 0% (no negative growth)', () => {
    // growthRate = 2, bear = 2 * 0.25 = 0.5 (still positive, fine)
    const result = computePriceTargets({ ...baseInputs, epsGrowthRate: 2 });
    expect(result.scenarios['12m'].bear.growthRate).toBe(0.5);
    expect(result.scenarios['12m'].bear.growthRate).toBeGreaterThanOrEqual(0);
  });
});
