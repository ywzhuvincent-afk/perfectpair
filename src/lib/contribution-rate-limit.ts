type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const windowMs = 60 * 60 * 1000;
const maximumPerWindow = 8;

/** Best-effort instance guard for an anonymous, privacy-preserving form. A
 * production deployment should also apply an edge/WAF rate limit or Turnstile.
 * IP addresses are never written to the database or analytics records here. */
export function acceptContributionFrom(address: string, now = Date.now()) {
  const current = buckets.get(address);
  if (!current || current.resetAt <= now) {
    buckets.set(address, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= maximumPerWindow) return false;
  current.count += 1;
  return true;
}
