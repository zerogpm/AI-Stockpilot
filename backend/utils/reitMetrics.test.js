import { describe, it, expect } from 'vitest';
import { calculateREITMetrics } from './reitMetrics.js';

describe('calculateREITMetrics', () => {
  it('computes FFO, ffoPerShare, and ffoPayoutRatio with all fields', () => {
    const result = calculateREITMetrics([{
      netIncome: 1000000,
      depreciationAndAmortization: 500000,
      assetImpairmentCharge: 50000,
      dilutedAverageShares: 100000,
      commonStockDividendPaid: -600000,
    }]);

    expect(result.ffo).toBe(1550000);
    expect(result.ffoPerShare).toBe(15.5);
    expect(result.ffoPayoutRatio).toBeCloseTo(600000 / 1550000);
  });

  it('defaults assetImpairmentCharge to 0 when missing', () => {
    const result = calculateREITMetrics([{
      netIncome: 1000000,
      depreciationAndAmortization: 500000,
      dilutedAverageShares: 100000,
      commonStockDividendPaid: -400000,
    }]);

    expect(result.ffo).toBe(1500000);
  });

  it('uses cashDividendsPaid as fallback for commonStockDividendPaid', () => {
    const result = calculateREITMetrics([{
      netIncome: 1000000,
      depreciationAndAmortization: 500000,
      dilutedAverageShares: 100000,
      cashDividendsPaid: -300000,
    }]);

    expect(result.ffoPayoutRatio).toBeCloseTo(300000 / 1500000);
  });

  it('returns null for null input', () => {
    expect(calculateREITMetrics(null)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(calculateREITMetrics([])).toBeNull();
  });

  it('returns null when netIncome is null', () => {
    const result = calculateREITMetrics([{
      netIncome: null,
      depreciationAndAmortization: 500000,
    }]);
    expect(result).toBeNull();
  });

  it('returns null when depreciation is null', () => {
    const result = calculateREITMetrics([{
      netIncome: 1000000,
      depreciationAndAmortization: null,
    }]);
    expect(result).toBeNull();
  });

  it('omits ffoPerShare when shares are missing', () => {
    const result = calculateREITMetrics([{
      netIncome: 1000000,
      depreciationAndAmortization: 500000,
      commonStockDividendPaid: -400000,
    }]);

    expect(result.ffo).toBe(1500000);
    expect(result).not.toHaveProperty('ffoPerShare');
  });

  it('omits ffoPayoutRatio when dividendsPaid is missing', () => {
    const result = calculateREITMetrics([{
      netIncome: 1000000,
      depreciationAndAmortization: 500000,
      dilutedAverageShares: 100000,
    }]);

    expect(result.ffo).toBe(1500000);
    expect(result).not.toHaveProperty('ffoPayoutRatio');
  });

  it('uses Math.abs on dividendsPaid for positive ratio', () => {
    const result = calculateREITMetrics([{
      netIncome: 1000000,
      depreciationAndAmortization: 500000,
      commonStockDividendPaid: -600000,
    }]);

    expect(result.ffoPayoutRatio).toBeGreaterThan(0);
  });

  it('uses the last element of the array', () => {
    const result = calculateREITMetrics([
      { netIncome: 999, depreciationAndAmortization: 1, dilutedAverageShares: 10 },
      { netIncome: 2000, depreciationAndAmortization: 500, dilutedAverageShares: 100 },
    ]);

    expect(result.ffo).toBe(2500);
    expect(result.ffoPerShare).toBe(25);
  });
});
