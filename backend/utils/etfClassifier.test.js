import { describe, it, expect } from 'vitest';
import { classifyETF } from './etfClassifier.js';

describe('classifyETF', () => {
  describe('known tickers', () => {
    it.each([
      ['VOO', 'BROAD_MARKET'],
      ['SPY', 'BROAD_MARKET'],
      ['VTI', 'BROAD_MARKET'],
      ['SCHD', 'DIVIDEND_GROWTH'],
      ['VYM', 'DIVIDEND_GROWTH'],
      ['VIG', 'DIVIDEND_GROWTH'],
      ['QQQ', 'GROWTH'],
      ['SCHG', 'GROWTH'],
      ['VGT', 'GROWTH'],
      ['JEPI', 'INCOME'],
      ['QYLD', 'INCOME'],
      ['XLE', 'SECTOR'],
      ['XLF', 'SECTOR'],
      ['VNQ', 'SECTOR'],
      ['VEA', 'INTERNATIONAL'],
      ['EEM', 'INTERNATIONAL'],
      ['VXUS', 'INTERNATIONAL'],
      ['ARKK', 'THEMATIC'],
      ['BOTZ', 'THEMATIC'],
      ['ICLN', 'THEMATIC'],
    ])('%s → %s', (ticker, expected) => {
      expect(classifyETF({ ticker })).toBe(expected);
    });
  });

  describe('name-based classification', () => {
    it('classifies S&P 500 funds as BROAD_MARKET', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', name: 'iShares Core S&P 500 ETF' })).toBe('BROAD_MARKET');
    });

    it('classifies total market funds as BROAD_MARKET', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', name: 'Vanguard Total Stock Market ETF' })).toBe('BROAD_MARKET');
    });

    it('classifies dividend growth by name', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', name: 'WisdomTree US Dividend Growth Fund' })).toBe('DIVIDEND_GROWTH');
    });

    it('classifies international by name', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', name: 'Vanguard FTSE Developed Markets ETF' })).toBe('INTERNATIONAL');
    });

    it('classifies income by name', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', name: 'JPMorgan Equity Premium Income ETF' })).toBe('INCOME');
    });

    it('classifies thematic by name', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', name: 'Global X Robotics & AI ETF' })).toBe('THEMATIC');
    });

    it('classifies growth by name', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', name: 'Invesco Nasdaq 100 ETF' })).toBe('GROWTH');
    });
  });

  describe('numeric heuristics', () => {
    it('classifies high yield as INCOME', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', dividendYield: 0.08 })).toBe('INCOME');
    });

    it('classifies moderate yield with streak as DIVIDEND_GROWTH', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', dividendYield: 0.03, streak: 7 })).toBe('DIVIDEND_GROWTH');
    });

    it('classifies low yield + high P/E as GROWTH', () => {
      expect(classifyETF({ ticker: 'UNKNOWN', dividendYield: 0.005, peRatio: 35 })).toBe('GROWTH');
    });

    it('defaults to BROAD_MARKET', () => {
      expect(classifyETF({ ticker: 'UNKNOWN' })).toBe('BROAD_MARKET');
    });
  });

  it('is case insensitive for ticker', () => {
    expect(classifyETF({ ticker: 'voo' })).toBe('BROAD_MARKET');
    expect(classifyETF({ ticker: 'Schd' })).toBe('DIVIDEND_GROWTH');
  });
});
