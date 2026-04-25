import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

// GET /api/download?token=xxx — genera URL firmada temporal
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  // Rate limit por token
  const rl = await checkRateLimit(token, 'download')
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Límite de descargas excedido temporalmente' }, { status: 429 })
  }

  // Buscar orden
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*, products(name, file_url, file_size)')
    .eq('download_token', token)
    .eq('status', 'confirmed')
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Token inválido o pago no confirmado' }, { status: 404 })
  }

  // Verificar expiración
  if (new Date(order.expires_at) < new Date()) {
    return NextResponse.json({ error: 'El acceso de descarga ha expirado' }, { status: 410 })
  }

  // Verificar límite de descargas
  if (order.download_count >= order.max_downloads) {
    return NextResponse.json({ error: `Límite de ${order.max_downloads} descargas alcanzado` }, { status: 429 })
  }

  // Generar URL firmada de Supabase Storage (válida 60 min)
  const fileUrl = order.products?.file_url || ''
  const filePath = fileUrl.replace(/.*\/storage\/v1\/object\/public\/products\//, '')

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from('products')
    .createSignedUrl(filePath, 3600) // 1 hora

  if (signErr || !signed) {
    return NextResponse.json({ error: 'Error generando URL de descarga' }, { status: 500 })
  }

  // Registrar descarga
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const ua = req.headers.get('user-agent') || ''

  await Promise.all([
    supabaseAdmin.from('downloads').insert({ order_id: order.id, ip_address: ip, user_agent: ua }),
    supabaseAdmin.from('orders').update({ download_count: order.download_count + 1 }).eq('id', order.id),
  ])

  return NextResponse.json({
    success: true,
    url: signed.signedUrl,
    product_name: order.products?.name,
    file_size: order.products?.file_size,
    downloads_used: order.download_count + 1,
    downloads_max: order.max_downloads,
    expires_in: '60 minutos',
  })
}
