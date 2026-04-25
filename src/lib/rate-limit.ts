import { supabaseAdmin } from './supabase-server'

const WINDOW_MINUTES = 15
const MAX_ATTEMPTS = 10

export async function checkRateLimit(identifier: string, action: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

  // Limpiar intentos viejos
  await supabaseAdmin
    .from('rate_limits')
    .delete()
    .eq('identifier', identifier)
    .eq('action', action)
    .lt('window_start', windowStart)

  // Contar intentos actuales
  const { data } = await supabaseAdmin
    .from('rate_limits')
    .select('attempts')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('window_start', windowStart)
    .maybeSingle()

  const attempts = data?.attempts || 0

  if (attempts >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  // Registrar intento
  if (data) {
    await supabaseAdmin
      .from('rate_limits')
      .update({ attempts: attempts + 1 })
      .eq('identifier', identifier)
      .eq('action', action)
  } else {
    await supabaseAdmin
      .from('rate_limits')
      .insert({ identifier, action, attempts: 1, window_start: new Date().toISOString() })
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - attempts - 1 }
}
