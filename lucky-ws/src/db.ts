import { Pool } from 'pg';
import type { Room, Color, Phase } from './types.js';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) throw new Error('DATABASE_URL no seteado');

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10
});

export async function createRoom(creator_user_id: string): Promise<Room> {
  const q = `
    insert into public.rooms (creator_user_id, phase)
    values ($1, 'rolling')
    returning *;
  `;
  const { rows } = await pool.query(q, [creator_user_id]);
  return normalize(rows[0]);
}

export async function getRoom(id: string): Promise<Room | null> {
  const { rows } = await pool.query(`select * from public.rooms where id = $1`, [id]);
  return rows[0] ? normalize(rows[0]) : null;
}

export async function joinRoom(id: string, user_id: string, color?: Color): Promise<Room | null> {
  const room = await getRoom(id);
  if (!room) return null;

  let white_id = room.white_id;
  let black_id = room.black_id;

  if (color === 'white') white_id = white_id ?? user_id;
  else if (color === 'black') black_id = black_id ?? user_id;
  else {
    // auto-asignación
    if (!white_id) white_id = user_id;
    else if (!black_id) black_id = user_id;
  }

  const { rows } = await pool.query(
    `update public.rooms
       set white_id=$2, black_id=$3
     where id=$1
     returning *`,
    [id, white_id, black_id]
  );
  return normalize(rows[0]);
}

export async function saveDice(
  id: string,
  dice_white: number,
  dice_black: number,
  nextPhase: Phase,
  nextTurn: Color | null
): Promise<Room | null> {
  const { rows } = await pool.query(
    `update public.rooms
       set dice_white=$2,
           dice_black=$3,
           phase=$4,
           current_turn=$5
     where id=$1
     returning *`,
    [id, dice_white, dice_black, nextPhase, nextTurn]
  );
  return normalize(rows[0]);
}

export async function appendMove(id: string, uci: string, nextPhase: Phase, nextTurn: Color): Promise<Room | null> {
  const { rows } = await pool.query(
    `update public.rooms
       set moves = moves || to_jsonb($2::text),
           phase = $3,
           current_turn = $4
     where id=$1
     returning *`,
    [id, uci, nextPhase, nextTurn]
  );
  return normalize(rows[0]);
}

function normalize(row: any): Room {
  return {
    id: String(row.id),
    created_at: row.created_at?.toISOString?.() ?? String(row.created_at),
    creator_user_id: row.creator_user_id ?? null,
    white_id: row.white_id ?? null,
    black_id: row.black_id ?? null,
    phase: row.phase,
    current_turn: row.current_turn,
    dice_white: row.dice_white,
    dice_black: row.dice_black,
    moves: Array.isArray(row.moves) ? row.moves : []
  };
}
