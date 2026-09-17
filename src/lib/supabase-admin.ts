import { createClient } from "@supabase/supabase-js";

// PerfectPair is intentionally isolated inside the shared Supabase project.
// Do not change this to `public`: that schema belongs to the other products
// hosted in the same project.
const perfectPairSchema = "perfectpair";

/** Service-role access is server-only. The browser never receives this key.
 * Local development intentionally works without it; production rejects writes
 * instead of pretending a user contribution was permanently saved. */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: perfectPairSchema },
  });
}
