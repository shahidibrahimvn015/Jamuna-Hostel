/**
 * Deletes storage files that no database row points at any more.
 *
 * Storage cleanup on delete/replace only shipped partway through the project's
 * life, so every rep photo, notice poster and bill removed before then is still
 * sitting in its bucket, invisible and unreferenced. This finds those and, when
 * asked, removes them.
 *
 * Dry run (default -- lists what WOULD be deleted, changes nothing):
 *   node scripts/purge-orphan-storage.mjs
 *
 * Actually delete:
 *   node scripts/purge-orphan-storage.mjs --delete
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * Uses the service-role key because it must see every row and every object.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DELETE = process.argv.includes("--delete");

function loadEnv() {
  const env = {};
  let raw;
  try {
    raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    console.error("Could not read .env.local next to package.json.");
    process.exit(1);
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local."
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Storage list() returns one directory level at a time, and marks folders by
 * giving them a null id. Bills are nested {portfolio}/{item}/{uuid}.pdf, so
 * this has to walk rather than take a single listing.
 */
async function listAllObjects(bucket, prefix = "") {
  const found = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: 100, offset });

    if (error) throw new Error(`${bucket}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        found.push(...(await listAllObjects(bucket, path)));
      } else {
        found.push(path);
      }
    }

    if (data.length < 100) break;
    offset += data.length;
  }

  return found;
}

// Supabase creates .emptyFolderPlaceholder itself so an otherwise-empty folder
// still shows in the dashboard. It is platform bookkeeping, never something the
// app uploaded, so it must not be counted as an orphan or deleted.
const PLATFORM_FILES = new Set([".emptyFolderPlaceholder"]);

function isPlatformFile(path) {
  return PLATFORM_FILES.has(path.split("/").pop());
}

async function referencedPaths(table, column) {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .not(column, "is", null);

  if (error) throw new Error(`${table}.${column}: ${error.message}`);
  return new Set((data ?? []).map((row) => row[column]).filter(Boolean));
}

const TARGETS = [
  { bucket: "rep-photos", table: "hostel_reps", column: "photo_path" },
  { bucket: "notice-posters", table: "notices", column: "poster_path" },
  { bucket: "bills", table: "budget_items", column: "bill_path" },
];

let totalOrphans = 0;
let totalDeleted = 0;

for (const { bucket, table, column } of TARGETS) {
  console.log(`\n=== ${bucket} ===`);

  let objects;
  try {
    objects = await listAllObjects(bucket);
  } catch (e) {
    console.log(`  skipped: ${e.message}`);
    continue;
  }

  const referenced = await referencedPaths(table, column);
  const appFiles = objects.filter((p) => !isPlatformFile(p));
  const orphans = appFiles.filter((p) => !referenced.has(p));

  console.log(
    `  ${appFiles.length} app file(s) in bucket, ${referenced.size} referenced by ${table}.${column}` +
      (objects.length - appFiles.length > 0
        ? ` (${objects.length - appFiles.length} platform placeholder(s) ignored)`
        : "")
  );

  if (orphans.length === 0) {
    console.log("  no orphans");
    continue;
  }

  totalOrphans += orphans.length;
  console.log(`  ${orphans.length} orphan(s):`);
  for (const p of orphans) console.log(`    ${p}`);

  if (!DELETE) continue;

  // remove() caps at 1000 paths per call.
  for (let i = 0; i < orphans.length; i += 1000) {
    const batch = orphans.slice(i, i + 1000);
    const { error } = await supabase.storage.from(bucket).remove(batch);
    if (error) {
      console.log(`  DELETE FAILED: ${error.message}`);
    } else {
      totalDeleted += batch.length;
      console.log(`  deleted ${batch.length} file(s)`);
    }
  }
}

console.log(
  `\n${totalOrphans} orphan(s) found, ${totalDeleted} deleted.` +
    (DELETE ? "" : "\nDry run -- nothing was changed. Re-run with --delete to remove them.")
);
