import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { product_id, buyer_email, buyer_name, network, tx_hash, wallet_from } = body

    if (!product_id || !buyer_email || !network || !tx_hash) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const { data: product } = await supabase
      .from('products')
      .select('price_usdt')
      .eq('id', product_id)
      .single()

    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('tx_hash', tx_hash)
      .single()

    if (existing) return NextResponse.json({ error: 'Esta transacción ya fue registrada' }, { status: 409 })

    const { data: order, error } = await supabase
      .from('orders')
      .insert({ product_id, buyer_email, buyer_name, amount_usdt: product.price_usdt, network, tx_hash, wallet_from, status: 'verifying' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, order_id: order.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
