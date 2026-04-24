'use client'
import { useEffect, useState } from 'react'
import { supabase, type Product } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      setProduct(data)
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#030307', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Mono', color:'#4a4a6a' }}>
      Cargando producto...
    </div>
  )

  if (!product) return (
    <div style={{ minHeight:'100vh', background:'#030307', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontFamily:'Bebas Neue', fontSize:48, color:'#6C47FF' }}>404</div>
      <div style={{ fontFamily:'DM Mono', color:'#4a4a6a' }}>Producto no encontrado</div>
      <Link href="/"><button className="btn-primary">← Volver al inicio</button></Link>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#030307', color:'#E8E8F0', fontFamily:'Syne' }}>
      {/* NAV */}
      <header style={{ background:'#07070f', borderBottom:'1px solid rgba(108,71,255,0.12)', padding:'0 40px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ width:24, height:24, background:'conic-gradient(from 0deg,#6C47FF,#00D4AA,#00D4FF,#6C47FF)', borderRadius:'50%' }} />
          <span style={{ fontFamily:'Bebas Neue', fontSize:18, letterSpacing:3, color:'#6C47FF' }}>VAULTLY</span>
        </Link>
        <Link href="/"><button className="btn-secondary" style={{ padding:'6px 16px', fontSize:12 }}>← Volver</button></Link>
      </header>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'60px 40px' }}>
        {/* BREADCRUMB */}
        <div style={{ fontFamily:'DM Mono', fontSize:11, color:'#4a4a6a', marginBottom:32 }}>
          <Link href="/" style={{ color:'#6C47FF' }}>Vaultly</Link> / {(product.categories as any)?.name} / {product.name}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:40, alignItems:'start' }}>
          {/* INFO */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <span style={{ fontFamily:'DM Mono', fontSize:10, padding:'3px 8px', borderRadius:4, background:'rgba(108,71,255,0.15)', color:'#A78BFA', border:'1px solid rgba(108,71,255,0.25)', textTransform:'uppercase', letterSpacing:1 }}>
                {(product.categories as any)?.icon} {(product.categories as any)?.name}
              </span>
              {product.is_new && <span style={{ fontFamily:'DM Mono', fontSize:10, padding:'3px 8px', borderRadius:4, background:'rgba(0,212,170,0.12)', color:'#00D4AA', border:'1px solid rgba(0,212,170,0.3)', textTransform:'uppercase', letterSpacing:1 }}>NEW</span>}
              <span style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a' }}>v{product.version}</span>
            </div>

            <h1 style={{ fontFamily:'Bebas Neue', fontSize:52, letterSpacing:3, marginBottom:12, lineHeight:1 }}>{product.name.toUpperCase()}</h1>
            <p style={{ fontSize:15, color:'#8888a8', lineHeight:1.7, marginBottom:32 }}>{product.long_description || product.description}</p>

            {product.tech_stack?.length > 0 && (
              <div style={{ marginBottom:32 }}>
                <div style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>Stack tecnológico</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {product.tech_stack.map(t => (
                    <span key={t} style={{ fontFamily:'DM Mono', fontSize:11, padding:'4px 12px', borderRadius:6, border:'1px solid rgba(108,71,255,0.25)', color:'#8888a8' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {product.tags?.length > 0 && (
              <div>
                <div style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>Tags</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {product.tags.map(t => (
                    <span key={t} style={{ fontFamily:'DM Mono', fontSize:11, padding:'3px 10px', borderRadius:4, background:'rgba(0,212,170,0.08)', color:'#00D4AA', border:'1px solid rgba(0,212,170,0.2)' }}>#{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COMPRA */}
          <div style={{ background:'#13132a', border:'1px solid rgba(108,71,255,0.25)', borderRadius:14, padding:28, position:'sticky', top:80 }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontFamily:'DM Mono', fontSize:48, fontWeight:500, color:'#00D4AA', textShadow:'0 0 24px rgba(0,212,170,0.4)' }}>{product.price_usdt}</div>
              <div style={{ fontSize:12, color:'#4a4a6a', marginBottom:4 }}>USDT · Precio único</div>
              <div style={{ fontSize:11, color:'#6C47FF' }}>Acceso vitalicio · Código 100% tuyo</div>
            </div>

            <div style={{ borderTop:'1px solid rgba(108,71,255,0.12)', borderBottom:'1px solid rgba(108,71,255,0.12)', padding:'16px 0', marginBottom:20 }}>
              {[
                { icon:'⚡', text:'Acceso inmediato tras el pago' },
                { icon:'📁', text:`Tamaño: ${product.file_size || 'Incluido'}` },
                { icon:'🔄', text:'Actualizaciones incluidas' },
                { icon:'📖', text:'Documentación completa' },
                { icon:'💬', text:'Soporte post-venta' },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize:12, color:'#8888a8' }}>
                  <span>{item.icon}</span> {item.text}
                </div>
              ))}
            </div>

            <Link href={`/order/${product.id}`} style={{ display:'block', width:'100%' }}>
              <button className="btn-primary" style={{ width:'100%', justifyContent:'center', marginBottom:10 }}>
                Comprar — {product.price_usdt} USDT
              </button>
            </Link>
            <div style={{ textAlign:'center', fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', marginTop:8 }}>
              Pago seguro · Sin intermediarios
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
