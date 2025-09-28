// src/db.ts (o donde crees el Pool)
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,  // <<— clave para evitar el error del cert self-signed
  },
});

