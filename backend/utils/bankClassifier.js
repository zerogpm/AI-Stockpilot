const KNOWN_BANK_TICKERS = new Set([
  // US Money Center / Diversified
  'JPM', 'BAC', 'WFC', 'C', 'USB', 'PNC', 'TFC', 'FITB', 'MTB',
  'HBAN', 'KEY', 'RF', 'CFG', 'ZION',
  // US Investment Banks
  'GS', 'MS',
  // US Custody / Trust Banks
  'STT', 'NTRS', 'BK',
  // Canadian Big 6
  'TD', 'RY', 'BMO', 'BNS', 'CM', 'NA',
  // Canadian TSX variants
  'TD.TO', 'RY.TO', 'BMO.TO', 'BNS.TO', 'CM.TO', 'NA.TO',
]);

const BANK_INDUSTRY_PATTERNS = [
  /banks?\s*[-–—]\s*(diversified|regional|major)/i,
  /^banks$/i,
];

export function isBank({ sector, industry, ticker }) {
  const upperTicker = (ticker || '').toUpperCase();
  if (KNOWN_BANK_TICKERS.has(upperTicker)) return true;

  if (sector === 'Financial Services' && industry) {
    for (const pattern of BANK_INDUSTRY_PATTERNS) {
      if (pattern.test(industry)) return true;
    }
  }

  return false;
}
