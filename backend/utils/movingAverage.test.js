import { describe, it, expect } from 'vitest';
import { calculateSMASeries } from './movingAverage.js';

function makeWeeklyPrices(count, startPrice) {
  const prices = [];
  const start = new Date(2023, 0, 2); // Jan 2, 2023
  for (let i = 0; i < count; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i * 7);
    prices.push({ date: date.toISOString(), close: startPrice + i });
  }
  return prices;
}

describe('calculateSMASeries', () => {
  it('returns chartType sma', () => {
    const result = calculateSMASeries({ historicalPrices: makeWeeklyPrices(5, 100) });
    expect(result.chartType).toBe('sma');
  });

  it('returns empty chartData for empty input', () => {
    const result = calculateSMASeries({ historicalPrices: [] });
    expect(result.chartData).toEqual([]);
  });

  it('sets sma50 to null for first 9 entries and computes at index 9', () => {
    const prices = makeWeeklyPrices(12, 100);
    const result = calculateSMASeries({ historicalPrices: prices });

    for (let i = 0; i < 9; i++) {
      expect(result.chartData[i].sma50).toBeNull();
    }
    expect(result.chartData[9].sma50).toBeTypeOf('number');
  });

  it('computes correct SMA50 value (10-week window)', () => {
    // Prices: 100, 101, 102, ..., 109
    const prices = makeWeeklyPrices(10, 100);
    const result = calculateSMASeries({ historicalPrices: prices });

    // Average of 100..109 = 104.5
    const expected = Math.round(104.5 * 100) / 100;
    expect(result.chartData[9].sma50).toBe(expected);
  });

  it('sets sma200 to null before index 39 and computes at index 39', () => {
    const prices = makeWeeklyPrices(45, 50);
    const result = calculateSMASeries({ historicalPrices: prices });

    for (let i = 0; i < 39; i++) {
      expect(result.chartData[i].sma200).toBeNull();
    }
    expect(result.chartData[39].sma200).toBeTypeOf('number');
  });

  it('computes correct SMA200 value (40-week window)', () => {
    const prices = makeWeeklyPrices(40, 10);
    const result = calculateSMASeries({ historicalPrices: prices });

    // Average of 10..49 = 29.5
    const expected = Math.round(29.5 * 100) / 100;
    expect(result.chartData[39].sma200).toBe(expected);
  });

  it('filters out null close values', () => {
    const prices = [
      { date: new Date(2023, 0, 2).toISOString(), close: 100 },
      { date: new Date(2023, 0, 9).toISOString(), close: null },
      { date: new Date(2023, 0, 16).toISOString(), close: 105 },
    ];
    const result = calculateSMASeries({ historicalPrices: prices });
    expect(result.chartData).toHaveLength(2);
  });

  it('formats dates as YYYY-MM-DD', () => {
    const prices = makeWeeklyPrices(1, 100);
    const result = calculateSMASeries({ historicalPrices: prices });
    expect(result.chartData[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('includes actualPrice rounded to 2 decimals', () => {
    const prices = [{ date: new Date(2023, 0, 2).toISOString(), close: 100.456 }];
    const result = calculateSMASeries({ historicalPrices: prices });
    expect(result.chartData[0].actualPrice).toBe(100.46);
  });
});
