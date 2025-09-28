import { Pool } from "pg";

const {
  DB_HOST = "db.atikgycpnvdqlxdmozqf.supabase.co",
  DB_PORT = "5432",
  DB_NAME = "postgres",
  DB_USER = "postgres",
  DB_PASSWORD = "ytOGuvXQXhr1u94P",
} = process.env;

export const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export async function pingDB() {
  const { rows } = await pool.query("select now()");
  return rows[0];
}
