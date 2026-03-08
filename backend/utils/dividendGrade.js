export function calculateDividendGrade(dividendEvents) {
  if (!dividendEvents || dividendEvents.length === 0) {
    return null;
  }

  // Group by year: sum totals and count payments
  const byYear = {};
  const paymentCounts = {};
  for (const evt of dividendEvents) {
    const year = new Date(evt.date).getFullYear();
    byYear[year] = (byYear[year] || 0) + evt.amount;
    paymentCounts[year] = (paymentCounts[year] || 0) + 1;
  }

  const currentYear = new Date().getFullYear();

  // Determine expected payment frequency (mode of counts, excluding current year)
  const pastCounts = Object.entries(paymentCounts)
    .filter(([y]) => Number(y) < currentYear)
    .map(([, c]) => c);
  const expectedFreq = pastCounts.length > 0 ? mode(pastCounts) : 1;

  // Exclude current year AND any year with fewer payments than expected (partial/shifted years)
  const years = Object.keys(byYear)
    .map(Number)
    .filter((y) => y < currentYear && paymentCounts[y] >= expectedFreq)
    .sort((a, b) => a - b);

  if (years.length === 0) {
    return null;
  }

  const annualDividends = years.map((y) => ({
    year: y,
    total: Math.round(byYear[y] * 10000) / 10000,
  }));

  // Calculate consecutive increase streak (from most recent going back)
  let consecutiveIncreaseStreak = 0;
  for (let i = annualDividends.length - 1; i > 0; i--) {
    if (annualDividends[i].total > annualDividends[i - 1].total) {
      consecutiveIncreaseStreak++;
    } else {
      break;
    }
  }

  // CAGR from oldest to newest
  const oldest = annualDividends[0].total;
  const newest = annualDividends[annualDividends.length - 1].total;
  const numYears = annualDividends.length - 1;
  const growthRate =
    numYears > 0 && oldest > 0
      ? ((newest / oldest) ** (1 / numYears) - 1) * 100
      : 0;

  // Check for cuts and suspensions
  let hasAnyCuts = false;
  let recentCut = false;
  for (let i = 1; i < annualDividends.length; i++) {
    if (annualDividends[i].total < annualDividends[i - 1].total * 0.98) {
      hasAnyCuts = true;
      if (annualDividends[i].year >= currentYear - 2) {
        recentCut = true;
      }
    }
  }

  // Check for gaps — a year with NO payments at all (not just fewer than expected)
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  let hasSuspension = false;
  for (let y = firstYear + 1; y <= lastYear; y++) {
    if (!paymentCounts[y] || paymentCounts[y] === 0) {
      hasSuspension = true;
      break;
    }
  }

  // Assign grade
  let grade;
  if (hasSuspension) {
    grade = 'F';
  } else if (recentCut) {
    grade = 'D';
  } else if (consecutiveIncreaseStreak >= 10) {
    grade = 'A+';
  } else if (consecutiveIncreaseStreak >= 5 && !hasAnyCuts) {
    grade = 'A';
  } else if (consecutiveIncreaseStreak >= 3) {
    grade = 'B+';
  } else if (!hasAnyCuts) {
    grade = 'B';
  } else {
    grade = 'C';
  }

  return {
    annualDividends,
    grade,
    consecutiveIncreaseStreak,
    growthRate: Math.round(growthRate * 100) / 100,
  };
}

function mode(arr) {
  const freq = {};
  for (const v of arr) freq[v] = (freq[v] || 0) + 1;
  let maxCount = 0;
  let maxVal = arr[0];
  for (const [val, count] of Object.entries(freq)) {
    if (count > maxCount) {
      maxCount = count;
      maxVal = Number(val);
    }
  }
  return maxVal;
}
