// db.js (ESM)
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[DB] Falta DATABASE_URL en las env de Render");
  throw new Error("DATABASE_URL not set");
}
console.log("[DB] Using DATABASE_URL host:", new URL(connectionString).host);

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // necesario en Supabase (pooler)
});

export async function pingDB() {
  const { rows } = await pool.query("select now()");
  return rows[0];
}
