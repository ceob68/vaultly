import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// POST /api/referrals — crear código de referido
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, name } = body

  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  // Verificar si ya tiene código
  const { data: existing } = await supabaseAdmin
    .from('referrals').select('code, total_sales, total_earned').eq('owner_email', email.toLowerCase()).maybeSingle()

  if (existing) return NextResponse.json({ success: true, code: existing.code, existing: true, stats: existing })

  // Generar código único
  const { data: codeData } = await supabaseAdmin.rpc('generate_ref_code', { email: email.toLowerCase() })

  const { data: ref, error } = await supabaseAdmin
    .from('referrals')
    .insert({ code: codeData, owner_email: email.toLowerCase(), owner_name: name?.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, code: ref.code, commission_pct: ref.commission_pct })
}

// GET /api/referrals?code=XXX — ver stats de un referido
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('referrals')
    .select('code, owner_name, commission_pct, total_sales, total_earned, created_at')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 })
  return NextResponse.json(data)
}
