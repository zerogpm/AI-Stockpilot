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

  it('includes forward P/E historical reference for BROAD_MARKET', () => {
    const stock = baseStock();
    const result = formatDataBlock(stock, null, 'BROAD_MARKET');
    expect(result).toContain('Historical Forward P/E Range');
    expect(result).toContain('17-22x');
  });

  it('shows forward P/E when defaultKeyStatistics provides it', () => {
    const stock = baseStock({
      defaultKeyStatistics: { forwardPE: 21.5 },
    });
    const result = formatDataBlock(stock, null, 'BROAD_MARKET');
    expect(result).toContain('Forward P/E:** 21.50');
  });

  it('shows N/A for forward P/E when not available', () => {
    const stock = baseStock();
    const result = formatDataBlock(stock, null, 'BROAD_MARKET');
    expect(result).toContain('Forward P/E:** N/A');
  });

  it('shows SMA with dollar values', () => {
    const stock = baseStock({
      price: { symbol: 'VOO', shortName: 'Vanguard S&P 500 ETF', regularMarketPrice: 618.43, currency: 'USD' },
      summaryDetail: {
        fiftyTwoWeekHigh: 650,
        fiftyTwoWeekLow: 500,
        fiftyDayAverage: 627.50,
        twoHundredDayAverage: 590.00,
      },
    });
    const result = formatDataBlock(stock, null, 'BROAD_MARKET');
    expect(result).toContain('$618.43 vs $627.50');
    expect(result).toContain('Below by');
    expect(result).toContain('$618.43 vs $590.00');
    expect(result).toContain('Above by');
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

  it('includes price context instruction for BROAD_MARKET', () => {
    const prompt = buildETFAnalysisPrompt('BROAD_MARKET', stock, news, null);
    expect(prompt).toContain('PRICE CONTEXT');
    expect(prompt).toContain('current price/NAV');
  });

  it('requires both trailing and forward P/E in BROAD_MARKET prompt', () => {
    const prompt = buildETFAnalysisPrompt('BROAD_MARKET', stock, news, null);
    expect(prompt).toContain('trailing P/E AND forward P/E');
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
