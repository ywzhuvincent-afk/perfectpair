type Bucket = { count: number; resetAt: number };
type SubmissionChannel = "contribution" | "review";

const buckets = new Map<string, Bucket>();
const windowMs = 60 * 60 * 1000;
const limits: Record<SubmissionChannel, number> = { contribution: 8, review: 5 };

function acceptPublicSubmissionFrom(address: string, channel: SubmissionChannel, now = Date.now()) {
  const key = `${channel}:${address}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limits[channel]) return false;
  current.count += 1;
  return true;
}

/** Best-effort instance guard for an anonymous, privacy-preserving form. A
 * production deployment should also apply an edge/WAF rate limit or Turnstile.
 * IP addresses are never written to the database or analytics records here. */
export function acceptContributionFrom(address: string, now = Date.now()) {
  return acceptPublicSubmissionFrom(address, "contribution", now);
}

/** Reviews receive their own, stricter anonymous bucket. This is deliberately
 * only an in-memory first line of defence: the address never reaches storage. */
export function acceptReviewFrom(address: string, now = Date.now()) {
  return acceptPublicSubmissionFrom(address, "review", now);
}
