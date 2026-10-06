/**
 * Best-effort, in-memory rate limiting for the API routes. Each serverless
 * instance keeps its own counters, so this caps bursts and runaway loops
 * rather than enforcing an exact global quota. Swap for Upstash or Vercel KV
 * if traffic ever makes that matter. For /api/ask, the real spend cap lives in
 * the Anthropic Console.
 */
export function createRateLimiter({
  limit,
  windowMs,
  dailyCap,
}: {
  limit: number;
  windowMs: number;
  dailyCap: number;
}) {
  const visitors = new Map<string, number[]>();
  let day = "";
  let dayCount = 0;

  return function check(key: string): { ok: true } | { ok: false; retryAfter: number } {
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      dayCount = 0;
      visitors.clear();
    }
    if (dayCount >= dailyCap) return { ok: false, retryAfter: 3600 };

    const recent = (visitors.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
    }
    recent.push(now);
    visitors.set(key, recent);
    dayCount++;
    return { ok: true };
  };
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
