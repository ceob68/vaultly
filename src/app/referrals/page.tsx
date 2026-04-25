'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RefStats {
  code: string
  owner_name: string
  commission_pct: number
  total_sales: number
  total_earned: number
  created_at: string
}

export default function ReferralsPage() {
  const [step, setStep]       = useState<'register'|'dashboard'>('register')
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats]     = useState<RefStats|null>(null)
  const [toast, setToast]     = useState<string|null>(null)
  const [copied, setCopied]   = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null), 3000) }

  // Auto-cargar si hay código guardado en localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vaultly_ref_code')
    if (saved) loadStats(saved)
  }, [])

  const loadStats = async (code: string) => {
    const res = await fetch(`/api/referrals?code=${code}`)
    if (res.ok) {
      const data = await res.json()
      setStats(data)
      setStep('dashboard')
    }
  }

  const handleRegister = async () => {
    if (!email) return showToast('Ingresa tu email')
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRx.test(email)) return showToast('Email inválido')
    setLoading(true)
    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase(), name }),
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('vaultly_ref_code', data.code)
      await loadStats(data.code)
      showToast(data.existing ? '¡Bienvenido de vuelta!' : '🎉 ¡Código creado exitosamente!')
    } else {
      showToast('Error: ' + (data.error || 'Inténtalo de nuevo'))
    }
    setLoading(false)
  }

  const refLink = stats ? `https://vaultly-sage.vercel.app/?ref=${stats.code}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true)
      showToast('🔗 Link copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Estilos
  const S = {
    page:    { minHeight:'100vh', background:'#030307', color:'#E8E8F0', fontFamily:'Syne, sans-serif' },
    nav:     { background:'#07070f', borderBottom:'1px solid rgba(108,71,255,0.12)', padding:'0 32px', height:52, display:'flex' as const, alignItems:'center' as const, justifyContent:'space-between' as const },
    main:    { maxWidth:760, margin:'0 auto', padding:'60px 24px' },
    card:    { background:'#13132a', border:'1px solid rgba(108,71,255,0.2)', borderRadius:16, padding:'40px', marginBottom:20 },
    title:   { fontFamily:'Bebas Neue, sans-serif', fontSize:32, letterSpacing:3, color:'#E8E8F0', marginBottom:8 },
    label:   { fontFamily:'DM Mono, monospace', fontSize:10, color:'#4a4a6a', textTransform:'uppercase' as const, letterSpacing:2, marginBottom:8, display:'block' as const },
    input:   { background:'#07070f', border:'1px solid rgba(108,71,255,0.2)', borderRadius:8, padding:'11px 14px', color:'#E8E8F0', fontFamily:'DM Mono, monospace', fontSize:13, width:'100%', outline:'none', transition:'border .18s' },
    btn:     { background:'#6C47FF', border:'1px solid rgba(108,71,255,0.5)', borderRadius:10, padding:'12px 28px', color:'#fff', fontFamily:'Syne, sans-serif', fontSize:14, fontWeight:700 as const, cursor:'pointer' as const, width:'100%', transition:'all .18s' },
    statRow: { display:'grid' as const, gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 },
    statBox: { background:'#0f0f1e', border:'1px solid rgba(108,71,255,0.12)', borderRadius:10, padding:'18px 16px', textAlign:'center' as const },
    statVal: { fontFamily:'DM Mono, monospace', fontSize:26, fontWeight:500 as const, color:'#00D4AA', marginBottom:4 },
    statLbl: { fontFamily:'DM Mono, monospace', fontSize:10, color:'#4a4a6a', textTransform:'uppercase' as const, letterSpacing:1.5 },
    linkBox: { background:'#07070f', border:'1px solid rgba(108,71,255,0.25)', borderRadius:10, padding:'14px 16px', display:'flex' as const, alignItems:'center' as const, justifyContent:'space-between' as const, gap:12, marginBottom:20 },
    linkText:{ fontFamily:'DM Mono, monospace', fontSize:12, color:'#A78BFA', wordBreak:'break-all' as const, flex:1 },
    copyBtn: { background:'rgba(108,71,255,0.15)', border:'1px solid rgba(108,71,255,0.3)', borderRadius:8, padding:'8px 16px', color:'#A78BFA', fontFamily:'DM Mono, monospace', fontSize:12, fontWeight:600 as const, cursor:'pointer' as const, flexShrink:0, transition:'all .18s', whiteSpace:'nowrap' as const },
  }

  return (
    <div style={S.page}>
      {/* NAV */}
      <header style={S.nav}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ width:22, height:22, background:'conic-gradient(from 0deg,#6C47FF,#00D4AA,#00D4FF,#6C47FF)', borderRadius:'50%' }} />
          <span style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:17, letterSpacing:3, color:'#6C47FF' }}>VAULTLY</span>
        </Link>
        <span style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'#4a4a6a' }}>Programa de Afiliados</span>
      </header>

      <div style={S.main}>

        {step === 'register' && (
          <>
            {/* HERO */}
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(108,71,255,0.1)', border:'1px solid rgba(108,71,255,0.25)', borderRadius:20, padding:'6px 16px', fontFamily:'DM Mono, monospace', fontSize:11, color:'#A78BFA', marginBottom:20 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#00D4AA', boxShadow:'0 0 8px #00D4AA', display:'inline-block' }} />
                Programa activo · 20% de comisión
              </div>
              <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:52, letterSpacing:3, color:'#E8E8F0', lineHeight:.95, marginBottom:16 }}>
                GANA <span style={{ color:'#00D4AA' }}>USDT</span><br />RECOMENDANDO
              </div>
              <p style={{ fontFamily:'DM Mono, monospace', fontSize:13, color:'#8888a8', lineHeight:1.7, maxWidth:480, margin:'0 auto' }}>
                Comparte tu link único. Cada vez que alguien compre usando tu referido, recibes <strong style={{ color:'#00D4AA' }}>20% en USDT</strong> automáticamente.
              </p>
            </div>

            {/* CÓMO FUNCIONA */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:40 }}>
              {[
                { n:'01', icon:'🔗', title:'Obtén tu link', desc:'Regístrate con tu email y recibe tu link único personalizado.' },
                { n:'02', icon:'📣', title:'Comparte', desc:'Comparte en redes, grupos, canales. Sin límite de referencias.' },
                { n:'03', icon:'💰', title:'Cobra en USDT', desc:'20% de cada venta. Pagado a tu wallet cuando lo solicites.' },
              ].map(s => (
                <div key={s.n} style={{ background:'#0f0f1e', border:'1px solid rgba(108,71,255,0.1)', borderRadius:12, padding:'20px 16px' }}>
                  <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:32, color:'rgba(108,71,255,0.2)', lineHeight:1, marginBottom:10 }}>{s.n}</div>
                  <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#E8E8F0', marginBottom:6 }}>{s.title}</div>
                  <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'#4a4a6a', lineHeight:1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>

            {/* FORM */}
            <div style={S.card}>
              <div style={S.title}>ÚNETE AL PROGRAMA</div>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'#4a4a6a', marginBottom:28 }}>Es gratis. Solo necesitas tu email.</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                <div>
                  <label style={S.label}>Tu nombre (opcional)</label>
                  <input style={S.input} type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Carlos García" />
                </div>
                <div>
                  <label style={S.label}>Email *</label>
                  <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleRegister()} placeholder="tu@email.com" />
                </div>
              </div>
              <button style={{ ...S.btn, opacity:loading?.8:1 }} onClick={handleRegister} disabled={loading}>
                {loading ? 'Generando tu código...' : '⚡ Obtener mi link de referido'}
              </button>
              <div style={{ marginTop:14, fontFamily:'DM Mono, monospace', fontSize:10, color:'#4a4a6a', textAlign:'center' as const }}>
                Si ya tienes código, ingresa tu email y lo recuperamos automáticamente.
              </div>
            </div>
          </>
        )}

        {step === 'dashboard' && stats && (
          <>
            <div style={{ marginBottom:32 }}>
              <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:36, letterSpacing:3, color:'#E8E8F0', marginBottom:4 }}>
                BIENVENIDO, <span style={{ color:'#6C47FF' }}>{stats.owner_name?.toUpperCase() || 'AFILIADO'}</span>
              </div>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'#4a4a6a' }}>
                Código: <span style={{ color:'#A78BFA' }}>{stats.code}</span> · {stats.commission_pct}% de comisión por venta
              </div>
            </div>

            {/* STATS */}
            <div style={S.statRow}>
              <div style={S.statBox}>
                <div style={S.statVal}>{stats.total_sales}</div>
                <div style={S.statLbl}>Ventas generadas</div>
              </div>
              <div style={S.statBox}>
                <div style={{ ...S.statVal, color:'#6C47FF' }}>{stats.total_earned.toFixed(2)}</div>
                <div style={S.statLbl}>USDT ganados</div>
              </div>
              <div style={S.statBox}>
                <div style={{ ...S.statVal, color:'#FFB547' }}>{stats.commission_pct}%</div>
                <div style={S.statLbl}>Comisión</div>
              </div>
            </div>

            {/* LINK */}
            <div style={S.card}>
              <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:20, letterSpacing:2, marginBottom:16 }}>TU LINK DE REFERIDO</div>
              <div style={S.linkBox}>
                <span style={S.linkText}>{refLink}</span>
                <button style={{ ...S.copyBtn, background: copied ? 'rgba(0,212,170,0.15)' : 'rgba(108,71,255,0.15)', color: copied ? '#00D4AA' : '#A78BFA', borderColor: copied ? 'rgba(0,212,170,0.3)' : 'rgba(108,71,255,0.3)' }} onClick={copyLink}>
                  {copied ? '✓ Copiado' : '📋 Copiar'}
                </button>
              </div>

              {/* Share buttons */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
                {[
                  { label:'Twitter/X', color:'rgba(0,212,255,0.1)', border:'rgba(0,212,255,0.25)', text:'#00D4FF', url:`https://twitter.com/intent/tweet?text=Encontré este marketplace de productos digitales premium, pago en cripto y acceso inmediato 🔥&url=${encodeURIComponent(refLink)}` },
                  { label:'WhatsApp', color:'rgba(0,212,170,0.1)', border:'rgba(0,212,170,0.25)', text:'#00D4AA', url:`https://wa.me/?text=Mira este marketplace de productos digitales: ${encodeURIComponent(refLink)}` },
                  { label:'Telegram', color:'rgba(108,71,255,0.1)', border:'rgba(108,71,255,0.25)', text:'#A78BFA', url:`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=Marketplace de productos digitales premium 🔐` },
                ].map(btn => (
                  <a key={btn.label} href={btn.url} target="_blank" rel="noreferrer" style={{ background:btn.color, border:`1px solid ${btn.border}`, borderRadius:8, padding:'8px 16px', color:btn.text, fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:600, cursor:'pointer', textDecoration:'none' }}>
                    {btn.label}
                  </a>
                ))}
              </div>
            </div>

            {/* INSTRUCCIONES DE COBRO */}
            <div style={{ ...S.card, background:'rgba(108,71,255,0.04)' }}>
              <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:18, letterSpacing:2, marginBottom:14 }}>¿CÓMO COBRAR?</div>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:12, color:'#8888a8', lineHeight:1.8 }}>
                1. Cuando acumules ganancias, envía un mensaje por Telegram/Email con tu código <span style={{ color:'#A78BFA' }}>{stats.code}</span> y tu wallet USDT.<br />
                2. Verificamos tus conversiones en el panel admin.<br />
                3. Te enviamos el pago en USDT TRC20 o BEP20.<br />
                <br />
                <span style={{ color:'#4a4a6a' }}>Pago mínimo: 5 USDT · Tiempo de proceso: 24-48h</span>
              </div>
            </div>

            <div style={{ textAlign:'center' as const, marginTop:8 }}>
              <button onClick={()=>{ localStorage.removeItem('vaultly_ref_code'); setStep('register'); setStats(null) }} style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'#4a4a6a', background:'none', border:'none', cursor:'pointer' }}>
                Cambiar de cuenta
              </button>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#13132a', border:'1px solid rgba(108,71,255,0.3)', borderRadius:10, padding:'12px 18px', fontFamily:'DM Mono, monospace', fontSize:12, color:'#E8E8F0', zIndex:9999, boxShadow:'0 8px 32px rgba(0,0,0,.4)', minWidth:240 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
