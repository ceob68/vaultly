import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { verifyTransaction } from '@/lib/verify-tx'

const ADMIN_SECRET = process.env.ADMIN_SECRET!

function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

// GET /api/verify — listar órdenes (admin)
// Secret va en header: Authorization: Bearer <secret>
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const secret = authHeader.replace('Bearer ', '').trim()

  if (!secret || secret !== ADMIN_SECRET) return unauthorized()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'verifying'

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, products(name, price_usdt)')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders })
}

// POST /api/verify — confirmar/rechazar + verificación on-chain
export async function POST(req: NextRequest) {
  // Rate limiting por IP
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const rl = await checkRateLimit(ip, 'verify')
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera 15 minutos.' }, { status: 429 })
  }

  const body = await req.json()
  const { order_id, action, admin_secret, auto_verify } = body

  // Verificar secret en body (POST)
  if (!admin_secret || admin_secret !== ADMIN_SECRET) return unauthorized()
  if (!order_id || !action) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  // Obtener la orden
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*, products(name, price_usdt, file_url), payment_wallets(network, address)')
    .eq('id', order_id)
    .single()

  if (orderErr || !order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  // Verificación on-chain automática si se solicita
  if (auto_verify && order.tx_hash) {
    const wallets = await supabaseAdmin.from('payment_wallets').select('*').eq('network', order.network).single()
    const walletAddress = wallets.data?.address || ''

    const verification = await verifyTransaction(order.tx_hash, order.network, order.amount_usdt, walletAddress)

    if (!verification.valid) {
      return NextResponse.json({
        success: false,
        error: verification.error,
        requires_manual: true
      })
    }
  }

  if (action === 'confirmed') {
    // Generar URL firmada de Supabase Storage para descarga
    let downloadUrl = null
    if (order.products?.file_url) {
      const filePath = order.products.file_url.replace(/.*\/storage\/v1\/object\/public\/products\//, '')
      const { data: signed } = await supabaseAdmin.storage
        .from('products')
        .createSignedUrl(filePath, 60 * 60 * 24 * 30) // 30 días
      downloadUrl = signed?.signedUrl
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', order_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Procesar referido si existe
    if (order.ref_id) {
      const { data: ref } = await supabaseAdmin.from('referrals').select('commission_pct').eq('id', order.ref_id).single()
      if (ref) {
        const commission = (order.amount_usdt * ref.commission_pct) / 100
        await supabaseAdmin.from('referral_conversions').insert({
          referral_id: order.ref_id,
          order_id: order.id,
          amount_usdt: order.amount_usdt,
          commission,
          status: 'pending'
        })
      }
    }

    const downloadPageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/download/${order.download_token}`
    return NextResponse.json({ success: true, download_url: downloadPageUrl, signed_url: downloadUrl })
  }

  if (action === 'rejected') {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', order_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
