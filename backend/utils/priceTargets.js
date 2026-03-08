const HORIZONS = [
  { key: '3m', months: 3 },
  { key: '6m', months: 6 },
  { key: '12m', months: 12 },
];

const SCENARIOS = [
  { key: 'bear', growthMult: 0.25, peMult: 0.80, peMin: 8, peMax: Infinity },
  { key: 'base', growthMult: 1.0, peMult: 1.0, peMin: -Infinity, peMax: Infinity },
  { key: 'bull', growthMult: 1.5, peMult: 1.20, peMin: -Infinity, peMax: 40 },
];

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function computePriceTargets({ currentEPS, forwardEPS, epsGrowthRate, historicalAvgPE, currentPrice, scenarioOverrides }) {
  const baseEPS = forwardEPS ?? currentEPS;
  if (baseEPS == null || baseEPS <= 0) return null;
  if (currentEPS == null || currentEPS <= 0) return null;
  if (historicalAvgPE == null || historicalAvgPE <= 0) return null;

  const growthRate = epsGrowthRate ?? 0;
  const overrides = scenarioOverrides || {};

  const scenarios = {};

  for (const { key: horizonKey, months } of HORIZONS) {
    scenarios[horizonKey] = {};

    for (const { key: scenarioKey, growthMult, peMult, peMin, peMax } of SCENARIOS) {
      const ov = overrides[scenarioKey] || {};
      const effGrowthMult = ov.growthMult ?? growthMult;
      const effPEMult = ov.peMult ?? peMult;
      const effPEMin = ov.peMin ?? peMin;
      const effPEMax = ov.peMax ?? peMax;

      const scenarioGrowth = Math.max(0, growthRate * effGrowthMult);
      const scenarioPE = Math.min(effPEMax, Math.max(effPEMin, historicalAvgPE * effPEMult));
      const futureEPS = baseEPS * Math.pow(1 + scenarioGrowth / 100, months / 12);
      const targetPrice = futureEPS * scenarioPE;

      scenarios[horizonKey][scenarioKey] = {
        eps: round2(futureEPS),
        growthRate: round2(scenarioGrowth),
        peMultiple: round2(scenarioPE),
        targetPrice: round2(targetPrice),
      };
    }
  }

  return {
    inputs: { currentEPS, forwardEPS, epsGrowthRate: growthRate, historicalAvgPE, currentPrice },
    scenarios,
  };
}
