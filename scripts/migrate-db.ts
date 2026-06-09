import "dotenv/config";
import { createDatabasePool, runMigrations } from "../src/server/db";

const pool = createDatabasePool();

if (!pool) {
  console.error("DATABASE_URL is missing. Add your Neon connection string to .env before running migrations.");
  process.exit(1);
}

try {
  await runMigrations(pool);
  console.log("Database migrations are up to date.");
} finally {
  await pool.end();
}
