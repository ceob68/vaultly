import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rl = await checkRateLimit(ip, 'create_order')
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera 15 minutos.' }, { status: 429 })
  }

  const body = await req.json()
  const { product_id, buyer_email, buyer_name, network, tx_hash, wallet_from, ref_code } = body

  if (!product_id || !buyer_email || !network || !tx_hash) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Validar email
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRx.test(buyer_email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  // Validar que el TX hash no esté ya registrado
  const { data: existingTx } = await supabaseAdmin
    .from('orders').select('id').eq('tx_hash', tx_hash).maybeSingle()
  if (existingTx) {
    return NextResponse.json({ error: 'Este hash ya fue registrado' }, { status: 409 })
  }

  // Obtener producto y precio
  const { data: product, error: prodErr } = await supabaseAdmin
    .from('products').select('id, price_usdt, is_active').eq('id', product_id).single()
  if (prodErr || !product || !product.is_active) {
    return NextResponse.json({ error: 'Producto no disponible' }, { status: 404 })
  }

  // Resolver referido si existe
  let ref_id = null
  if (ref_code) {
    const { data: ref } = await supabaseAdmin
      .from('referrals').select('id').eq('code', ref_code.toUpperCase()).eq('is_active', true).maybeSingle()
    if (ref) ref_id = ref.id
  }

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      product_id,
      buyer_email: buyer_email.toLowerCase().trim(),
      buyer_name: buyer_name?.trim(),
      amount_usdt: product.price_usdt,
      network,
      tx_hash: tx_hash.trim(),
      wallet_from: wallet_from?.trim(),
      status: 'verifying',
      ref_code: ref_code?.toUpperCase() || null,
      ref_id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, order_id: order.id })
}
