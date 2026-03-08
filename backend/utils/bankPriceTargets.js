const BANK_SCENARIOS = {
  bear: { pe: 8, pb: 1.1, label: 'Recession' },
  base: { pe: 10, pb: 1.5, label: 'Stable economy' },
  bull: { pe: 12, pb: 1.8, label: 'Strong credit growth' },
};

const BANK_NORMAL_RANGES = {
  pe: { low: 9, high: 11 },
  pb: { low: 1.2, high: 1.8 },
  dividendYield: { low: 0.03, high: 0.06 },
};

const DDM_PARAMS = {
  requiredReturn: 0.09,   // midpoint of 8–10%
  dividendGrowth: 0.05,   // midpoint of 4–6%
};

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function computeBankPriceTargets({ currentEPS, forwardEPS, bookValuePerShare, currentPrice, historicalAvgPE, dividendRate }) {
  const baseEPS = forwardEPS ?? currentEPS;
  if (baseEPS == null || baseEPS <= 0) return null;
  if (currentEPS == null || currentEPS <= 0) return null;
  if (bookValuePerShare == null || bookValuePerShare <= 0) return null;

  const midPE = (BANK_NORMAL_RANGES.pe.low + BANK_NORMAL_RANGES.pe.high) / 2; // 10
  const midPB = (BANK_NORMAL_RANGES.pb.low + BANK_NORMAL_RANGES.pb.high) / 2; // 1.5

  const peModel = round2(baseEPS * midPE);
  const pbModel = round2(bookValuePerShare * midPB);

  const hasDDM = dividendRate != null && dividendRate > 0;
  const ddmModel = hasDDM
    ? round2(dividendRate / (DDM_PARAMS.requiredReturn - DDM_PARAMS.dividendGrowth))
    : null;

  const models = [peModel, pbModel];
  if (ddmModel != null) models.push(ddmModel);
  const blended = round2(models.reduce((a, b) => a + b, 0) / models.length);

  const fairValue = { peModel, pbModel, ddmModel, blended };

  const scenarios = {};

  for (const horizon of ['3m', '6m', '12m']) {
    scenarios[horizon] = {};

    for (const [scenarioKey, { pe, pb }] of Object.entries(BANK_SCENARIOS)) {
      const peFairPrice = round2(baseEPS * pe);
      const pbFairPrice = round2(bookValuePerShare * pb);

      const scenarioModels = [peFairPrice, pbFairPrice];
      if (ddmModel != null) scenarioModels.push(ddmModel);
      const targetPrice = round2(scenarioModels.reduce((a, b) => a + b, 0) / scenarioModels.length);

      scenarios[horizon][scenarioKey] = {
        eps: round2(baseEPS),
        peMultiple: pe,
        pbMultiple: pb,
        peFairPrice,
        pbFairPrice,
        ddmFairPrice: ddmModel,
        targetPrice,
      };
    }
  }

  return {
    inputs: { currentEPS, forwardEPS, bookValuePerShare, currentPrice, historicalAvgPE, dividendRate },
    fairValue,
    normalRanges: BANK_NORMAL_RANGES,
    ddmParams: DDM_PARAMS,
    scenarios,
  };
}

export { BANK_SCENARIOS, BANK_NORMAL_RANGES, DDM_PARAMS };
