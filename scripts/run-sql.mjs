#!/usr/bin/env node
// Runs an arbitrary .sql file against DATABASE_URL. Intended for one-off
// admin/maintenance queries during development — regular schema changes
// belong in supabase/migrations/*.sql, not here.
//
// Usage: node scripts/run-sql.mjs path/to/file.sql

import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import pg from "pg";

config({ path: ".env.local" });

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node scripts/run-sql.mjs path/to/file.sql");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL in the environment (.env.local).");
  process.exit(1);
}

async function main() {
  const sql = await readFile(filePath, "utf8");
  const client = new pg.Client({ connectionString });

  await client.connect();
  try {
    const result = await client.query(sql);
    const rows = Array.isArray(result) ? result.at(-1)?.rows : result.rows;
    if (rows?.length) {
      console.table(rows);
    } else {
      console.log("OK");
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
