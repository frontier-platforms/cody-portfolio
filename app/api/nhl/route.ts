import { clientIp, createRateLimiter } from "@/lib/lab/rate-limit";

/**
 * Read-only proxy for the NHL's public API, which doesn't send CORS headers.
 * It exists so the Flames pipeline can run live in the browser. Only two
 * path shapes are allowed (the Flames schedule and a game's play-by-play),
 * responses are cached at the edge, and each visitor is rate limited.
 */
const UPSTREAM = "https://api-web.nhle.com/v1";

const ALLOWED: { pattern: RegExp; maxAge: number }[] = [
  { pattern: /^club-schedule-season\/CGY\/\d{8}$/, maxAge: 600 },
  // A finished game's play-by-play never changes.
  { pattern: /^gamecenter\/\d{10}\/play-by-play$/, maxAge: 86_400 },
];

const limit = createRateLimiter({ limit: 60, windowMs: 10 * 60 * 1000, dailyCap: 5_000 });

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  const rule = ALLOWED.find((r) => r.pattern.test(path));
  if (!rule) return Response.json({ error: "Path not allowed." }, { status: 400 });

  const allowed = limit(clientIp(request));
  if (!allowed.ok) {
    return Response.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  const upstream = await fetch(`${UPSTREAM}/${path}`, { next: { revalidate: rule.maxAge } });
  if (!upstream.ok) return Response.json({ error: `Upstream ${upstream.status}` }, { status: 502 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, s-maxage=${rule.maxAge}, stale-while-revalidate=${rule.maxAge * 6}`,
    },
  });
}
