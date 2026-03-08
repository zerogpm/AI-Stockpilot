import { describe, it, expect } from 'vitest';
import { calculateDividendGrade } from './dividendGrade.js';

function makeDividends(yearAmounts) {
  // yearAmounts: [[year, total], ...] — splits each into 4 quarterly payments
  const events = [];
  for (const [year, total] of yearAmounts) {
    const quarterly = total / 4;
    for (let q = 0; q < 4; q++) {
      events.push({ date: new Date(year, q * 3, 15), amount: quarterly });
    }
  }
  return events;
}

describe('calculateDividendGrade', () => {
  it('returns null for empty input', () => {
    expect(calculateDividendGrade([])).toBeNull();
    expect(calculateDividendGrade(null)).toBeNull();
  });

  it('grades A+ for 10+ years of consecutive increases', () => {
    const data = makeDividends(
      Array.from({ length: 12 }, (_, i) => [2012 + i, 1 + i * 0.1])
    );
    const result = calculateDividendGrade(data);
    expect(result.grade).toBe('A+');
    expect(result.consecutiveIncreaseStreak).toBeGreaterThanOrEqual(10);
  });

  it('grades A for 5-9 years of consecutive increases with no cuts', () => {
    const data = makeDividends(
      Array.from({ length: 7 }, (_, i) => [2017 + i, 2 + i * 0.2])
    );
    const result = calculateDividendGrade(data);
    expect(result.grade).toBe('A');
    expect(result.consecutiveIncreaseStreak).toBeGreaterThanOrEqual(5);
  });

  it('grades B+ for 3-4 years of increases', () => {
    const data = makeDividends([
      [2019, 1.00],
      [2020, 1.00],
      [2021, 1.10],
      [2022, 1.20],
      [2023, 1.30],
      [2024, 1.40],
    ]);
    const result = calculateDividendGrade(data);
    expect(result.grade).toBe('B+');
  });

  it('grades B for consistent dividends with no cuts but flat', () => {
    const data = makeDividends([
      [2020, 2.00],
      [2021, 2.00],
      [2022, 2.00],
      [2023, 2.00],
      [2024, 2.00],
    ]);
    const result = calculateDividendGrade(data);
    expect(result.grade).toBe('B');
  });

  it('grades D for recent dividend cuts', () => {
    const currentYear = new Date().getFullYear();
    const data = makeDividends([
      [currentYear - 4, 3.00],
      [currentYear - 3, 3.20],
      [currentYear - 2, 3.40],
      [currentYear - 1, 2.50],
    ]);
    const result = calculateDividendGrade(data);
    expect(result.grade).toBe('D');
  });

  it('grades F for suspended dividends (gap years)', () => {
    const data = makeDividends([
      [2019, 2.00],
      [2020, 2.10],
      // 2021 missing
      [2022, 1.80],
      [2023, 1.90],
      [2024, 2.00],
    ]);
    const result = calculateDividendGrade(data);
    expect(result.grade).toBe('F');
  });

  it('excludes the current year from grading', () => {
    const currentYear = new Date().getFullYear();
    const data = makeDividends(
      Array.from({ length: 12 }, (_, i) => [2012 + i, 1 + i * 0.1])
    );
    // Add partial current year (just 1 payment, looks like a cut)
    data.push({ date: new Date(currentYear, 0, 15), amount: 0.3 });
    const result = calculateDividendGrade(data);
    expect(result.grade).toBe('A+');
  });

  it('calculates growth rate correctly', () => {
    const data = makeDividends([
      [2020, 1.00],
      [2021, 1.10],
      [2022, 1.21],
      [2023, 1.331],
      [2024, 1.4641],
    ]);
    const result = calculateDividendGrade(data);
    expect(result.growthRate).toBeCloseTo(10, 0);
  });

  it('returns annual dividends sorted by year', () => {
    const data = makeDividends([
      [2023, 2.00],
      [2021, 1.80],
      [2022, 1.90],
      [2024, 2.10],
    ]);
    const result = calculateDividendGrade(data);
    expect(result.annualDividends.map((d) => d.year)).toEqual([2021, 2022, 2023, 2024]);
  });

  it('excludes years with fewer payments than expected (timing shifts)', () => {
    // BMO-like scenario: most years have 4 payments, but 2018 and 2025 only have 3
    const events = [];
    const quarterly = (year, amounts) => {
      for (const [month, amt] of amounts) {
        events.push({ date: new Date(year, month, 15), amount: amt });
      }
    };
    // 2016: only 3 payments (partial first year)
    quarterly(2016, [[1, 0.49], [4, 0.49], [7, 0.49]]);
    // 2017-2024: 4 payments each, increasing
    for (let y = 2017; y <= 2024; y++) {
      const base = 0.60 + (y - 2017) * 0.05;
      quarterly(y, [[1, base], [4, base], [7, base], [10, base]]);
    }
    // 2025: only 3 payments (Q4 shifted to 2026)
    quarterly(2025, [[1, 1.00], [4, 1.00], [7, 1.00]]);

    const result = calculateDividendGrade(events);
    // 2016 and 2025 should be excluded (only 3 payments vs expected 4)
    const years = result.annualDividends.map((d) => d.year);
    expect(years).not.toContain(2016);
    expect(years).not.toContain(2025);
    expect(years[0]).toBe(2017);
    expect(years[years.length - 1]).toBe(2024);
    // Should be graded well since dividends increased every year
    expect(result.grade).toBe('A');
    expect(result.consecutiveIncreaseStreak).toBeGreaterThanOrEqual(5);
  });

  it('still detects real cuts even with payment frequency filtering', () => {
    // A stock that genuinely cuts: 4 payments per year, but amount drops
    const currentYear = new Date().getFullYear();
    const data = makeDividends([
      [currentYear - 4, 4.00],
      [currentYear - 3, 4.20],
      [currentYear - 2, 4.40],
      [currentYear - 1, 3.00], // real cut — same 4 payments, lower total
    ]);
    const result = calculateDividendGrade(data);
    expect(result.grade).toBe('D');
  });
});
