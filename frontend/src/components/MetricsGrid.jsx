import { Card, CardContent } from '@/components/ui/card';

function fmt(value, type = 'number') {
  if (value == null || value === undefined) return 'N/A';
  if (type === 'pct') return `${(value * 100).toFixed(2)}%`;
  if (type === 'dollar') {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  }
  if (type === 'ratio') return value.toFixed(2);
  return value.toFixed(2);
}

function getStockMetrics(sd, ks, fd) {
  return [
    { label: 'P/E (TTM)', value: fmt(sd.trailingPE, 'ratio') },
    { label: 'P/E (Forward)', value: fmt(ks.forwardPE, 'ratio') },
    { label: 'P/B Ratio', value: fmt(ks.priceToBook, 'ratio') },
    { label: 'EPS (TTM)', value: ks.trailingEps != null ? `$${ks.trailingEps.toFixed(2)}` : 'N/A' },
    { label: 'Dividend Yield', value: fmt(sd.dividendYield, 'pct') },
    {
      label: '52W Range',
      value:
        sd.fiftyTwoWeekLow != null && sd.fiftyTwoWeekHigh != null
          ? `$${sd.fiftyTwoWeekLow.toFixed(2)} - $${sd.fiftyTwoWeekHigh.toFixed(2)}`
          : 'N/A',
    },
    { label: 'Debt/Equity', value: fmt(fd.debtToEquity, 'ratio'), warn: fd.debtToEquity > 200 },
    { label: 'Free Cash Flow', value: fmt(fd.freeCashflow, 'dollar') },
    { label: 'Revenue Growth', value: fmt(fd.revenueGrowth, 'pct') },
    { label: 'Profit Margin', value: fmt(fd.profitMargins, 'pct') },
  ];
}

function getETFMetrics(sd, ks, fp) {
  const fpExpense = fp?.feesExpensesInvestment?.annualReportExpenseRatio;
  return [
    { label: 'Dividend Yield', value: fmt(sd.yield ?? sd.dividendYield, 'pct'), highlight: true },
    { label: 'Expense Ratio', value: fmt(fpExpense ?? sd.annualReportExpenseRatio ?? sd.expenseRatio, 'pct') },
    { label: 'P/E (TTM)', value: fmt(sd.trailingPE, 'ratio') },
    { label: 'P/E (Forward)', value: fmt(ks.forwardPE, 'ratio') },
    { label: 'Net Assets', value: sd.totalAssets != null ? fmt(sd.totalAssets, 'dollar') : 'N/A' },
    { label: 'Beta (3Y)', value: fmt(ks.beta3Year ?? sd.beta3Year, 'ratio') },
    { label: 'YTD Return', value: fmt(ks.ytdReturn ?? sd.ytdReturn, 'pct') },
    {
      label: '52W Range',
      value:
        sd.fiftyTwoWeekLow != null && sd.fiftyTwoWeekHigh != null
          ? `$${sd.fiftyTwoWeekLow.toFixed(2)} - $${sd.fiftyTwoWeekHigh.toFixed(2)}`
          : 'N/A',
    },
    { label: '50-Day Avg', value: sd.fiftyDayAverage != null ? `$${sd.fiftyDayAverage.toFixed(2)}` : 'N/A' },
    { label: '200-Day Avg', value: sd.twoHundredDayAverage != null ? `$${sd.twoHundredDayAverage.toFixed(2)}` : 'N/A' },
  ];
}

function getBankMetrics(sd, ks, fd) {
  return [
    { label: 'P/E (TTM)', value: fmt(sd.trailingPE, 'ratio') },
    { label: 'P/E (Forward)', value: fmt(ks.forwardPE, 'ratio') },
    { label: 'EPS (TTM)', value: ks.trailingEps != null ? `$${ks.trailingEps.toFixed(2)}` : 'N/A' },
    { label: 'Book Value/Share', value: ks.bookValue != null ? `$${ks.bookValue.toFixed(2)}` : 'N/A' },
    { label: 'P/B Ratio', value: fmt(ks.priceToBook, 'ratio'), warn: ks.priceToBook > 1.8 },
    { label: 'Dividend Yield', value: fmt(sd.dividendYield, 'pct'), highlight: true },
    { label: 'Payout Ratio', value: sd.payoutRatio != null ? `${(sd.payoutRatio * 100).toFixed(0)}%` : 'N/A', warn: sd.payoutRatio > 0.8 },
    { label: 'ROE', value: fmt(fd.returnOnEquity, 'pct'), highlight: fd.returnOnEquity > 0.10 },
    {
      label: '52W Range',
      value:
        sd.fiftyTwoWeekLow != null && sd.fiftyTwoWeekHigh != null
          ? `$${sd.fiftyTwoWeekLow.toFixed(2)} - $${sd.fiftyTwoWeekHigh.toFixed(2)}`
          : 'N/A',
    },
    { label: 'Debt/Equity', value: fmt(fd.debtToEquity, 'ratio') },
    { label: 'Revenue Growth', value: fmt(fd.revenueGrowth, 'pct') },
  ];
}

function getREITMetrics(sd, ks, fd, p) {
  return [
    { label: 'Dividend Yield', value: fmt(sd.dividendYield, 'pct'), highlight: true },
    { label: 'Dividend Rate', value: sd.dividendRate != null ? `$${sd.dividendRate.toFixed(2)}/yr` : 'N/A' },
    { label: 'Payout Ratio', value: sd.payoutRatio != null ? `${(sd.payoutRatio * 100).toFixed(0)}%` : 'N/A', warn: sd.payoutRatio > 1 },
    { label: 'P/B (NAV Proxy)', value: fmt(ks.priceToBook, 'ratio') },
    { label: 'Debt/Equity', value: fmt(fd.debtToEquity, 'ratio'), warn: fd.debtToEquity > 200 },
    {
      label: '52W Range',
      value:
        sd.fiftyTwoWeekLow != null && sd.fiftyTwoWeekHigh != null
          ? `$${sd.fiftyTwoWeekLow.toFixed(2)} - $${sd.fiftyTwoWeekHigh.toFixed(2)}`
          : 'N/A',
    },
    { label: '50-Day Avg', value: sd.fiftyDayAverage != null ? `$${sd.fiftyDayAverage.toFixed(2)}` : 'N/A' },
    { label: '200-Day Avg', value: sd.twoHundredDayAverage != null ? `$${sd.twoHundredDayAverage.toFixed(2)}` : 'N/A' },
    { label: 'Revenue Growth', value: fmt(fd.revenueGrowth, 'pct') },
    { label: 'Profit Margin', value: fmt(fd.profitMargins, 'pct') },
  ];
}

export default function MetricsGrid({ data }) {
  const sd = data?.summaryDetail || {};
  const ks = data?.defaultKeyStatistics || {};
  const fd = data?.financialData || {};
  const p = data?.price || {};
  const assetType = data?.assetType || 'stock';

  const fp = data?.fundProfile || {};

  const metrics = assetType === 'etf'
    ? getETFMetrics(sd, ks, fp)
    : assetType === 'reit'
      ? getREITMetrics(sd, ks, fd, p)
      : assetType === 'bank'
        ? getBankMetrics(sd, ks, fd)
        : getStockMetrics(sd, ks, fd);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {m.label}
            </div>
            <div className={`text-lg font-bold ${m.warn ? 'text-red-500' : m.highlight ? 'text-green-500' : 'text-foreground'}`}>
              {m.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
