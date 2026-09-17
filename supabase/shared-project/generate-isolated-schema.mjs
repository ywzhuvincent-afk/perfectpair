import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const thisDirectory = dirname(fileURLToPath(import.meta.url));
const supabaseDirectory = dirname(thisDirectory);
const migrationsDirectory = join(supabaseDirectory, "migrations");
const outputPath = join(thisDirectory, "perfectpair-isolated-schema.sql");

const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (migrationFiles.length === 0) {
  throw new Error("No PerfectPair migrations were found.");
}

const migrations = await Promise.all(
  migrationFiles.map(async (file) => {
    const source = await readFile(join(migrationsDirectory, file), "utf8");
    return `\n-- BEGIN ${file}\n${source.replaceAll("public.", "perfectpair.")}\n-- END ${file}\n`;
  }),
);

const sql = `-- GENERATED FILE — do not edit by hand.
-- Regenerate with: npm run generate:shared-schema
--
-- This installer is for the existing shared madeshed Supabase project only.
-- It creates a fully isolated PerfectPair schema without changing public.
begin;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'perfectpair') then
    raise exception 'The perfectpair schema already exists. Stop rather than mixing a second deployment into it.';
  end if;
end;
$$;

create schema perfectpair;
revoke all on schema perfectpair from public;
${migrations.join("\n")}

-- The Data API may address this schema only after it is explicitly exposed in
-- Supabase Project Settings > API. RLS remains the access-control boundary.
grant usage on schema perfectpair to anon, authenticated, service_role;
grant select on all tables in schema perfectpair to anon;
grant select, insert, update, delete on all tables in schema perfectpair to authenticated;
grant all privileges on all tables in schema perfectpair to service_role;
grant usage, select on all sequences in schema perfectpair to anon, authenticated, service_role;

alter default privileges in schema perfectpair grant select on tables to anon;
alter default privileges in schema perfectpair grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema perfectpair grant all privileges on tables to service_role;
alter default privileges in schema perfectpair grant usage, select on sequences to anon, authenticated, service_role;

commit;
`;

await mkdir(thisDirectory, { recursive: true });
await writeFile(outputPath, sql, "utf8");
console.log(`Generated ${outputPath} from ${migrationFiles.length} migrations.`);
