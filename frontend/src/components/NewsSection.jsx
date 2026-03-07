import { Newspaper, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const publishedMs = typeof timestamp === 'number' && timestamp < 1e12
    ? timestamp * 1000
    : new Date(timestamp).getTime();
  const diffSeconds = Math.floor((now - publishedMs) / 1000);

  if (diffSeconds < 60) return 'just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function NewsSection({ news }) {
  if (!news || news.length === 0) return null;

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="size-4 text-muted-foreground" />
          Recent News
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {news.slice(0, 3).map((item, index) => (
            <li key={item.link || index}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0 -mx-1 px-1 rounded-md transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.publisher}
                    {item.publishedAt && (
                      <>
                        <span className="mx-1.5">&middot;</span>
                        {formatRelativeTime(item.publishedAt)}
                      </>
                    )}
                  </p>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
