import { describe, it, expect } from 'vitest';
import { getStockData } from '../services/yahooFinance.js';
import { calculateDividendGrade } from './dividendGrade.js';

describe('dividend grading (integration)', () => {
  it('BMO grades as a consistent dividend grower, not D/F', async () => {
    const data = await getStockData('BMO');
    const result = calculateDividendGrade(data.dividendEvents);

    console.log('BMO Grade:', result.grade);
    console.log('BMO Streak:', result.consecutiveIncreaseStreak, 'years');
    console.log('BMO CAGR:', result.growthRate, '%');
    console.log('BMO Years included:', result.annualDividends.map((d) => `${d.year}: $${d.total.toFixed(2)}`).join(', '));

    // BMO is a well-known consistent dividend grower — should NOT be D or F
    expect(['A+', 'A', 'B+', 'B']).toContain(result.grade);

    // Should have a positive streak
    expect(result.consecutiveIncreaseStreak).toBeGreaterThanOrEqual(3);

    // CAGR should be in a reasonable range (AAII reports 7.6% 5yr)
    expect(result.growthRate).toBeGreaterThan(3);
    expect(result.growthRate).toBeLessThan(20);
  }, 30000);
});
