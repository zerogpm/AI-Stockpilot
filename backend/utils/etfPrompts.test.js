import { describe, it, expect } from 'vitest';
import { KNOWN_EXPENSE_RATIOS, formatDataBlock, buildETFAnalysisPrompt } from './etfPrompts.js';

describe('KNOWN_EXPENSE_RATIOS', () => {
  it('includes major ETFs', () => {
    expect(KNOWN_EXPENSE_RATIOS.VOO).toBe(0.03);
    expect(KNOWN_EXPENSE_RATIOS.SPY).toBe(0.09);
    expect(KNOWN_EXPENSE_RATIOS.QQQ).toBe(0.20);
  });
});

describe('formatDataBlock', () => {
  const baseStock = (overrides = {}) => ({
    price: { symbol: 'VOO', shortName: 'Vanguard S&P 500 ETF', regularMarketPrice: 500, currency: 'USD' },
    summaryDetail: { fiftyTwoWeekHigh: 550, fiftyTwoWeekLow: 400 },
    defaultKeyStatistics: {},
    fundProfile: {},
    topHoldings: {},
    summaryProfile: {},
    ...overrides,
  });

  it('shows expense ratio from fundProfile when available', () => {
    const stock = baseStock({
      fundProfile: { feesExpensesInvestment: { annualReportExpenseRatio: 0.0003 } },
    });
    const result = formatDataBlock(stock, null, 'BROAD_MARKET');
    expect(result).toContain('Expense Ratio:** 0.03%');
    expect(result).not.toContain('(reference)');
  });

  it('falls back to KNOWN_EXPENSE_RATIOS when fundProfile has no expense ratio', () => {
    const stock = baseStock({ fundProfile: {} });
    const result = formatDataBlock(stock, null, 'BROAD_MARKET');
    expect(result).toContain('0.03% (reference)');
  });

  it('shows N/A for unknown ticker with no fundProfile data', () => {
    const stock = baseStock({
      price: { symbol: 'XYZZ', shortName: 'Unknown ETF', regularMarketPrice: 50, currency: 'USD' },
      fundProfile: {},
    });
    const result = formatDataBlock(stock, null, 'BROAD_MARKET');
    expect(result).toContain('Expense Ratio:** N/A');
  });

  it('falls back to summaryDetail expense ratio', () => {
    const stock = baseStock({
      fundProfile: {},
      summaryDetail: { annualReportExpenseRatio: 0.0009, fiftyTwoWeekHigh: 550, fiftyTwoWeekLow: 400 },
    });
    const result = formatDataBlock(stock, null, 'BROAD_MARKET');
    expect(result).toContain('Expense Ratio:** 0.09%');
    expect(result).not.toContain('(reference)');
  });

  it('includes historical P/E reference for BROAD_MARKET', () => {
    const stock = baseStock();
    const result = formatDataBlock(stock, null, 'BROAD_MARKET');
    expect(result).toContain('S&P 500 long-term average');
    expect(result).toContain('16-18x');
  });
});

describe('buildETFAnalysisPrompt', () => {
  const stock = {
    price: { symbol: 'VOO', shortName: 'Vanguard S&P 500 ETF', regularMarketPrice: 500, currency: 'USD' },
    summaryDetail: { fiftyTwoWeekHigh: 550, fiftyTwoWeekLow: 400 },
    defaultKeyStatistics: {},
    fundProfile: {},
    topHoldings: {},
    summaryProfile: {},
  };
  const news = [{ title: 'Market drops on tariff fears', publisher: 'Reuters' }];

  it('includes PRE-OUTPUT VALIDATION block', () => {
    const prompt = buildETFAnalysisPrompt('BROAD_MARKET', stock, news, null);
    expect(prompt).toContain('PRE-OUTPUT VALIDATION');
    expect(prompt).toContain('Is confidence HIGH?');
  });

  it('includes specific catalyst constraint in JSON schema', () => {
    const prompt = buildETFAnalysisPrompt('BROAD_MARKET', stock, news, null);
    expect(prompt).toContain('MUST name specific events with dates');
  });

  it('includes macro assumption requirement in forecast schema', () => {
    const prompt = buildETFAnalysisPrompt('BROAD_MARKET', stock, news, null);
    expect(prompt).toContain('State the macro assumption behind this target');
  });

  it('includes expense ratio fallback data for VOO', () => {
    const prompt = buildETFAnalysisPrompt('BROAD_MARKET', stock, news, null);
    expect(prompt).toContain('0.03% (reference)');
  });

  it('works for GROWTH type', () => {
    const prompt = buildETFAnalysisPrompt('GROWTH', stock, news, null);
    expect(prompt).toContain('PRE-OUTPUT VALIDATION');
    expect(prompt).toContain('growth');
  });

  it('works for DIVIDEND_GROWTH type', () => {
    const prompt = buildETFAnalysisPrompt('DIVIDEND_GROWTH', stock, news, null);
    expect(prompt).toContain('PRE-OUTPUT VALIDATION');
    expect(prompt).toContain('dividend');
  });
});
