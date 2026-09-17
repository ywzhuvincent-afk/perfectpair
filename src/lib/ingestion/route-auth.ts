import type { NextRequest } from "next/server";

/** A cron user-agent is descriptive, not authentication. Production execution
 * requires the secret Vercel sends in the Authorization header. */
export function isAuthorizedIngestionRequest(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${expectedSecret}`;
}
