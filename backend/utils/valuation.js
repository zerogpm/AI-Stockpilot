export function calculateFairValueSeries({
  incomeStatements,
  historicalPrices,
  sharesOutstanding,
  forwardEPS,
  currentPrice,
}) {
  // Step 1: Extract annual EPS from income statements
  const annualEPS = (incomeStatements || [])
    .map((stmt) => {
      const year = new Date(stmt.endDate).getFullYear();
      const eps =
        stmt.dilutedEPS ?? (stmt.netIncome && sharesOutstanding ? stmt.netIncome / sharesOutstanding : null);
      return { year, eps, endDate: stmt.endDate };
    })
    .filter((e) => e.eps != null && e.eps > 0)
    .sort((a, b) => a.year - b.year);

  // Step 2: Compute average stock price per fiscal year
  const pricesByYear = {};
  for (const p of historicalPrices) {
    if (p.close == null) continue;
    const year = new Date(p.date).getFullYear();
    if (!pricesByYear[year]) pricesByYear[year] = [];
    pricesByYear[year].push(p.close);
  }

  const avgPriceByYear = {};
  for (const [year, prices] of Object.entries(pricesByYear)) {
    avgPriceByYear[year] = prices.reduce((a, b) => a + b, 0) / prices.length;
  }

  // Step 3: Compute historical average P/E
  const yearlyPEs = annualEPS
    .map((e) => {
      const avgPrice = avgPriceByYear[e.year];
      if (!avgPrice || e.eps <= 0) return null;
      return avgPrice / e.eps;
    })
    .filter((pe) => pe != null && pe > 0 && pe < 100);

  const rawAvgPE =
    yearlyPEs.length > 0
      ? yearlyPEs.reduce((a, b) => a + b, 0) / yearlyPEs.length
      : 15;

  const historicalAvgPE = Math.max(5, Math.min(50, rawAvgPE));

  // Step 4: Compute EPS growth rate for FastGraphs formula
  const epsValues = annualEPS.map((e) => e.eps);
  let epsGrowthRate = 0;
  if (epsValues.length >= 2) {
    const oldest = epsValues[0];
    const newest = epsValues[epsValues.length - 1];
    const years = epsValues.length - 1;
    if (oldest > 0 && years > 0) {
      epsGrowthRate = (Math.pow(newest / oldest, 1 / years) - 1) * 100;
    }
  }

  // FastGraphs: P/E = 15 for <15% growth, P/E = growth rate for >=15%
  const fairPE_orange = epsGrowthRate >= 15 ? Math.max(15, epsGrowthRate) : 15;

  // Step 5: Build monthly chart data
  const chartData = historicalPrices
    .filter((p) => p.close != null)
    .map((p) => {
      const date = new Date(p.date);
      const year = date.getFullYear();
      const month = date.getMonth();

      // Find EPS for this period
      const epsEntry =
        annualEPS.find((e) => e.year === year) ||
        annualEPS.find((e) => e.year === year - 1);
      const eps = epsEntry?.eps ?? null;

      return {
        date: `${year}-${String(month + 1).padStart(2, '0')}`,
        actualPrice: round2(p.close),
        fairValueOrange: eps ? round2(eps * fairPE_orange) : null,
        fairValueBlue: eps ? round2(eps * historicalAvgPE) : null,
      };
    });

  // Step 6: Current valuation verdict
  const latestEPS = annualEPS.length > 0 ? annualEPS[annualEPS.length - 1].eps : 1;
  const currentFairValue = latestEPS * historicalAvgPE;
  const forwardFairValue = forwardEPS ? forwardEPS * historicalAvgPE : null;
  const verdictRatio = currentPrice ? currentPrice / currentFairValue : null;

  return {
    chartData,
    annualEPS: annualEPS.map((e) => ({
      year: e.year,
      eps: round2(e.eps),
      avgPrice: avgPriceByYear[e.year] ? round2(avgPriceByYear[e.year]) : null,
      impliedPE:
        avgPriceByYear[e.year] && e.eps > 0
          ? round2(avgPriceByYear[e.year] / e.eps)
          : null,
    })),
    historicalAvgPE: round2(historicalAvgPE),
    epsGrowthRate: round2(epsGrowthRate),
    fairPE_orange: round2(fairPE_orange),
    currentFairValue: round2(currentFairValue),
    forwardFairValue: forwardFairValue ? round2(forwardFairValue) : null,
    verdictRatio: verdictRatio ? round2(verdictRatio) : null,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
