export function buildPeerPromptSection(pc) {
  const { target, peers, medians } = pc;
  const fmtVal = (v, isPct) => {
    if (v == null) return 'N/A';
    return isPct ? `${(v * 100).toFixed(1)}%` : v.toFixed(2);
  };
  const relative = (val, med, lowerIsBetter) => {
    if (val == null || med == null) return 'N/A';
    const diff = ((val - med) / med) * 100;
    if (Math.abs(diff) < 5) return 'In-line';
    if (lowerIsBetter) return diff < 0 ? 'Favorable' : 'Elevated';
    return diff > 0 ? 'Favorable' : 'Below peers';
  };

  const metrics = [
    { label: 'Trailing P/E', key: 'trailingPE', pct: false, lowerBetter: true },
    { label: 'Forward P/E', key: 'forwardPE', pct: false, lowerBetter: true },
    { label: 'Revenue Growth', key: 'revenueGrowth', pct: true, lowerBetter: false },
    { label: 'Profit Margin', key: 'profitMargin', pct: true, lowerBetter: false },
    { label: 'Debt/Equity', key: 'debtToEquity', pct: false, lowerBetter: true },
    { label: 'Dividend Yield', key: 'dividendYield', pct: true, lowerBetter: false },
  ];

  const rows = metrics.map((m) =>
    `| ${m.label} | ${fmtVal(target[m.key], m.pct)} | ${fmtVal(medians[m.key], m.pct)} | ${relative(target[m.key], medians[m.key], m.lowerBetter)} |`
  ).join('\n');

  const peerNames = peers.map((p) => `${p.symbol} (${p.name})`).join(', ');

  return `
## Peer Comparison Context
| Metric | ${target.symbol} | Peer Median | Relative |
|--------|------|-------------|----------|
${rows}

Peers: ${peerNames}

When assessing valuation, comment on how this stock's P/E and growth metrics compare to its peer group median. If trading at a premium or discount to peers, explain whether this is justified by fundamentals.
`;
}
