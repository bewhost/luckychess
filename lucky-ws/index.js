import express from "express";
import cors from "cors";
import { pool, pingDB } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Puerto asignado por Render
const PORT = process.env.PORT || 8080;

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// Comprobar conexión a DB
app.get("/db-time", async (req, res) => {
  try {
    const t = await pingDB();
    res.json({ ok: true, time: t.now });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Ejemplo: lista de partidas (ajustá al nombre real de tu tabla)
app.get("/games", async (req, res) => {
  try {
    const { rows } = await pool.query("select * from games order by id desc limit 50");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ejemplo: crear partida (ajustá columnas)
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

app.listen(PORT, () => {
  console.log(`WS up on :${PORT}`);
});
