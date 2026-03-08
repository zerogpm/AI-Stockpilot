import { describe, it, expect } from 'vitest';
import { isBank } from './bankClassifier.js';

describe('isBank', () => {
  describe('known tickers', () => {
    it.each(['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'TD', 'RY', 'BMO'])
      ('returns true for %s', (ticker) => {
        expect(isBank({ ticker })).toBe(true);
      });

    it('is case insensitive', () => {
      expect(isBank({ ticker: 'jpm' })).toBe(true);
    });

    it('handles Canadian TSX tickers', () => {
      expect(isBank({ ticker: 'TD.TO' })).toBe(true);
      expect(isBank({ ticker: 'RY.TO' })).toBe(true);
    });
  });

  describe('industry-based detection', () => {
    it('detects Banks - Diversified', () => {
      expect(isBank({
        sector: 'Financial Services',
        industry: 'Banks - Diversified',
        ticker: 'UNKNOWN',
      })).toBe(true);
    });

    it('detects Banks - Regional', () => {
      expect(isBank({
        sector: 'Financial Services',
        industry: 'Banks - Regional',
        ticker: 'UNKNOWN',
      })).toBe(true);
    });

    it('detects plain "Banks"', () => {
      expect(isBank({
        sector: 'Financial Services',
        industry: 'Banks',
        ticker: 'UNKNOWN',
      })).toBe(true);
    });
  });

  describe('exclusions', () => {
    it('excludes insurance companies', () => {
      expect(isBank({
        sector: 'Financial Services',
        industry: 'Insurance - Diversified',
        ticker: 'BRK-B',
      })).toBe(false);
    });

    it('excludes asset management', () => {
      expect(isBank({
        sector: 'Financial Services',
        industry: 'Asset Management',
        ticker: 'BLK',
      })).toBe(false);
    });

    it('excludes capital markets (unknown ticker)', () => {
      expect(isBank({
        sector: 'Financial Services',
        industry: 'Capital Markets',
        ticker: 'UNKNOWN',
      })).toBe(false);
    });

    it('excludes non-financial sectors', () => {
      expect(isBank({
        sector: 'Technology',
        industry: 'Software',
        ticker: 'MSFT',
      })).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles missing fields', () => {
      expect(isBank({})).toBe(false);
      expect(isBank({ ticker: null })).toBe(false);
      expect(isBank({ sector: null, industry: null })).toBe(false);
    });
  });
});
