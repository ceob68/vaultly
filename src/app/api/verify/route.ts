import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { order_id, action, admin_secret } = body

    if (admin_secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!['confirmed', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*, products(name, file_url)')
      .eq('id', order_id)
      .single()

    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

    const { error } = await supabase
      .from('orders')
      .update({ status: action })
      .eq('id', order_id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      order_id,
      status: action,
      download_token: action === 'confirmed' ? order.download_token : null,
      download_url: action === 'confirmed'
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/download/${order.download_token}`
        : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status') || 'verifying'
  const { data: orders } = await supabase
    .from('orders')
    .select('*, products(name, price_usdt)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ orders })
}
