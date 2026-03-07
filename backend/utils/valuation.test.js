import { describe, it, expect } from 'vitest';
import { calculateFairValueSeries } from './valuation.js';

function makeStatement(year, dilutedEPS, netIncome) {
  return { endDate: `${year}-12-31`, dilutedEPS, netIncome };
}

function makePrices(yearStart, yearEnd, basePrice) {
  const prices = [];
  for (let y = yearStart; y <= yearEnd; y++) {
    for (let m = 0; m < 12; m++) {
      prices.push({ date: new Date(y, m, 15).toISOString(), close: basePrice + y - yearStart });
    }
  }
  return prices;
}

describe('calculateFairValueSeries', () => {
  it('computes correct annualEPS, growth rate, and chart data for 3 years', () => {
    const result = calculateFairValueSeries({
      incomeStatements: [
        makeStatement(2021, 2.0),
        makeStatement(2022, 2.5),
        makeStatement(2023, 3.0),
      ],
      historicalPrices: makePrices(2021, 2023, 40),
      sharesOutstanding: 1000000,
      forwardEPS: 3.5,
      currentPrice: 50,
    });

    expect(result.annualEPS).toHaveLength(3);
    expect(result.annualEPS[0].year).toBe(2021);
    expect(result.annualEPS[2].year).toBe(2023);
    expect(result.epsGrowthRate).toBeGreaterThan(0);
    expect(result.chartData.length).toBeGreaterThan(0);
    expect(result.historicalAvgPE).toBeGreaterThan(0);
    expect(result.currentFairValue).toBeGreaterThan(0);
    expect(result.forwardFairValue).toBeGreaterThan(0);
    expect(result.verdictRatio).toBeGreaterThan(0);
  });

  it('derives EPS from netIncome / sharesOutstanding when dilutedEPS is missing', () => {
    const result = calculateFairValueSeries({
      incomeStatements: [makeStatement(2022, undefined, 5000000)],
      historicalPrices: makePrices(2022, 2022, 50),
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 50,
    });

    expect(result.annualEPS).toHaveLength(1);
    expect(result.annualEPS[0].eps).toBe(5);
  });

  it('filters out negative EPS years', () => {
    const result = calculateFairValueSeries({
      incomeStatements: [
        makeStatement(2021, -1.0),
        makeStatement(2022, 0),
        makeStatement(2023, 3.0),
      ],
      historicalPrices: makePrices(2021, 2023, 40),
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 50,
    });

    expect(result.annualEPS).toHaveLength(1);
    expect(result.annualEPS[0].year).toBe(2023);
  });

  it('clamps historicalAvgPE to minimum of 5', () => {
    // Very low price relative to EPS => raw P/E < 5
    const result = calculateFairValueSeries({
      incomeStatements: [makeStatement(2023, 100.0)],
      historicalPrices: [{ date: new Date(2023, 6, 1).toISOString(), close: 10 }],
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 10,
    });

    expect(result.historicalAvgPE).toBe(5);
  });

  it('clamps historicalAvgPE to maximum of 50', () => {
    // Very high price relative to EPS => raw P/E > 50
    const result = calculateFairValueSeries({
      incomeStatements: [makeStatement(2023, 0.1)],
      historicalPrices: [{ date: new Date(2023, 6, 1).toISOString(), close: 8 }],
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 8,
    });

    expect(result.historicalAvgPE).toBe(50);
  });

  it('excludes P/E ratios above 100 from average', () => {
    // Year 2021: price 1000, EPS 1 => P/E=1000 (excluded)
    // Year 2022: price 30, EPS 2 => P/E=15
    const result = calculateFairValueSeries({
      incomeStatements: [
        makeStatement(2021, 1.0),
        makeStatement(2022, 2.0),
      ],
      historicalPrices: [
        { date: new Date(2021, 6, 1).toISOString(), close: 1000 },
        { date: new Date(2022, 6, 1).toISOString(), close: 30 },
      ],
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 30,
    });

    expect(result.historicalAvgPE).toBe(15);
  });

  it('uses growth rate as fairPE_orange when CAGR >= 15%', () => {
    // EPS: 1 -> 2 over 1 year = 100% CAGR
    const result = calculateFairValueSeries({
      incomeStatements: [
        makeStatement(2022, 1.0),
        makeStatement(2023, 2.0),
      ],
      historicalPrices: makePrices(2022, 2023, 20),
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 40,
    });

    expect(result.epsGrowthRate).toBe(100);
    expect(result.fairPE_orange).toBe(100);
  });

  it('defaults fairPE_orange to 15 when CAGR < 15%', () => {
    // EPS: 2 -> 2.1 over 1 year = 5% CAGR
    const result = calculateFairValueSeries({
      incomeStatements: [
        makeStatement(2022, 2.0),
        makeStatement(2023, 2.1),
      ],
      historicalPrices: makePrices(2022, 2023, 30),
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 30,
    });

    expect(result.epsGrowthRate).toBe(5);
    expect(result.fairPE_orange).toBe(15);
  });

  it('returns epsGrowthRate 0 with only 1 year of data', () => {
    const result = calculateFairValueSeries({
      incomeStatements: [makeStatement(2023, 3.0)],
      historicalPrices: makePrices(2023, 2023, 45),
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 45,
    });

    expect(result.epsGrowthRate).toBe(0);
    expect(result.fairPE_orange).toBe(15);
  });

  it('handles empty incomeStatements gracefully', () => {
    const result = calculateFairValueSeries({
      incomeStatements: [],
      historicalPrices: makePrices(2023, 2023, 50),
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 50,
    });

    expect(result.annualEPS).toHaveLength(0);
    expect(result.historicalAvgPE).toBe(15); // default
    expect(result.epsGrowthRate).toBe(0);
  });

  it('computes forwardFairValue when forwardEPS is provided', () => {
    const result = calculateFairValueSeries({
      incomeStatements: [makeStatement(2023, 3.0)],
      historicalPrices: makePrices(2023, 2023, 45),
      sharesOutstanding: 1000000,
      forwardEPS: 4.0,
      currentPrice: 50,
    });

    expect(result.forwardFairValue).toBe(result.historicalAvgPE * 4);
  });

  it('returns null forwardFairValue when forwardEPS is null', () => {
    const result = calculateFairValueSeries({
      incomeStatements: [makeStatement(2023, 3.0)],
      historicalPrices: makePrices(2023, 2023, 45),
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 50,
    });

    expect(result.forwardFairValue).toBeNull();
  });

  it('filters out prices with null close values', () => {
    const result = calculateFairValueSeries({
      incomeStatements: [makeStatement(2023, 3.0)],
      historicalPrices: [
        { date: new Date(2023, 0, 15).toISOString(), close: 45 },
        { date: new Date(2023, 1, 15).toISOString(), close: null },
        { date: new Date(2023, 2, 15).toISOString(), close: 50 },
      ],
      sharesOutstanding: 1000000,
      forwardEPS: null,
      currentPrice: 50,
    });

    expect(result.chartData).toHaveLength(2);
  });
});
