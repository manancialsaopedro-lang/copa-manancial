import fs from "fs/promises";
import path from "path";
import { Pool, type PoolConfig } from "pg";

type NeonPoolConfig = PoolConfig & { enableChannelBinding?: boolean };

export function createDatabasePool(connectionString = process.env.DATABASE_URL?.trim()) {
  if (!connectionString) return null;

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    enableChannelBinding: connectionString.includes("channel_binding=require"),
  } as NeonPoolConfig);
}

export async function runMigrations(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      name text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();

  for (const file of files) {
    const id = file.replace(/\.sql$/, "");
    const exists = await pool.query("SELECT 1 FROM schema_migrations WHERE id = $1", [id]);
    if (exists.rowCount) continue;

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf-8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (id, name) VALUES ($1, $2)", [id, file]);
      await client.query("COMMIT");
      console.log(`Applied migration ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
