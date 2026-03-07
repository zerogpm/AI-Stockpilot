import { Clock, ArrowRight, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const EXAMPLE_TICKERS = ['AAPL', 'MSFT', 'BRK-B', 'O', 'VTI'];

export default function RecentStocks({ symbols, onSelect, onClear }) {
  if (!symbols.length) {
    return (
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Try searching for a ticker to get started
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLE_TICKERS.map((sym) => (
            <Button
              key={sym}
              variant="secondary"
              size="sm"
              onClick={() => onSelect(sym)}
              className="text-xs"
            >
              {sym}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="size-3" />
          Recent
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="size-3 mr-1" />
          Clear
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {symbols.map((sym, index) => (
            <button
              key={sym}
              onClick={() => onSelect(sym)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors group cursor-pointer ${
                index < symbols.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-md bg-muted group-hover:bg-accent transition-colors">
                  <TrendingUp className="size-4 text-muted-foreground" />
                </div>
                <span className="font-semibold text-foreground">{sym}</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
