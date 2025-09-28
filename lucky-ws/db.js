import { Pool } from "pg";

// Lee la cadena completa desde Render (Environment -> DATABASE_URL)
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // fuerza SSL para Supabase
});

// Test rápido en el arranque (opcional)
export async function pingDB() {
  const { rows } = await pool.query("select now()");
  return rows[0];
}
