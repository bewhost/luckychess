import express from "express";
import cors from "cors";
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first"); // evita IPv6

import { pool, pingDB } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.get("/health", (req, res) => res.json({ ok: true }));

// DEBUG: ver qué vars está usando el contenedor
app.get("/db-debug", (req, res) => {
  res.json({
    host: process.env.DB_HOST || "db.atikgycpnvdqlxdmozqf.supabase.co",
    port: process.env.DB_PORT || "5432",
    user: process.env.DB_USER || "postgres",
    hasPassword: Boolean(process.env.DB_PASSWORD),
    ipv4first: true,
    node: process.version,
  });
});

app.get("/db-time", async (req, res) => {
  try {
    const t = await pingDB();
    res.json({ ok: true, time: t.now });
  } catch (e) {
    console.error("db-time error:", e);
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

app.get("/games", async (_req, res) => {
  try {
    const { rows } = await pool.query("select * from games order by id desc limit 50");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/games", async (req, res) => {
  try {
    const { player_white, player_black } = req.body;
    const { rows } = await pool.query(
      "insert into games (player_white, player_black) values ($1,$2) returning *",
      [player_white, player_black]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`WS up on :${PORT}`));
