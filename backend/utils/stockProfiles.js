import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILES_PATH = join(__dirname, '..', 'data', 'stockProfiles.json');

let profilesCache = null;

export function loadProfiles() {
  if (!profilesCache) {
    profilesCache = JSON.parse(readFileSync(PROFILES_PATH, 'utf-8'));
  }
  return profilesCache;
}

export function saveProfiles(data) {
  writeFileSync(PROFILES_PATH, JSON.stringify(data, null, 2));
  profilesCache = data;
}

export function invalidateCache() {
  profilesCache = null;
}

export function getStockProfile(symbol, yahooIndustry) {
  const profiles = loadProfiles();
  const upperSymbol = symbol.toUpperCase();

  const tickerProfile = profiles.tickers[upperSymbol] || null;
  const industryKey = tickerProfile?.industry || yahooIndustry || null;

  const industryProfile = industryKey
    ? profiles.industries[industryKey] || null
    : null;

  if (!industryProfile && !tickerProfile) return null;

  const promptContext = [
    ...(industryProfile?.promptContext || []),
    ...(tickerProfile?.additionalContext || []),
  ];

  return {
    sectorPEOverride: industryProfile?.sectorPEOverride ?? null,
    fairPERange: industryProfile?.fairPERange ?? null,
    scenarios: industryProfile?.scenarios ?? null,
    promptContext,
    dataOverrides: tickerProfile?.dataOverrides || null,
    valuationNotes: tickerProfile?.valuationNotes || null,
    matched: {
      ticker: !!tickerProfile,
      industry: industryKey,
    },
  };
}
