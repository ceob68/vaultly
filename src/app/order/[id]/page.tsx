'use client'
import { useEffect, useState } from 'react'
import { supabase, type Product, type Wallet } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ email: '', name: '', tx_hash: '', wallet_from: '' })
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: prod }, { data: wals }] = await Promise.all([
        supabase.from('products').select('*, categories(*)').eq('id', id).single(),
        supabase.from('payment_wallets').select('*').eq('is_active', true),
      ])
      setProduct(prod)
      setWallets(wals || [])
      if (wals && wals.length > 0) setSelectedWallet(wals[0])
    }
    load()
  }, [id])

  const copyAddress = () => {
    if (selectedWallet) {
      navigator.clipboard.writeText(selectedWallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const submitOrder = async () => {
    if (!form.email || !form.tx_hash || !selectedWallet || !product) return
    setLoading(true)
    const { data, error } = await supabase.from('orders').insert({
      product_id: product.id,
      buyer_email: form.email,
      buyer_name: form.name,
      amount_usdt: product.price_usdt,
      network: selectedWallet.network,
      wallet_from: form.wallet_from,
      tx_hash: form.tx_hash,
      status: 'verifying',
    }).select().single()

    if (!error && data) {
      setOrderId(data.id)
      setStep(3)
    }
    setLoading(false)
  }

  if (!product) return (
    <div style={{ minHeight:'100vh', background:'#030307', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Mono', color:'#4a4a6a' }}>
      Cargando...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#030307', color:'#E8E8F0', fontFamily:'Syne' }}>
      <header style={{ background:'#07070f', borderBottom:'1px solid rgba(108,71,255,0.12)', padding:'0 40px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ width:24, height:24, background:'conic-gradient(from 0deg,#6C47FF,#00D4AA,#00D4FF,#6C47FF)', borderRadius:'50%' }} />
          <span style={{ fontFamily:'Bebas Neue', fontSize:18, letterSpacing:3, color:'#6C47FF' }}>VAULTLY</span>
        </Link>
        <Link href={`/product/${product.slug}`}><button className="btn-secondary" style={{ padding:'6px 16px', fontSize:12 }}>← Volver al producto</button></Link>
      </header>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'60px 40px' }}>
        {/* STEPS */}
        <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:48 }}>
          {['Seleccionar red','Realizar pago','Confirmar'].map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, background: step > i+1 ? '#00D4AA' : step === i+1 ? '#6C47FF' : 'transparent', border: step <= i+1 ? '1px solid rgba(108,71,255,0.25)' : 'none', color: step >= i+1 ? '#fff' : '#4a4a6a' }}>
                  {step > i+1 ? '✓' : i+1}
                </div>
                <span style={{ fontFamily:'DM Mono', fontSize:10, color: step === i+1 ? '#6C47FF' : '#4a4a6a', letterSpacing:.5, whiteSpace:'nowrap' }}>{s}</span>
              </div>
              {i < 2 && <div style={{ width:60, height:1, background:'rgba(108,71,255,0.2)', margin:'0 8px', marginBottom:20 }} />}
            </div>
          ))}
        </div>

        {/* RESUMEN */}
        <div style={{ background:'#13132a', border:'1px solid rgba(108,71,255,0.2)', borderRadius:12, padding:20, marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:4 }}>Comprando</div>
            <div style={{ fontSize:15, fontWeight:700 }}>{product.name}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'DM Mono', fontSize:28, color:'#00D4AA', fontWeight:500 }}>{product.price_usdt}</div>
            <div style={{ fontSize:11, color:'#4a4a6a' }}>USDT</div>
          </div>
        </div>

        {/* STEP 1: Seleccionar red */}
        {step === 1 && (
          <div>
            <div style={{ fontFamily:'Bebas Neue', fontSize:24, letterSpacing:2, marginBottom:20 }}>SELECCIONA LA <span style={{ color:'#6C47FF' }}>RED DE PAGO</span></div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
              {wallets.map(w => (
                <div key={w.id} onClick={() => setSelectedWallet(w)}
                  style={{ background: selectedWallet?.id === w.id ? 'rgba(108,71,255,0.12)' : '#0a0a14', border: selectedWallet?.id === w.id ? '1px solid rgba(108,71,255,0.5)' : '1px solid rgba(108,71,255,0.12)', borderRadius:10, padding:'16px 20px', cursor:'pointer', transition:'all .18s', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{w.network}</div>
                    <div style={{ fontFamily:'DM Mono', fontSize:11, color:'#4a4a6a' }}>{w.address.slice(0,20)}...{w.address.slice(-8)}</div>
                  </div>
                  <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid', borderColor: selectedWallet?.id === w.id ? '#6C47FF' : 'rgba(108,71,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {selectedWallet?.id === w.id && <div style={{ width:10, height:10, borderRadius:'50%', background:'#6C47FF' }} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Datos del comprador */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontFamily:'Bebas Neue', fontSize:20, letterSpacing:2, marginBottom:16 }}>TUS <span style={{ color:'#6C47FF' }}>DATOS</span></div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="tu@email.com" style={{ width:'100%', padding:'10px 14px', background:'#0a0a14', border:'1px solid rgba(108,71,255,0.2)', borderRadius:8, color:'#E8E8F0', fontFamily:'DM Mono', fontSize:13, outline:'none' }} />
                </div>
                <div>
                  <label style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Nombre (opcional)</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Tu nombre" style={{ width:'100%', padding:'10px 14px', background:'#0a0a14', border:'1px solid rgba(108,71,255,0.2)', borderRadius:8, color:'#E8E8F0', fontFamily:'DM Mono', fontSize:13, outline:'none' }} />
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={() => form.email && setStep(2)} style={{ width:'100%', justifyContent:'center' }} disabled={!form.email}>
              Continuar al pago →
            </button>
          </div>
        )}

        {/* STEP 2: Realizar pago */}
        {step === 2 && selectedWallet && (
          <div>
            <div style={{ fontFamily:'Bebas Neue', fontSize:24, letterSpacing:2, marginBottom:20 }}>REALIZA EL <span style={{ color:'#6C47FF' }}>PAGO</span></div>

            <div style={{ background:'#0a0a14', border:'1px solid rgba(0,212,170,0.2)', borderRadius:12, padding:24, marginBottom:24 }}>
              <div style={{ fontFamily:'DM Mono', fontSize:11, color:'#4a4a6a', marginBottom:8 }}>Red seleccionada</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#00D4AA', marginBottom:16 }}>{selectedWallet.network}</div>

              <div style={{ fontFamily:'DM Mono', fontSize:11, color:'#4a4a6a', marginBottom:8 }}>Envía exactamente</div>
              <div style={{ fontFamily:'DM Mono', fontSize:32, fontWeight:500, color:'#00D4AA', marginBottom:20 }}>
                {product.price_usdt} <span style={{ fontSize:16, color:'#4a4a6a' }}>USDT</span>
              </div>

              <div style={{ fontFamily:'DM Mono', fontSize:11, color:'#4a4a6a', marginBottom:8 }}>A esta dirección</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, background:'#13132a', border:'1px solid rgba(108,71,255,0.2)', borderRadius:8, padding:'10px 14px', fontFamily:'DM Mono', fontSize:12, color:'#8888a8', wordBreak:'break-all' }}>
                  {selectedWallet.address}
                </div>
                <button onClick={copyAddress} style={{ background: copied ? 'rgba(0,212,170,0.15)' : 'rgba(108,71,255,0.15)', border:'1px solid', borderColor: copied ? 'rgba(0,212,170,0.3)' : 'rgba(108,71,255,0.3)', borderRadius:8, padding:'10px 16px', color: copied ? '#00D4AA' : '#A78BFA', fontFamily:'DM Mono', fontSize:11, cursor:'pointer', whiteSpace:'nowrap', transition:'all .18s' }}>
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div style={{ background:'rgba(255,181,71,0.08)', border:'1px solid rgba(255,181,71,0.2)', borderRadius:10, padding:16, marginBottom:24 }}>
              <div style={{ fontSize:12, color:'#FFB547', lineHeight:1.6 }}>
                ⚠️ Envía el monto exacto de {product.price_usdt} USDT. Guarda el hash/ID de la transacción ya que lo necesitarás en el siguiente paso.
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:8 }}>Hash / ID de transacción *</label>
              <input type="text" value={form.tx_hash} onChange={e => setForm({...form, tx_hash:e.target.value})} placeholder="0x... o TXID de la transacción" style={{ width:'100%', padding:'10px 14px', background:'#0a0a14', border:'1px solid rgba(108,71,255,0.2)', borderRadius:8, color:'#E8E8F0', fontFamily:'DM Mono', fontSize:13, outline:'none' }} />
            </div>

            <div style={{ marginBottom:28 }}>
              <label style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:8 }}>Tu wallet (desde donde envías)</label>
              <input type="text" value={form.wallet_from} onChange={e => setForm({...form, wallet_from:e.target.value})} placeholder="Tu dirección de wallet (opcional)" style={{ width:'100%', padding:'10px 14px', background:'#0a0a14', border:'1px solid rgba(108,71,255,0.2)', borderRadius:8, color:'#E8E8F0', fontFamily:'DM Mono', fontSize:13, outline:'none' }} />
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex:1, justifyContent:'center' }}>← Atrás</button>
              <button className="btn-primary" onClick={submitOrder} disabled={!form.tx_hash || loading} style={{ flex:2, justifyContent:'center' }}>
                {loading ? 'Enviando...' : 'Confirmar pago →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmado */}
        {step === 3 && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
            <div style={{ fontFamily:'Bebas Neue', fontSize:36, letterSpacing:2, color:'#00D4AA', marginBottom:8 }}>PAGO REGISTRADO</div>
            <div style={{ fontFamily:'DM Mono', fontSize:12, color:'#8888a8', lineHeight:1.7, marginBottom:32 }}>
              Tu pago está siendo verificado en la blockchain.<br />
              Recibirás acceso a la descarga en tu email <span style={{ color:'#6C47FF' }}>{form.email}</span> una vez confirmado.<br />
              Tiempo estimado: 5-30 minutos.
            </div>
            <div style={{ background:'#13132a', border:'1px solid rgba(108,71,255,0.2)', borderRadius:12, padding:20, marginBottom:32, textAlign:'left' }}>
              <div style={{ fontFamily:'DM Mono', fontSize:10, color:'#4a4a6a', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Resumen de tu orden</div>
              {[
                { label:'Producto', val:product.name },
                { label:'Monto', val:`${product.price_usdt} USDT` },
                { label:'Red', val:selectedWallet?.network || '' },
                { label:'TX Hash', val:form.tx_hash.slice(0,20)+'...' },
                { label:'Email', val:form.email },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(108,71,255,0.08)' }}>
                  <span style={{ fontFamily:'DM Mono', fontSize:11, color:'#4a4a6a' }}>{row.label}</span>
                  <span style={{ fontFamily:'DM Mono', fontSize:11, color:'#8888a8' }}>{row.val}</span>
                </div>
              ))}
            </div>
            <Link href="/"><button className="btn-primary" style={{ margin:'0 auto' }}>← Volver al marketplace</button></Link>
          </div>
        )}
      </div>
    </div>
  )
}
