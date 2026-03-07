import { Card, CardContent } from '@/components/ui/card';

function formatMarketCap(n) {
  if (n == null) return 'N/A';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export default function StockHeader({ data }) {
  const p = data?.price || {};
  const sp = data?.summaryProfile || {};

  const change = p.regularMarketChange ?? 0;
  const changePct = p.regularMarketChangePercent ?? 0;
  const isPositive = change >= 0;

  return (
    <Card className="mb-5">
      <CardContent className="flex justify-between items-start pt-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {p.shortName || p.longName || 'Unknown'}{' '}
            <span className="font-normal text-muted-foreground">({p.symbol})</span>
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            {sp.sector && <span>{sp.sector}</span>}
            {sp.industry && <span> &middot; {sp.industry}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground">
            ${p.regularMarketPrice?.toFixed(2) ?? 'N/A'}{' '}
            <span className="text-sm font-normal text-muted-foreground">{p.currency || 'USD'}</span>
          </div>
          <div className={`text-base font-semibold mt-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}
            {change.toFixed(2)} ({isPositive ? '+' : ''}
            {(changePct * 100).toFixed(2)}%)
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Mkt Cap: {formatMarketCap(p.marketCap)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
