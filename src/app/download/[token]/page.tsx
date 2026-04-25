'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface DownloadData {
  success: boolean
  url?: string
  product_name?: string
  file_size?: string
  downloads_used?: number
  downloads_max?: number
  expires_in?: string
  error?: string
}

export default function DownloadPage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<DownloadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`/api/download?token=${token}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData({ success: false, error: 'Error de conexión' }); setLoading(false) })
  }, [token])

  const handleDownload = async () => {
    if (!data?.url) return
    setDownloading(true)
    // Usar fetch + blob para descarga segura sin exponer URL directamente
    try {
      const res = await fetch(data.url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.product_name || 'vaultly-product'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(data.url, '_blank')
    }
    setDownloading(false)
  }

  const S = {
    page: { minHeight:'100vh', background:'#030307', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'Syne, sans-serif' },
    card: { background:'#13132a', border:'1px solid rgba(108,71,255,0.25)', borderRadius:16, padding:'40px', maxWidth:480, width:'100%', textAlign:'center' as const },
    title: { fontFamily:'Bebas Neue, sans-serif', fontSize:28, letterSpacing:2, color:'#E8E8F0', margin:'16px 0 8px' },
    sub: { fontFamily:'DM Mono, monospace', fontSize:12, color:'#4a4a6a', marginBottom:28 },
    btn: { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px 32px', background:'#6C47FF', border:'1px solid rgba(108,71,255,0.5)', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', width:'100%', transition:'all .18s' },
    stat: { display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(108,71,255,0.08)' },
    statLabel: { fontFamily:'DM Mono, monospace', fontSize:11, color:'#4a4a6a' },
    statVal: { fontFamily:'DM Mono, monospace', fontSize:11, color:'#00D4AA' },
  }

  if (loading) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize:40, marginBottom:16 }}>⏳</div>
        <div style={S.title}>VERIFICANDO ACCESO</div>
        <div style={S.sub}>Validando tu token de descarga...</div>
      </div>
    </div>
  )

  if (!data?.success) return (
    <div style={S.page}>
      <div style={{ ...S.card, borderColor:'rgba(255,59,92,0.25)' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
        <div style={{ ...S.title, color:'#FF3B5C' }}>ACCESO DENEGADO</div>
        <div style={S.sub}>{data?.error || 'Token inválido o expirado'}</div>
        <Link href="/">
          <button style={{ ...S.btn, background:'transparent', border:'1px solid rgba(255,59,92,0.3)', color:'#FF3B5C' }}>
            Volver al marketplace
          </button>
        </Link>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <div style={S.title}>PAGO CONFIRMADO</div>
        <div style={S.sub}>Tu descarga está lista · Acceso verificado</div>

        <div style={{ background:'rgba(108,71,255,0.06)', borderRadius:10, padding:'16px 20px', marginBottom:24, textAlign:'left' }}>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>Detalles del producto</div>
          <div style={S.stat}><span style={S.statLabel}>Producto</span><span style={{ ...S.statVal, color:'#E8E8F0', maxWidth:220, textAlign:'right' as const }}>{data.product_name}</span></div>
          {data.file_size && <div style={S.stat}><span style={S.statLabel}>Tamaño</span><span style={S.statVal}>{data.file_size}</span></div>}
          <div style={S.stat}><span style={S.statLabel}>Descargas usadas</span><span style={S.statVal}>{data.downloads_used}/{data.downloads_max}</span></div>
          <div style={{ ...S.stat, border:'none' }}><span style={S.statLabel}>URL válida por</span><span style={S.statVal}>{data.expires_in}</span></div>
        </div>

        <button
          style={{ ...S.btn, opacity: downloading ? .7 : 1 }}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? '⏳ Descargando...' : '⚡ Descargar ahora'}
        </button>

        <div style={{ marginTop:16, fontFamily:'DM Mono, monospace', fontSize:10, color:'#4a4a6a', lineHeight:1.6 }}>
          Esta URL es personal e intransferible.<br />
          El código fuente es 100% tuyo.
        </div>

        <div style={{ marginTop:20 }}>
          <Link href="/" style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'#6C47FF' }}>← Explorar más productos</Link>
        </div>
      </div>
    </div>
  )
}
