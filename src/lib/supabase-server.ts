import { createClient } from '@supabase/supabase-js'

// Cliente servidor con SERVICE_ROLE_KEY — nunca exponer al frontend
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
