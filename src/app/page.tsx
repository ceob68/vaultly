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
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const particles: { x:number;y:number;vx:number;vy:number;r:number;a:number;color:string }[] = []
    for (let i = 0; i < 80; i++) {
      particles.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3, r:Math.random()*1.5+.5, a:Math.random()*.4+.1, color:Math.random()>.5?'108,71,255':'0,212,170' })
    }
    const animate = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      ctx.strokeStyle='rgba(108,71,255,0.03)'; ctx.lineWidth=.5
      for(let x=0;x<canvas.width;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}
      for(let y=0;y<canvas.height;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}
      for(let i=0;i<particles.length;i++){
        for(let j=i+1;j<particles.length;j++){
          const dx=particles[i].x-particles[j].x; const dy=particles[i].y-particles[j].y
          const d=Math.sqrt(dx*dx+dy*dy)
          if(d<120){ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(108,71,255,${(1-d/120)*.1})`;ctx.lineWidth=.5;ctx.stroke()}
        }
      }
      particles.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy
        if(p.x<0||p.x>canvas.width)p.vx*=-1
        if(p.y<0||p.y>canvas.height)p.vy*=-1
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${p.color},${p.a})`;ctx.fill()
      })
      animId=requestAnimationFrame(animate)
    }
    animate()
    return()=>{window.removeEventListener('resize',resize);cancelAnimationFrame(animId)}
  },[])

  useEffect(()=>{
    async function load(){
      const [{data:prods},{data:cats}]=await Promise.all([
        supabase.from('products').select('*,categories(*)').eq('is_active',true).order('created_at',{ascending:false}),
        supabase.from('categories').select('*').order('sort_order'),
      ])
      setProducts(prods||[]); setCategories(cats||[]); setLoading(false)
    }
    load()
  },[])

  useEffect(()=>{
    const fetchBTC=async()=>{
      try{const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');const d=await r.json();if(d.bitcoin)setBtcPrice('$'+d.bitcoin.usd.toLocaleString())}catch{}
    }
    fetchBTC(); const i=setInterval(fetchBTC,30000); return()=>clearInterval(i)
  },[])

  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(null),3000)}
  const filtered=activeCategory==='todos'?products:products.filter(p=>(p.categories as any)?.slug===activeCategory)
  const featured=products.find(p=>p.is_featured)||products[0]

  return (
    <>
      <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}} />

      {/* TICKER */}
      <header className="ticker">
        <div className="ticker-logo">
          <div className="ticker-mark" />
          <span>VAULTLY</span>
        </div>
        <div className="ticker-items">
          {[
            {label:'Productos',val:String(products.length||'...'),cls:'v'},
            {label:'Categorías',val:String(categories.length||12),cls:'m'},
            {label:'BTC/USD',val:btcPrice,cls:''},
            {label:'Red',val:'TRC20 · BEP20',cls:''},
            {label:'Acceso',val:'Inmediato ⚡',cls:'m'},
          ].map((item,i)=>(
            <div key={i} className="ticker-item">
              <span className="tl">{item.label}</span>
              <span className={`tv ${item.cls}`}>{item.val}</span>
            </div>
          ))}
        </div>
        <div className="ticker-actions">
          <button className="btn-wallet" onClick={()=>showToast('Conecta tu wallet para comprar')}>
            <span className="pulse-dot" /> Wallet
          </button>
        </div>
      </header>

      <div className="vlt-wrapper">

        {/* NAV */}
        <nav className="vlt-nav">
          <div className="nav-cats">
            <button className={`nav-cat${activeCategory==='todos'?' active':''}`} onClick={()=>setActiveCategory('todos')}>
              Todos <span className="nav-cat-count">{products.length}</span>
            </button>
            {categories.map(cat=>(
              <button key={cat.slug} className={`nav-cat${activeCategory===cat.slug?' active':''}`} onClick={()=>setActiveCategory(cat.slug)}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          <input className="nav-search" placeholder="Buscar productos..." />
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">
            <span className="badge-dot" />
            Marketplace activo · Pago en USDT / Cripto
          </div>
          <h1 className="hero-title">
            PRODUCTOS<br />
            <span className="v">DIGITALES</span><br />
            <span className="m">PREMIUM</span>
          </h1>
          <p className="hero-sub">Para builders · by builder · desde Venezuela al mundo</p>
          <p className="hero-desc">Desde automatizaciones simples hasta soluciones enterprise. Todo probado, documentado y listo para producción. Acceso inmediato tras el pago.</p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={()=>document.getElementById('productos')?.scrollIntoView({behavior:'smooth'})}>⚡ Explorar productos</button>
            <button className="btn-secondary" onClick={()=>document.getElementById('como-funciona')?.scrollIntoView({behavior:'smooth'})}>¿Cómo funciona?</button>
          </div>
          <div className="hero-stats">
            {[
              {val:String(products.length||48),label:'Productos'},
              {val:String(categories.length||12),label:'Categorías'},
              {val:'USDT',label:'Pago cripto'},
              {val:'⚡',label:'Acceso inmediato'},
              {val:'100%',label:'Código tuyo'},
            ].map((s,i)=>(
              <div key={i} className="h-stat">
                <div className="h-stat-val">{s.val}</div>
                <div className="h-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="vlt-divider" />

        {/* FEATURED */}
        {featured && (
          <div className="featured-wrap">
            <div className="featured-card">
              <div>
                <div className="featured-label">⭐ Producto destacado</div>
                <div className="featured-title">{featured.name.toUpperCase()}</div>
                <div className="featured-desc">{featured.description}</div>
                <div className="featured-tags">
                  {featured.tech_stack?.map(t=>(<span key={t} className="featured-tag">{t}</span>))}
                </div>
              </div>
              <div className="featured-price-block">
                <div className="featured-price">{featured.price_usdt}</div>
                <div className="featured-price-label">USDT · Acceso vitalicio</div>
                <Link href={`/product/${featured.slug}`}>
                  <button className="btn-primary">Comprar ahora →</button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTOS */}
        <section id="productos" className="vlt-section">
          <div className="section-head">
            <div>
              <div className="section-title">PRODUCTOS <span>DISPONIBLES</span></div>
              <div className="section-sub">{filtered.length} productos encontrados</div>
            </div>
          </div>
          {loading ? (
            <div className="empty-state">Cargando productos...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No hay productos en esta categoría aún. Próximamente... 🔥</div>
          ) : (
            <div className="products-grid">
              {filtered.map(prod=>(
                <Link key={prod.id} href={`/product/${prod.slug}`} className="prod-card">
                  <div className="prod-thumb">
                    <span className="prod-thumb-icon">{(prod.categories as any)?.icon||'📦'}</span>
                    <span className="prod-cat-badge">{(prod.categories as any)?.name||'Digital'}</span>
                    {prod.is_new && <span className="prod-new-badge">NEW</span>}
                  </div>
                  <div className="prod-body">
                    <div className="prod-name">{prod.name}</div>
                    <div className="prod-desc">{prod.description}</div>
                    <div className="prod-footer">
                      <span className="prod-price">{prod.price_usdt}<span>USDT</span></span>
                      <span className="prod-btn">Comprar</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="vlt-divider" />

        {/* CATEGORÍAS */}
        <section className="vlt-section">
          <div className="section-title" style={{marginBottom:28}}>EXPLORA POR <span>CATEGORÍA</span></div>
          <div className="cats-grid">
            {categories.map(cat=>(
              <div key={cat.slug} className="cat-card" onClick={()=>{setActiveCategory(cat.slug);document.getElementById('productos')?.scrollIntoView({behavior:'smooth'})}}>
                <div className="cat-icon">{cat.icon}</div>
                <div className="cat-name">{cat.name}</div>
                <div className="cat-count">{products.filter(p=>(p.categories as any)?.slug===cat.slug).length} productos</div>
              </div>
            ))}
          </div>
        </section>

        <div className="vlt-divider" />

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" className="vlt-section">
          <div className="section-title" style={{marginBottom:28}}>¿CÓMO <span>FUNCIONA</span>?</div>
          <div className="how-grid">
            {[
              {n:'01',icon:'🔍',title:'Elige tu producto',desc:'Explora el catálogo. Cada producto tiene descripción detallada, stack tecnológico y precio en USDT.'},
              {n:'02',icon:'💳',title:'Realiza el pago',desc:'Transfiere en USDT a la wallet indicada. Soportamos TRC20, BEP20 y Binance Pay.'},
              {n:'03',icon:'✅',title:'Confirma la TX',desc:'Comparte el hash de tu transacción. Verificamos en blockchain en minutos.'},
              {n:'04',icon:'⚡',title:'Descarga inmediata',desc:'Acceso instantáneo al código completo, documentación y actualizaciones. 100% tuyo.'},
            ].map((s,i)=>(
              <div key={i} className="how-step">
                <div className="how-num">{s.n}</div>
                <div className="how-icon">{s.icon}</div>
                <div className="how-title">{s.title}</div>
                <div className="how-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST BAR */}
        <div className="trust-bar">
          {['Pago en USDT · TRC20 · BEP20 · Binance Pay','Acceso inmediato post-pago','Código 100% tuyo · Sin licencias','Documentación incluida','Soporte post-venta'].map((t,i)=>(
            <div key={i} className="trust-item">
              <span className="trust-dot" />
              <span className="trust-text">{t}</span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <footer className="vlt-footer">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <div className="footer-logo-mark" />
                <span>VAULTLY</span>
              </div>
              <div className="footer-tagline">Marketplace de productos digitales premium. Desde Venezuela al mundo, con pago en criptomonedas.</div>
            </div>
            {[
              {title:'Productos',items:['SaaS & Apps','Bots de Cripto','Automatizaciones','Plantillas Web','Enterprise']},
              {title:'Información',items:['¿Cómo comprar?','Wallets aceptadas','Política de acceso','Soporte','FAQ']},
              {title:'Contacto',items:['Telegram','Discord','Twitter / X','Email']},
            ].map(col=>(
              <div key={col.title}>
                <div className="footer-col-title">{col.title}</div>
                <ul className="footer-links">{col.items.map(item=>(<li key={item}>{item}</li>))}</ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2025 <span>Vaultly</span> · Todos los derechos reservados</div>
            <div className="footer-crypto">
              {['USDT · TRC20','USDT · BEP20','Binance Pay','BTC','ETH'].map(b=>(<span key={b} className="crypto-badge">{b}</span>))}
            </div>
          </div>
        </footer>
      </div>

      {toast && (
        <div className="vlt-toast">
          <span className="toast-dot" />{toast}
        </div>
      )}
    </>
  )
}
