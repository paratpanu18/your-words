import { getRateLimitSettings } from "./queries";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) {
    return false;
  }
  bucket.count++;
  return true;
}

/**
 * Message-send limiter, governed by the admin-configurable settings
 * (off by default). Auth endpoints (login/setup/join) keep their own
 * fixed limits since they guard against brute force.
 */
export function sendMessageRateLimit(request: Request): boolean {
  const settings = getRateLimitSettings();
  if (!settings.enabled) return true;
  return rateLimit(
    `send:${clientIp(request)}`,
    settings.limit,
    settings.windowMs,
  );
}

export function clientIp(request: Request): string {
  // Behind a reverse proxy (nginx proxy manager), X-Real-IP holds the real
  // client address set by the trusted proxy.
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    // Proxies append to this header; the last entry is the one our trusted
    // proxy added. Earlier entries are client-controlled and spoofable.
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "unknown";
}

// Periodically drop stale buckets so the map does not grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref?.();
