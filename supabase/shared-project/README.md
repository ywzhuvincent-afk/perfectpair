# PerfectPair shared-project database deployment

The `madeshed` Supabase project already contains other products in its
`public` schema. Do **not** run `supabase db push` against that project.

Instead, run `npm run generate:shared-schema`, then execute the generated
`perfectpair-isolated-schema.sql` once in the Supabase SQL Editor. The script:

- creates the dedicated `perfectpair` schema in one transaction;
- rewrites all PerfectPair migrations so no table, type, function, policy, or
  trigger is added to `public`;
- applies RLS and grants only the minimal API role access; and
- stops before making any change if `perfectpair` already exists.

After it succeeds, add `perfectpair` to the project's **API > Exposed schemas**
setting. Keep the service-role key server-only in `.env.local` and in the
deployment provider's encrypted environment settings.

## Applying a later PerfectPair migration

The full installer intentionally stops when `perfectpair` already exists. Do
**not** rerun it for an upgrade and do not use `supabase db push` on the shared
project. Generate an isolated upgrade from the specific new migration instead:

```powershell
npm run generate:shared-upgrade -- 202609170002_fit_network_lower_body_and_handoff.sql
```

Run the resulting file in the Supabase SQL Editor:

```text
supabase/shared-project/upgrades/202609170002_fit_network_lower_body_and_handoff.sql
```

It verifies that the `perfectpair` schema already exists, runs in one
transaction, and rewrites every PerfectPair `public.` reference to
`perfectpair.`. The generated upgrade never changes the shared `public`
schema.
