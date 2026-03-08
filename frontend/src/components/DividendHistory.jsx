import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const GRADE_CONFIG = {
  'A+': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'A':  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'B+': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'B':  'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'C':  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'D':  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'F':  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function DividendHistory({ dividendInfo }) {
  if (!dividendInfo) return null;

  const { annualDividends, grade, consecutiveIncreaseStreak, growthRate } = dividendInfo;
  const recent = annualDividends.slice(-10);

  return (
    <Card className="mb-5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">Dividend History</h2>
          <Badge className={`text-base px-3 py-1 ${GRADE_CONFIG[grade] || GRADE_CONFIG['C']}`}>
            {grade}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <StatCard label="Increase Streak" value={`${consecutiveIncreaseStreak} yr`} />
          <StatCard label="Dividend CAGR" value={`${growthRate > 0 ? '+' : ''}${growthRate}%`} />
          <StatCard label="Years of Data" value={`${annualDividends.length}`} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Year</th>
                <th className="text-right py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Annual Dividend</th>
                <th className="text-right py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Change</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((d, i) => {
                const prev = i > 0 ? recent[i - 1].total : null;
                const change = prev ? ((d.total - prev) / prev) * 100 : null;
                return (
                  <tr key={d.year} className="border-b border-border/50">
                    <td className="py-2 text-foreground font-medium">{d.year}</td>
                    <td className="py-2 text-right text-foreground">${d.total.toFixed(4)}</td>
                    <td className={`py-2 text-right font-medium ${change == null ? 'text-muted-foreground' : change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}
