# Lucky WS (Socket.IO + Supabase)

Servidor en tiempo real para LuckyChess.

## Requisitos
- Node 18+
- Una base Postgres (Supabase)
- Variables de entorno: ver `.env.example`

## Configuración
1. Crear proyecto en Supabase.
2. `Settings → Database → Connection string → URI` → `DATABASE_URL`.
3. `Settings → API → JWT secret` → `SUPABASE_JWT_SECRET`.
4. Ejecutar `supabase.sql` en el SQL Editor.
5. Clonar repo, crear `.env` desde `.env.example`.

## Desarrollo
```bash
npm i
npm run dev
