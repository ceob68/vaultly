'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'

export default function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [status, setStatus] = useState<'loading'|'valid'|'invalid'|'expired'|'limit'>('loading')

  useEffect(() => {
    async function verify() {
      const { data: ord } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('download_token', token)
        .single()

      if (!ord) { setStatus('invalid'); return }
      if (ord.status !== 'confirmed') { setStatus('invalid'); return }
      if (new Date(ord.expires_at) < new Date()) { setStatus('expired'); return }
      if (ord.download_count >= ord.max_downloads) { setStatus('limit'); return }

      setOrder(ord)
      setProduct(ord.products)
      setStatus('valid')
    }
    verify()
  }, [token])

  const handleDownload = async () => {
    if (!order || !product?.file_url) return
    await supabase.from('downloads').insert({ order_id: order.id, ip_address: '', user_agent: navigator.userAgent })
    await supabase.from('orders').update({ download_count: order.download_count + 1 }).eq('id', order.id)
    await supabase.from('products').update({ downloads: (product.downloads || 0) + 1 }).eq('id', product.id)
    window.open(product.file_url, '_blank')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#030307', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, fontFamily:'Syne' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:48 }}>
        <div style={{ width:28, height:28, background:'conic-gradient(from 0deg,#6C47FF,#00D4AA,#00D4FF,#6C47FF)', borderRadius:'50%' }} />
        <span style={{ fontFamily:'Bebas Neue', fontSize:22, letterSpacing:3, color:'#6C47FF' }}>VAULTLY</span>
      </div>

      {status === 'loading' && (
        <div style={{ fontFamily:'DM Mono', color:'#4a4a6a', textAlign:'center' }}>Verificando acceso...</div>
      )}

      {status === 'valid' && product && (
        <div style={{ background:'#13132a', border:'1px solid rgba(0,212,170,0.25)', borderRadius:16, padding:40, maxWidth:480, width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔐</div>
          <div style={{ fontFamily:'Bebas Neue', fontSize:28, letterSpacing:2, color:'#00D4AA', marginBottom:8 }}>ACCESO VERIFICADO</div>
          <div style={{ fontSize:14, color:'#8888a8', marginBottom:32, lineHeight:1.6 }}>
            Tu pago fue confirmado. Puedes descargar <strong style={{ color:'#E8E8F0' }}>{product.name}</strong>.
          </div>
          <div style={{ background:'#0a0a14', border:'1px solid rgba(108,71,255,0.15)', borderRadius:10, padding:16, marginBottom:24, textAlign:'left' }}>
            {[
              { label:'Descargas usadas', val:`${order.download_count} / ${order.max_downloads}` },
              { label:'Expira', val:new Date(order.expires_at).toLocaleDateString('es') },
              { label:'Versión', val: product.version || '1.0.0' },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(108,71,255,0.08)' }}>
                <span style={{ fontFamily:'DM Mono', fontSize:11, color:'#4a4a6a' }}>{row.label}</span>
                <span style={{ fontFamily:'DM Mono', fontSize:11, color:'#8888a8' }}>{row.val}</span>
              </div>
            ))}
          </div>
          <button onClick={handleDownload} className="btn-primary" style={{ width:'100%', justifyContent:'center', fontSize:15 }}>
            ⬇️ Descargar {product.name}
          </button>
          <div style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', marginTop:12 }}>
            {order.max_downloads - order.download_count} descargas restantes
          </div>
        </div>
      )}

      {(status === 'invalid' || status === 'expired' || status === 'limit') && (
        <div style={{ background:'#13132a', border:'1px solid rgba(255,59,92,0.25)', borderRadius:16, padding:40, maxWidth:440, width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🚫</div>
          <div style={{ fontFamily:'Bebas Neue', fontSize:28, letterSpacing:2, color:'#FF3B5C', marginBottom:8 }}>
            {status === 'expired' ? 'ENLACE EXPIRADO' : status === 'limit' ? 'LÍMITE ALCANZADO' : 'ACCESO INVÁLIDO'}
          </div>
          <div style={{ fontSize:13, color:'#8888a8', marginBottom:28, lineHeight:1.6 }}>
            {status === 'expired' ? 'Este enlace de descarga ha expirado. Contáctanos para renovarlo.' :
             status === 'limit' ? 'Has alcanzado el límite de descargas. Contáctanos si necesitas ayuda.' :
             'Este enlace no es válido o el pago aún no ha sido confirmado.'}
          </div>
          <Link href="/"><button className="btn-secondary" style={{ margin:'0 auto' }}>← Volver al marketplace</button></Link>
        </div>
      )}
    </div>
  )
}
