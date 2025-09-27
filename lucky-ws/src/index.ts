import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { initGameNamespace } from './game.js';

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.send({ ok: true, service: 'Lucky WS', uptime: process.uptime() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN.length ? CORS_ORIGIN : true,
    credentials: true
  }
});

initGameNamespace(io);

server.listen(PORT, () => {
  console.log(`✅ Lucky WS escuchando en :${PORT}`);
  if (CORS_ORIGIN.length) console.log(`CORS permitido: ${CORS_ORIGIN.join(', ')}`);
});
