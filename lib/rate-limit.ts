type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function bucketFor(key: string, windowMs: number, now: number) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const created = { count: 0, resetAt: now + windowMs };
    buckets.set(key, created);
    return created;
  }
  return current;
}

export function isRateLimited(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) return false;
  return current.count >= limit;
}

export function recordAttempt(key: string, windowMs: number, now = Date.now()) {
  const current = bucketFor(key, windowMs, now);
  current.count += 1;
  if (buckets.size > 5000) {
    for (const [stored, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(stored);
    }
  }
}

export function clientIp(headerStore: { get(name: string): string | null }) {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerStore.get("x-real-ip")?.trim() || "unknown";
}

export const LOGIN_ATTEMPT_LIMIT = 8;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const REGISTER_ATTEMPT_LIMIT = 5;
export const REGISTER_WINDOW_MS = 60 * 60 * 1000;
