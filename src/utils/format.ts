/** Indian grouping, e.g. 1,240 — used for question counts. */
export function count(n: number): string {
  return n.toLocaleString('en-IN');
}

/** 1 -> "1st". Used for the question counter. */
export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function signed(n: number, digits = 2): string {
  const rounded = Number(n.toFixed(digits));
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

export function percent(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

const DIVISORS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'second', seconds: 1 },
  { unit: 'minute', seconds: 60 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'day', seconds: 86400 },
  { unit: 'week', seconds: 604800 },
  { unit: 'month', seconds: 2629800 },
  { unit: 'year', seconds: 31557600 },
];

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "3 minutes ago" / "yesterday". */
export function relativeTime(epoch: number): string {
  const seconds = Math.round((epoch - Date.now()) / 1000);
  const magnitude = Math.abs(seconds);

  for (const { unit, seconds: size } of DIVISORS) {
    if (magnitude < size * (unit === 'second' ? 60 : 1) && unit !== 'year') {
      return rtf.format(Math.round(seconds / size), unit);
    }
  }
  return rtf.format(Math.round(seconds / 31557600), 'year');
}

export function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Strips $...$ so a manifest preview can be shown as plain text. */
export function stripMath(input: string): string {
  return input
    .replace(/\$\$[\s\S]+?\$\$/g, ' ')
    .replace(/\$[^$\n]+?\$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
