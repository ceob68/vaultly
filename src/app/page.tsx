'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, type Product, type Category } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('todos')
  const [btcPrice, setBtcPrice] = useState('...')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // Canvas animado
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: { x:number; y:number; vx:number; vy:number; r:number; a:number; color:string }[] = []
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - .5) * .3,
        vy: (Math.random() - .5) * .3,
        r: Math.random() * 1.5 + .5,
        a: Math.random() * .4 + .1,
        color: Math.random() > .5 ? '108,71,255' : '0,212,170',
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Grid
      ctx.strokeStyle = 'rgba(108,71,255,0.03)'
      ctx.lineWidth = .5
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke()
      }
      // Conexiones
      for (let i = 0; i < particles.length; i++) {
        for (let j = i+1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx*dx+dy*dy)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(108,71,255,${(1-d/120)*.1})`
            ctx.lineWidth = .5
            ctx.stroke()
          }
        }
      }
      // Partículas
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x<0||p.x>canvas.width) p.vx *= -1
        if (p.y<0||p.y>canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(${p.color},${p.a})`
        ctx.fill()
      })
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
  }, [])

  // Datos de Supabase
  useEffect(() => {
    async function load() {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('products').select('*, categories(*)').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ])
      setProducts(prods || [])
      setCategories(cats || [])
      setLoading(false)
    }
    load()
  }, [])

  // Precio BTC
  useEffect(() => {
    const fetchBTC = async () => {
      try {
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        const d = await r.json()
        if (d.bitcoin) setBtcPrice('$' + d.bitcoin.usd.toLocaleString())
      } catch {}
    }
    fetchBTC()
    const i = setInterval(fetchBTC, 30000)
    return () => clearInterval(i)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = activeCategory === 'todos'
    ? products
    : products.filter(p => (p.categories as any)?.slug === activeCategory)

  const featured = products.find(p => p.is_featured) || products[0]

  return (
    <>
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />

      {/* TICKER */}
      <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:44, background:'#07070f', borderBottom:'1px solid rgba(108,71,255,0.12)', display:'flex', alignItems:'center' }}>
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:10, padding:'0 22px', height:'100%', borderRight:'1px solid rgba(108,71,255,0.12)' }}>
          <div style={{ width:26, height:26, background:'conic-gradient(from 0deg,#6C47FF,#00D4AA,#00D4FF,#6C47FF)', borderRadius:'50%', animation:'spin 8s linear infinite', flexShrink:0 }} />
          <span style={{ fontFamily:'Bebas Neue', fontSize:19, letterSpacing:3, color:'#6C47FF', textShadow:'0 0 20px rgba(108,71,255,0.6)' }}>VAULTLY</span>
        </div>
        <div style={{ flex:1, display:'flex', alignItems:'center', height:'100%', overflow:'hidden' }}>
          {[
            { label:'Productos', val: products.length || '...', color:'#6C47FF' },
            { label:'Categorías', val: categories.length || 12, color:'#00D4AA' },
            { label:'BTC/USD', val: btcPrice, color:'#E8E8F0' },
            { label:'Red', val:'TRC20 · BEP20', color:'#8888a8' },
            { label:'Acceso', val:'Inmediato ⚡', color:'#00D4AA' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'0 18px', height:'100%', borderRight:'1px solid rgba(108,71,255,0.12)', flexShrink:0 }}>
              <span style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:1 }}>{item.label}</span>
              <span style={{ fontFamily:'DM Mono', fontSize:12, color: item.color, fontWeight:500 }}>{item.val}</span>
            </div>
          ))}
        </div>
        <div style={{ padding:'0 16px', flexShrink:0 }}>
          <button onClick={() => showToast('Conecta tu wallet para comprar')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 16px', background:'rgba(108,71,255,0.12)', border:'1px solid rgba(108,71,255,0.25)', borderRadius:8, color:'#6C47FF', fontSize:12, fontWeight:600, fontFamily:'Syne' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', animation:'pulse 2s ease-in-out infinite' }} />
            Wallet
          </button>
        </div>
      </header>

      <div style={{ position:'relative', zIndex:1, paddingTop:44 }}>

        {/* NAV CATEGORÍAS */}
        <nav style={{ background:'rgba(7,7,15,0.9)', borderBottom:'1px solid rgba(108,71,255,0.12)', backdropFilter:'blur(12px)', padding:'0 40px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52, position:'sticky', top:44, zIndex:90 }}>
          <div style={{ display:'flex', gap:2, height:'100%' }}>
            <button onClick={() => setActiveCategory('todos')} style={{ display:'flex', alignItems:'center', gap:6, padding:'0 16px', height:'100%', background:'transparent', border:'none', fontSize:12, fontWeight:600, color: activeCategory==='todos' ? '#6C47FF' : '#4a4a6a', borderBottom: activeCategory==='todos' ? '2px solid #6C47FF' : '2px solid transparent', letterSpacing:.5, textTransform:'uppercase', transition:'all .18s' }}>
              Todos <span style={{ fontFamily:'DM Mono', fontSize:10, padding:'1px 5px', borderRadius:3, background:'rgba(108,71,255,0.12)', color:'#6C47FF' }}>{products.length}</span>
            </button>
            {categories.map(cat => (
              <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)} style={{ display:'flex', alignItems:'center', gap:6, padding:'0 14px', height:'100%', background:'transparent', border:'none', fontSize:12, fontWeight:600, color: activeCategory===cat.slug ? '#6C47FF' : '#4a4a6a', borderBottom: activeCategory===cat.slug ? '2px solid #6C47FF' : '2px solid transparent', letterSpacing:.5, textTransform:'uppercase', transition:'all .18s', whiteSpace:'nowrap' }}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          <input placeholder="Buscar productos..." style={{ background:'#0a0a14', border:'1px solid rgba(108,71,255,0.12)', borderRadius:8, padding:'6px 12px', color:'#8888a8', fontFamily:'DM Mono', fontSize:12, width:200, outline:'none' }} />
        </nav>

        {/* HERO */}
        <section style={{ minHeight:520, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 40px', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(108,71,255,0.12)', border:'1px solid rgba(108,71,255,0.25)', borderRadius:20, padding:'6px 16px', fontFamily:'DM Mono', fontSize:11, color:'#A78BFA', marginBottom:24, letterSpacing:.5 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#00D4AA', boxShadow:'0 0 8px #00D4AA', animation:'pulse 2s ease-in-out infinite', display:'inline-block' }} />
            Marketplace activo · Pago en USDT / Cripto
          </div>
          <h1 style={{ fontFamily:'Bebas Neue', fontSize:88, lineHeight:.92, letterSpacing:4, color:'#E8E8F0', marginBottom:6 }}>
            PRODUCTOS<br />
            <span style={{ color:'#6C47FF', textShadow:'0 0 40px rgba(108,71,255,0.5)' }}>DIGITALES</span><br />
            <span style={{ color:'#00D4AA', textShadow:'0 0 30px rgba(0,212,170,0.4)' }}>PREMIUM</span>
          </h1>
          <p style={{ fontFamily:'DM Mono', fontSize:12, color:'#4a4a6a', letterSpacing:2, textTransform:'uppercase', marginBottom:20 }}>
            Para builders · by builder · desde Venezuela al mundo
          </p>
          <p style={{ fontSize:15, color:'#8888a8', maxWidth:520, lineHeight:1.7, margin:'0 auto 36px' }}>
            Desde automatizaciones simples hasta soluciones enterprise. Todo probado, documentado y listo para producción. Acceso inmediato tras el pago.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', marginBottom:56 }}>
            <button className="btn-primary" onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior:'smooth' })}>⚡ Explorar productos</button>
            <button className="btn-secondary" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior:'smooth' })}>¿Cómo funciona?</button>
          </div>
          <div style={{ display:'flex', gap:2 }}>
            {[
              { val: products.length || '48', label:'Productos' },
              { val: categories.length || '12', label:'Categorías' },
              { val:'USDT', label:'Pago cripto' },
              { val:'⚡', label:'Acceso inmediato' },
              { val:'100%', label:'Código tuyo' },
            ].map((s, i) => (
              <div key={i} style={{ background:'#13132a', border:'1px solid rgba(108,71,255,0.12)', padding:'14px 24px', minWidth:130, textAlign:'center', borderRadius: i===0?'8px 0 0 8px':i===4?'0 8px 8px 0':'0' }}>
                <div style={{ fontFamily:'DM Mono', fontSize:22, fontWeight:500, color:'#00D4AA', marginBottom:4 }}>{s.val}</div>
                <div style={{ fontSize:10, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:1.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(108,71,255,0.25),rgba(108,71,255,0.1),rgba(108,71,255,0.25),transparent)', margin:'0 40px' }} />

        {/* FEATURED */}
        {featured && (
          <div style={{ padding:'40px 40px 0' }}>
            <div style={{ background:'#13132a', border:'1px solid rgba(108,71,255,0.25)', borderRadius:14, padding:'32px 40px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:40, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(108,71,255,0.08) 0%,transparent 60%)', pointerEvents:'none' }} />
              <div>
                <div style={{ fontFamily:'DM Mono', fontSize:10, color:'#6C47FF', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>⭐ Producto destacado</div>
                <div style={{ fontFamily:'Bebas Neue', fontSize:36, letterSpacing:2, color:'#E8E8F0', marginBottom:8 }}>
                  {featured.name.toUpperCase().split(' ').map((w,i) => i===0 ? w : <span key={i} style={{ color:'#00D4AA' }}> {w}</span>)}
                </div>
                <div style={{ fontSize:13, color:'#8888a8', lineHeight:1.6, maxWidth:500, marginBottom:18 }}>{featured.description}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {featured.tech_stack?.map(t => (
                    <span key={t} style={{ fontFamily:'DM Mono', fontSize:10, padding:'3px 10px', borderRadius:4, border:'1px solid rgba(108,71,255,0.25)', color:'#4a4a6a', letterSpacing:.5 }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontFamily:'DM Mono', fontSize:42, fontWeight:500, color:'#00D4AA', textShadow:'0 0 24px rgba(0,212,170,0.4)', marginBottom:4 }}>{featured.price_usdt}</div>
                <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:16 }}>USDT · Acceso vitalicio</div>
                <Link href={`/product/${featured.slug}`}>
                  <button className="btn-primary">Comprar ahora →</button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTOS */}
        <section id="productos" style={{ padding:'60px 40px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <div>
              <div style={{ fontFamily:'Bebas Neue', fontSize:28, letterSpacing:2, color:'#E8E8F0' }}>
                PRODUCTOS <span style={{ color:'#6C47FF' }}>DISPONIBLES</span>
              </div>
              <div style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', letterSpacing:2, textTransform:'uppercase' }}>
                {filtered.length} productos encontrados
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'60px 0', fontFamily:'DM Mono', color:'#4a4a6a' }}>Cargando productos...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0', fontFamily:'DM Mono', color:'#4a4a6a' }}>
              No hay productos en esta categoría aún. Próximamente... 🔥
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              {filtered.map(prod => (
                <Link key={prod.id} href={`/product/${prod.slug}`} style={{ textDecoration:'none' }}>
                  <div style={{ background:'#0a0a14', border:'1px solid rgba(108,71,255,0.12)', borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'all .18s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(108,71,255,0.25)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(108,71,255,0.15)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.borderColor='rgba(108,71,255,0.12)'; (e.currentTarget as HTMLElement).style.boxShadow='' }}>
                    <div style={{ height:110, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(108,71,255,0.05)', position:'relative' }}>
                      <span style={{ fontSize:36 }}>{(prod.categories as any)?.icon || '📦'}</span>
                      <span style={{ position:'absolute', top:8, left:8, fontFamily:'DM Mono', fontSize:9, padding:'2px 7px', borderRadius:4, background:'rgba(108,71,255,0.15)', color:'#A78BFA', border:'1px solid rgba(108,71,255,0.25)', textTransform:'uppercase', letterSpacing:1 }}>
                        {(prod.categories as any)?.name || 'Digital'}
                      </span>
                      {prod.is_new && <span style={{ position:'absolute', top:8, right:8, fontFamily:'DM Mono', fontSize:9, padding:'2px 7px', borderRadius:4, background:'rgba(0,212,170,0.12)', color:'#00D4AA', border:'1px solid rgba(0,212,170,0.3)', textTransform:'uppercase', letterSpacing:1 }}>NEW</span>}
                    </div>
                    <div style={{ padding:14 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#E8E8F0', marginBottom:5 }}>{prod.name}</div>
                      <div style={{ fontSize:11, color:'#8888a8', lineHeight:1.5, marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{prod.description}</div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontFamily:'DM Mono', fontSize:16, fontWeight:500, color:'#00D4AA' }}>
                          {prod.price_usdt} <span style={{ fontSize:10, color:'#4a4a6a' }}>USDT</span>
                        </span>
                        <span style={{ background:'rgba(108,71,255,0.15)', border:'1px solid rgba(108,71,255,0.25)', borderRadius:6, color:'#A78BFA', padding:'5px 10px', fontSize:11, fontWeight:600 }}>
                          Comprar
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(108,71,255,0.25),rgba(108,71,255,0.1),rgba(108,71,255,0.25),transparent)', margin:'0 40px' }} />

        {/* CATEGORÍAS */}
        <section style={{ padding:'60px 40px' }}>
          <div style={{ fontFamily:'Bebas Neue', fontSize:28, letterSpacing:2, color:'#E8E8F0', marginBottom:28 }}>
            EXPLORA POR <span style={{ color:'#6C47FF' }}>CATEGORÍA</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
            {categories.map(cat => (
              <div key={cat.slug} onClick={() => { setActiveCategory(cat.slug); document.getElementById('productos')?.scrollIntoView({ behavior:'smooth' }) }}
                style={{ background:'#13132a', border:'1px solid rgba(108,71,255,0.12)', borderRadius:14, padding:'20px 14px', textAlign:'center', cursor:'pointer', transition:'all .18s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(108,71,255,0.25)'; (e.currentTarget as HTMLElement).style.transform='translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(108,71,255,0.12)'; (e.currentTarget as HTMLElement).style.transform='' }}>
                <div style={{ fontSize:26, marginBottom:10 }}>{cat.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'#8888a8', marginBottom:4, letterSpacing:.5 }}>{cat.name}</div>
                <div style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a' }}>
                  {products.filter(p => (p.categories as any)?.slug === cat.slug).length} productos
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(108,71,255,0.25),rgba(108,71,255,0.1),rgba(108,71,255,0.25),transparent)', margin:'0 40px' }} />

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" style={{ padding:'60px 40px' }}>
          <div style={{ fontFamily:'Bebas Neue', fontSize:28, letterSpacing:2, color:'#E8E8F0', marginBottom:28 }}>
            ¿CÓMO <span style={{ color:'#6C47FF' }}>FUNCIONA</span>?
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
            {[
              { n:'01', icon:'🔍', title:'Elige tu producto', desc:'Explora el catálogo. Cada producto tiene descripción detallada, stack tecnológico y precio en USDT.' },
              { n:'02', icon:'💳', title:'Realiza el pago', desc:'Transfiere en USDT a la wallet indicada. Soportamos TRC20, BEP20, Binance Pay y más.' },
              { n:'03', icon:'✅', title:'Confirma la transacción', desc:'Comparte el hash de tu TX. Verificamos el pago en blockchain en minutos, no en horas.' },
              { n:'04', icon:'⚡', title:'Descarga inmediata', desc:'Acceso instantáneo al código completo, documentación y actualizaciones. El producto es 100% tuyo.' },
            ].map((s, i) => (
              <div key={i} style={{ background:'#0a0a14', border:'1px solid rgba(108,71,255,0.12)', padding:'28px 22px', borderRadius: i===0?'14px 0 0 14px':i===3?'0 14px 14px 0':'0' }}>
                <div style={{ fontFamily:'Bebas Neue', fontSize:48, color:'rgba(108,71,255,0.2)', lineHeight:1, marginBottom:14 }}>{s.n}</div>
                <div style={{ fontSize:26, marginBottom:14 }}>{s.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#E8E8F0', marginBottom:8, letterSpacing:.5 }}>{s.title}</div>
                <div style={{ fontSize:12, color:'#8888a8', lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST BAR */}
        <div style={{ background:'#07070f', borderTop:'1px solid rgba(108,71,255,0.12)', borderBottom:'1px solid rgba(108,71,255,0.12)', padding:'18px 40px', display:'flex', alignItems:'center', justifyContent:'center', gap:48 }}>
          {['Pago en USDT · TRC20 · BEP20 · Binance Pay','Acceso inmediato post-pago','Código 100% tuyo · Sin licencias','Documentación incluida','Soporte post-venta'].map((t, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#00D4AA', boxShadow:'0 0 8px #00D4AA', display:'inline-block' }} />
              <span style={{ fontFamily:'DM Mono', fontSize:11, color:'#4a4a6a', letterSpacing:.5 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <footer style={{ background:'#07070f', borderTop:'1px solid rgba(108,71,255,0.12)', padding:40 }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:40 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:28, height:28, background:'conic-gradient(from 0deg,#6C47FF,#00D4AA,#00D4FF,#6C47FF)', borderRadius:'50%' }} />
                <span style={{ fontFamily:'Bebas Neue', fontSize:20, letterSpacing:3, color:'#6C47FF' }}>VAULTLY</span>
              </div>
              <div style={{ fontSize:12, color:'#4a4a6a', lineHeight:1.6, maxWidth:220 }}>
                Marketplace de productos digitales premium. Desde Venezuela al mundo, con pago en criptomonedas.
              </div>
            </div>
            {[
              { title:'Productos', items:['SaaS & Apps','Bots de Cripto','Automatizaciones','Plantillas Web','Enterprise'] },
              { title:'Información', items:['¿Cómo comprar?','Wallets aceptadas','Política de acceso','Soporte','FAQ'] },
              { title:'Contacto', items:['Telegram','Discord','Twitter / X','Email'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize:10, fontWeight:700, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:2, marginBottom:14 }}>{col.title}</div>
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:8 }}>
                  {col.items.map(item => (
                    <li key={item} style={{ fontSize:12, color:'#8888a8', cursor:'pointer' }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(108,71,255,0.12)', paddingTop:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontFamily:'DM Mono', fontSize:11, color:'#4a4a6a' }}>
              © 2025 <span style={{ color:'#6C47FF' }}>Vaultly</span> · Todos los derechos reservados
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {['USDT · TRC20','USDT · BEP20','Binance Pay','BTC','ETH'].map(b => (
                <span key={b} style={{ fontFamily:'DM Mono', fontSize:10, padding:'4px 10px', borderRadius:4, border:'1px solid rgba(108,71,255,0.12)', color:'#4a4a6a', letterSpacing:.5 }}>{b}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background:'#18183a', border:'1px solid rgba(108,71,255,0.25)', borderRadius:14, padding:'12px 18px', display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#E8E8F0', animation:'slideIn .25s ease', minWidth:240, boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#6C47FF', boxShadow:'0 0 8px #6C47FF', flexShrink:0 }} />
          {toast}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </>
  )
}
