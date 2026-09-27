/**
 * Minimal in-memory rate limiter.
 *
 * The booking endpoint is public and unauthenticated, so without a limiter one
 * script could exhaust the doctor's entire day of tokens. This is deliberately
 * simple — a fixed-window counter held in process memory, which fits a single
 * server or a low-traffic serverless deployment.
 *
 * Caveat worth knowing: on Vercel each serverless instance has its own memory,
 * so the effective limit is per-instance rather than global. That is still
 * enough to stop a naive script, but if this clinic ever gets real abuse the
 * Map should be swapped for Redis/Upstash. The interface would not change.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/** Drops expired buckets so the Map cannot grow without bound. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count++;
  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter,
  };
}

/**
 * Best-effort client identity. Behind a proxy or CDN the socket address is the
 * proxy's, so prefer the forwarding headers it sets.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

export function tooManyRequests(result: RateLimitResult, message: string) {
  return Response.json(
    { ok: false, error: message },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, result.retryAfter)) },
    },
  );
}
