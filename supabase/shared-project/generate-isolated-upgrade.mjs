import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const thisDirectory = dirname(fileURLToPath(import.meta.url));
const supabaseDirectory = dirname(thisDirectory);
const migrationsDirectory = join(supabaseDirectory, "migrations");
const upgradesDirectory = join(thisDirectory, "upgrades");
const requestedMigration = process.argv[2];

const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (!requestedMigration || !migrationFiles.includes(requestedMigration)) {
  throw new Error(`Usage: npm run generate:shared-upgrade -- <migration.sql>\nAvailable migrations:\n${migrationFiles.join("\n")}`);
}

const source = await readFile(join(migrationsDirectory, requestedMigration), "utf8");
const isolatedMigration = source.replaceAll("public.", "perfectpair.");
const outputPath = join(upgradesDirectory, requestedMigration);
const sql = `-- GENERATED ISOLATED UPGRADE — do not edit by hand.
-- Source migration: ../migrations/${requestedMigration}
-- Regenerate with: npm run generate:shared-upgrade -- ${requestedMigration}
--
-- This is only for an already-installed PerfectPair schema. It does not touch
-- the shared public schema. Do not use the full installer for an upgrade.
begin;

do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'perfectpair') then
    raise exception 'The perfectpair schema is missing. Run the full isolated installer first.';
  end if;
end;
$$;

${isolatedMigration}

commit;
`;

await mkdir(upgradesDirectory, { recursive: true });
await writeFile(outputPath, sql, "utf8");
console.log(`Generated ${outputPath} from ${requestedMigration}.`);
