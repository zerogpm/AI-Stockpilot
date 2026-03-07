export function calculateREITMetrics(fundamentalsData) {
  if (!fundamentalsData || fundamentalsData.length === 0) {
    return null;
  }

  // Use the most recent annual period
  const latest = fundamentalsData[fundamentalsData.length - 1];

  const netIncome = latest.netIncome;
  const depreciation = latest.depreciationAndAmortization;
  const shares = latest.dilutedAverageShares;
  const dividendsPaid = latest.commonStockDividendPaid ?? latest.cashDividendsPaid;

  // FFO = Net Income + Depreciation & Amortization + Impairment Charges
  if (netIncome == null || depreciation == null) {
    return null;
  }

  const impairment = latest.assetImpairmentCharge ?? 0;
  const ffo = netIncome + depreciation + impairment;

  const result = { ffo };

  if (shares) {
    result.ffoPerShare = ffo / shares;
  }

  if (dividendsPaid != null && ffo > 0) {
    result.ffoPayoutRatio = Math.abs(dividendsPaid) / ffo;
  }

  return result;
}
