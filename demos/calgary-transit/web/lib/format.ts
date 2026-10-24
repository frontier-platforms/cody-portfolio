const compact = new Intl.NumberFormat("en-CA", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 });

export function fmtCompact(n: number | null | undefined): string {
  return n === null || n === undefined ? "–" : compact.format(n);
}

export function fmtNumber(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined) return "–";
  return digits === 0 ? whole.format(n) : n.toLocaleString("en-CA", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function fmtPct(n: number | null | undefined, digits = 0): string {
  return n === null || n === undefined ? "–" : `${fmtNumber(n, digits)}%`;
}

export function fmtMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-CA", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}
