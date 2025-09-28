// server.js (ESM)
import express from "express";
import { pingDB } from "./db.js";

const app = express();

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/db-time", async (_req, res) => {
  try {
    const row = await pingDB();
    res.json({ ok: true, time: row.now });
  } catch (e) {
    console.error("[/db-time] error:", e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Listening on", PORT));
