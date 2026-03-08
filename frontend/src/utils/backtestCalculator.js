/**
 * Find the chart data point with the closest date to targetDate.
 * chartData dates are "YYYY-MM" or "YYYY-MM-DD"; targetDate is an ISO string or similar.
 */
function findNearestPrice(chartData, targetDate) {
  const target = new Date(targetDate).getTime();
  let best = null;
  let bestDiff = Infinity;
  for (const point of chartData) {
    const t = new Date(point.date).getTime();
    const diff = Math.abs(t - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = point;
    }
  }
  return best?.actualPrice ?? null;
}

/**
 * Calculate investment return over a period, including dividends.
 *
 * @param {Object} params
 * @param {Array} params.chartData - array of { date, actualPrice, ... }
 * @param {Array} params.dividendEvents - array of { date, amount } (per-share)
 * @param {string} params.startDate - start date (YYYY-MM or YYYY-MM-DD)
 * @param {string} params.endDate - end date (YYYY-MM or YYYY-MM-DD)
 * @param {number} params.investmentAmount - dollars invested
 * @param {boolean} params.reinvestDividends - DRIP mode
 * @returns {Object|null} backtest result
 */
export function calculateBacktest({ chartData, dividendEvents, startDate, endDate, investmentAmount, reinvestDividends = false }) {
  if (!chartData?.length || !investmentAmount || investmentAmount <= 0) return null;

  // Find start and end prices from chart data (exact match first, then nearest with actualPrice)
  let startPoint = chartData.find((d) => d.date === startDate && d.actualPrice);
  let endPoint = chartData.find((d) => d.date === endDate && d.actualPrice);

  // If exact match has no actualPrice (e.g. projected data), find nearest point that does
  if (!startPoint) {
    const withPrice = chartData.filter((d) => d.actualPrice);
    if (!withPrice.length) return null;
    const startTs = new Date(startDate).getTime();
    startPoint = withPrice.reduce((best, d) =>
      Math.abs(new Date(d.date).getTime() - startTs) < Math.abs(new Date(best.date).getTime() - startTs) ? d : best
    );
  }
  if (!endPoint) {
    const withPrice = chartData.filter((d) => d.actualPrice);
    if (!withPrice.length) return null;
    const endTs = new Date(endDate).getTime();
    endPoint = withPrice.reduce((best, d) =>
      Math.abs(new Date(d.date).getTime() - endTs) < Math.abs(new Date(best.date).getTime() - endTs) ? d : best
    );
  }

  const startPrice = startPoint.actualPrice;
  const endPrice = endPoint.actualPrice;
  // Use the actual matched dates for display
  startDate = startPoint.date;
  endDate = endPoint.date;

  if (startDate === endDate) {
    return {
      startDate, endDate, startPrice, endPrice,
      initialShares: investmentAmount / startPrice,
      finalShares: investmentAmount / startPrice,
      totalDividends: 0,
      totalValue: investmentAmount,
      totalReturn: 0,
      totalReturnPct: 0,
      priceReturnPct: 0,
      dividendReturnPct: 0,
      annualizedReturnPct: 0,
      periodYears: 0,
      reinvested: reinvestDividends,
    };
  }

  const initialShares = investmentAmount / startPrice;

  // Normalize dates for comparison
  const startTs = new Date(startDate).getTime();
  const endTs = new Date(endDate).getTime();

  // Filter and sort dividends in the period
  const periodicDividends = (dividendEvents || [])
    .filter((d) => {
      const t = new Date(d.date).getTime();
      return t >= startTs && t <= endTs;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let finalShares = initialShares;
  let totalDividends = 0;

  if (reinvestDividends) {
    // DRIP: reinvest each dividend at the nearest available price
    for (const div of periodicDividends) {
      const dividendIncome = finalShares * div.amount;
      totalDividends += dividendIncome;
      const priceAtDiv = findNearestPrice(chartData, div.date);
      if (priceAtDiv && priceAtDiv > 0) {
        finalShares += dividendIncome / priceAtDiv;
      }
    }
    // With DRIP, totalValue is just finalShares * endPrice (dividends are reinvested into shares)
    const totalValue = finalShares * endPrice;
    const totalReturn = totalValue - investmentAmount;
    const totalReturnPct = (totalReturn / investmentAmount) * 100;
    const priceReturnPct = ((endPrice - startPrice) / startPrice) * 100;
    const dividendReturnPct = totalReturnPct - priceReturnPct;
    const periodYears = (endTs - startTs) / (365.25 * 24 * 60 * 60 * 1000);
    const annualizedReturnPct = periodYears > 0
      ? (Math.pow(totalValue / investmentAmount, 1 / periodYears) - 1) * 100
      : 0;

    return {
      startDate, endDate, startPrice, endPrice,
      initialShares, finalShares,
      totalDividends,
      totalValue, totalReturn, totalReturnPct,
      priceReturnPct, dividendReturnPct,
      annualizedReturnPct, periodYears,
      reinvested: true,
    };
  }

  // No DRIP: collect dividends as cash
  const sumPerShareDividends = periodicDividends.reduce((sum, d) => sum + d.amount, 0);
  totalDividends = initialShares * sumPerShareDividends;
  finalShares = initialShares;

  const endMarketValue = initialShares * endPrice;
  const totalValue = endMarketValue + totalDividends;
  const totalReturn = totalValue - investmentAmount;
  const totalReturnPct = (totalReturn / investmentAmount) * 100;
  const priceReturnPct = ((endPrice - startPrice) / startPrice) * 100;
  const dividendReturnPct = totalReturnPct - priceReturnPct;
  const periodYears = (endTs - startTs) / (365.25 * 24 * 60 * 60 * 1000);
  const annualizedReturnPct = periodYears > 0
    ? (Math.pow(totalValue / investmentAmount, 1 / periodYears) - 1) * 100
    : 0;

  return {
    startDate, endDate, startPrice, endPrice,
    initialShares, finalShares,
    totalDividends,
    totalValue, totalReturn, totalReturnPct,
    priceReturnPct, dividendReturnPct,
    annualizedReturnPct, periodYears,
    reinvested: false,
  };
}
