import { describe, it, expect } from 'vitest';
import { calculateBacktest } from './backtestCalculator';

const makeChartData = (entries) =>
  entries.map(([date, price]) => ({ date, actualPrice: price }));

describe('calculateBacktest', () => {
  it('returns null for empty/invalid input', () => {
    expect(calculateBacktest({ chartData: [], dividendEvents: [], startDate: '2020-01', endDate: '2021-01', investmentAmount: 10000 })).toBeNull();
    expect(calculateBacktest({ chartData: makeChartData([['2020-01', 100]]), dividendEvents: [], startDate: '2020-01', endDate: '2021-01', investmentAmount: 0 })).toBeNull();
  });

  it('calculates price-only return (no dividends)', () => {
    const chartData = makeChartData([['2020-01', 100], ['2020-06', 120], ['2021-01', 150]]);
    const result = calculateBacktest({
      chartData, dividendEvents: [], startDate: '2020-01', endDate: '2021-01', investmentAmount: 10000,
    });
    expect(result.startPrice).toBe(100);
    expect(result.endPrice).toBe(150);
    expect(result.initialShares).toBe(100);
    expect(result.totalDividends).toBe(0);
    expect(result.totalValue).toBe(15000);
    expect(result.totalReturn).toBe(5000);
    expect(result.totalReturnPct).toBeCloseTo(50);
    expect(result.priceReturnPct).toBeCloseTo(50);
    expect(result.dividendReturnPct).toBeCloseTo(0);
  });

  it('calculates price + dividends without DRIP', () => {
    const chartData = makeChartData([['2020-01', 100], ['2020-06', 105], ['2021-01', 110]]);
    const dividendEvents = [
      { date: '2020-04-15', amount: 1.0 },
      { date: '2020-10-15', amount: 1.0 },
    ];
    const result = calculateBacktest({
      chartData, dividendEvents, startDate: '2020-01', endDate: '2021-01', investmentAmount: 10000,
    });
    expect(result.initialShares).toBe(100);
    expect(result.totalDividends).toBe(200); // 100 shares * $2 total
    expect(result.totalValue).toBe(11200);   // 100*110 + 200
    expect(result.totalReturnPct).toBeCloseTo(12);
    expect(result.priceReturnPct).toBeCloseTo(10);
    expect(result.dividendReturnPct).toBeCloseTo(2);
  });

  it('calculates with DRIP', () => {
    const chartData = makeChartData([['2020-01', 100], ['2020-06', 105], ['2021-01', 110]]);
    const dividendEvents = [
      { date: '2020-04-15', amount: 1.0 },
      { date: '2020-10-15', amount: 1.0 },
    ];
    const result = calculateBacktest({
      chartData, dividendEvents, startDate: '2020-01', endDate: '2021-01', investmentAmount: 10000,
      reinvestDividends: true,
    });
    expect(result.reinvested).toBe(true);
    // First dividend: 100 shares * $1 = $100, price ~100 (nearest to 2020-01), buy 1 share => 101 shares
    // Second dividend: 101 shares * $1 = $101, price ~105 (nearest to 2020-06), buy ~0.962 shares => ~101.962 shares
    expect(result.finalShares).toBeGreaterThan(result.initialShares);
    expect(result.totalValue).toBeGreaterThan(11200); // should beat non-DRIP
  });

  it('handles no dividends in period (growth stock)', () => {
    const chartData = makeChartData([['2020-01', 50], ['2021-01', 75]]);
    const result = calculateBacktest({
      chartData, dividendEvents: [], startDate: '2020-01', endDate: '2021-01', investmentAmount: 5000,
    });
    expect(result.totalDividends).toBe(0);
    expect(result.totalReturnPct).toBeCloseTo(50);
    expect(result.dividendReturnPct).toBeCloseTo(0);
  });

  it('returns 0% for same start and end date', () => {
    const chartData = makeChartData([['2020-06', 100]]);
    const result = calculateBacktest({
      chartData, dividendEvents: [], startDate: '2020-06', endDate: '2020-06', investmentAmount: 10000,
    });
    expect(result.totalReturn).toBe(0);
    expect(result.totalReturnPct).toBe(0);
    expect(result.periodYears).toBe(0);
  });

  it('calculates annualized return correctly', () => {
    const chartData = makeChartData([['2015-01', 50], ['2020-01', 100]]);
    const result = calculateBacktest({
      chartData, dividendEvents: [], startDate: '2015-01', endDate: '2020-01', investmentAmount: 10000,
    });
    // 100% return over ~5 years => annualized ~14.87%
    expect(result.annualizedReturnPct).toBeCloseTo(14.87, 0);
    expect(result.periodYears).toBeCloseTo(5, 0);
  });

  it('filters dividends outside the selected period', () => {
    const chartData = makeChartData([['2020-06', 100], ['2021-06', 120]]);
    const dividendEvents = [
      { date: '2020-01-15', amount: 5.0 },  // before period
      { date: '2020-09-15', amount: 1.0 },  // in period
      { date: '2022-01-15', amount: 5.0 },  // after period
    ];
    const result = calculateBacktest({
      chartData, dividendEvents, startDate: '2020-06', endDate: '2021-06', investmentAmount: 10000,
    });
    expect(result.totalDividends).toBe(100); // only the $1 in-period dividend * 100 shares
  });
});
