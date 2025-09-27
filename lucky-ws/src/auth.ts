import { jwtVerify } from 'jose';

/**
 * Verifica el JWT de Supabase (access_token del cliente)
 * Devuelve { sub, email, ... } o lanza error si es inválido
 */
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;
if (!SUPABASE_JWT_SECRET) throw new Error('SUPABASE_JWT_SECRET no seteado');

const secretKey = new TextEncoder().encode(SUPABASE_JWT_SECRET);

export async function verifySupabaseToken(token: string): Promise<{ sub: string; [k: string]: any }> {
  const { payload } = await jwtVerify(token, secretKey, {
    // aud/iss opcionales — Supabase usa HS256 con ese secret
  });
  if (!payload.sub) throw new Error('Token sin sub');
  return payload as any;
}
