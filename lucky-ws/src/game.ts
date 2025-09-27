import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { verifySupabaseToken } from './auth.js';
import { appendMove, createRoom, getRoom, joinRoom, saveDice } from './db.js';
import type { Color } from './types.js';

type AuthedSocket = Socket & { user?: { id: string; email?: string } };

const CreateRoomSchema = z.object({});
const JoinRoomSchema = z.object({
  roomId: z.string().uuid(),
  asColor: z.enum(['white', 'black']).optional()
});
const RollDiceSchema = z.object({ roomId: z.string().uuid() });
const MoveSchema = z.object({
  roomId: z.string().uuid(),
  uci: z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/i)
});

/** Lógica simple del juego por dados (una ronda a la vez) */
function compareDice(w: number, b: number) {
  if (w > b) return 'white' as Color;
  if (b > w) return 'black' as Color;
  return null; // empate
}

export function initGameNamespace(io: Server) {
  const nsp = io.of('/game');

  nsp.use(async (socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || typeof token !== 'string') throw new Error('Falta token');
      const payload = await verifySupabaseToken(token);
      socket.user = { id: payload.sub!, email: payload.email as string | undefined };
      next();
    } catch (err) {
      next(err as any);
    }
  });

  nsp.on('connection', (socket: AuthedSocket) => {
    const userId = socket.user!.id;

    socket.on('create_room', async (_payload, cb) => {
      try {
        CreateRoomSchema.parse(_payload ?? {});
        const room = await createRoom(userId);
        socket.join(room.id);
        cb?.({ ok: true, room });
        nsp.to(room.id).emit('room_state', room);
      } catch (e: any) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('join_room', async (payload, cb) => {
      try {
        const { roomId, asColor } = JoinRoomSchema.parse(payload);
        const room = await joinRoom(roomId, userId, asColor as Color | undefined);
        if (!room) throw new Error('Sala inexistente');
        socket.join(room.id);
        cb?.({ ok: true, room });
        nsp.to(room.id).emit('room_state', room);
      } catch (e: any) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('roll_dice', async (payload, cb) => {
      try {
        const { roomId } = RollDiceSchema.parse(payload);
        const room = await getRoom(roomId);
        if (!room) throw new Error('Sala inexistente');

        // Solo jugadores de la sala tiran
        if (userId !== room.white_id && userId !== room.black_id) throw new Error('No sos parte de la sala');

        const w = Math.floor(Math.random() * 6) + 1;
        const b = Math.floor(Math.random() * 6) + 1;

        const winner = compareDice(w, b);
        const nextPhase = winner ? 'moving' : 'rolling';
        const nextTurn = winner;

        const updated = await saveDice(roomId, w, b, nextPhase, nextTurn ?? null);
        nsp.to(roomId).emit('dice_result', { white: w, black: b });
        nsp.to(roomId).emit('room_state', updated);
        cb?.({ ok: true, room: updated });
      } catch (e: any) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('move', async (payload, cb) => {
      try {
        const { roomId, uci } = MoveSchema.parse(payload);
        const room = await getRoom(roomId);
        if (!room) throw new Error('Sala inexistente');
        if (room.phase !== 'moving' || !room.current_turn) throw new Error('No es fase de movimiento');

        // Color actual y dueño
        const moverColor: Color = room.current_turn;
        const moverUserId = moverColor === 'white' ? room.white_id : room.black_id;
        if (moverUserId !== userId) throw new Error('No es tu turno');

        // **Aquí no validamos reglas de ajedrez**; el cliente ya valida.
        // Aplica el movimiento y vuelve a fase 'rolling' cambiando el turno.
        const nextTurn: Color = moverColor === 'white' ? 'black' : 'white';
        const updated = await appendMove(roomId, uci, 'rolling', nextTurn);

        nsp.to(roomId).emit('move_applied', { uci, by: userId });
        nsp.to(roomId).emit('room_state', updated);
        cb?.({ ok: true, room: updated });
      } catch (e: any) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('disconnect', () => {
      // Podés emitir presencia, etc.
    });
  });
}
