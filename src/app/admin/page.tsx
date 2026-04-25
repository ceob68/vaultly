'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string; buyer_email: string; buyer_name: string; amount_usdt: number
  network: string; tx_hash: string; status: string; created_at: string
  download_token: string; ref_code: string
  products?: { name: string }
}

const S = {
  page:  { minHeight:'100vh', background:'#030307', color:'#E8E8F0', fontFamily:'Syne' as const },
  nav:   { background:'#07070f', borderBottom:'1px solid rgba(108,71,255,0.12)', padding:'0 32px', height:52, display:'flex' as const, alignItems:'center' as const, justifyContent:'space-between' as const },
  main:  { maxWidth:1200, margin:'0 auto', padding:'40px 32px' },
  card:  { background:'#13132a', border:'1px solid rgba(108,71,255,0.2)', borderRadius:12, padding:24, marginBottom:24 },
  input: { background:'#07070f', border:'1px solid rgba(108,71,255,0.2)', borderRadius:8, padding:'10px 14px', color:'#E8E8F0', fontFamily:'DM Mono' as const, fontSize:13, width:'100%', outline:'none' },
  btn:   { background:'#6C47FF', border:'1px solid rgba(108,71,255,0.5)', borderRadius:8, padding:'10px 24px', color:'#fff', fontFamily:'Syne' as const, fontSize:13, fontWeight:700 as const, cursor:'pointer' as const },
  btnSm: { border:'none', borderRadius:6, padding:'5px 12px', fontSize:11, fontWeight:600 as const, cursor:'pointer' as const, fontFamily:'DM Mono' as const },
  th:    { fontFamily:'DM Mono' as const, fontSize:10, color:'#4a4a6a', textTransform:'uppercase' as const, letterSpacing:1.5, padding:'8px 12px', borderBottom:'1px solid rgba(108,71,255,0.1)', textAlign:'left' as const },
  td:    { padding:'12px', borderBottom:'1px solid rgba(108,71,255,0.06)', fontSize:12, color:'#8888a8', fontFamily:'DM Mono' as const, verticalAlign:'middle' as const },
}

const STATUS_C: Record<string,{bg:string;color:string}> = {
  pending:   {bg:'rgba(255,181,71,0.12)',  color:'#FFB547'},
  verifying: {bg:'rgba(108,71,255,0.12)', color:'#A78BFA'},
  confirmed: {bg:'rgba(0,212,170,0.12)',  color:'#00D4AA'},
  rejected:  {bg:'rgba(255,59,92,0.12)',  color:'#FF3B5C'},
}

export default function AdminPage() {
  const [secret, setSecret]   = useState('')
  const [auth, setAuth]       = useState(false)
  const [orders, setOrders]   = useState<Order[]>([])
  const [filter, setFilter]   = useState('verifying')
  const [loading, setLoading] = useState(false)
  const [toast, setToast]     = useState<string|null>(null)
  const [stats, setStats]     = useState({total:0,confirmed:0,pending:0,revenue:0})

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null),3500) }

  // Secret se envía siempre por Authorization header
  const authHeaders = () => ({ 'Content-Type':'application/json', 'Authorization':`Bearer ${secret}` })

  const loadOrders = async (status: string) => {
    setLoading(true)
    const res = await fetch(`/api/verify?status=${status}`, { headers: authHeaders() })
    const data = await res.json()
    setOrders(data.orders || [])
    setLoading(false)
  }

  const loadStats = async () => {
    const statuses = ['pending','verifying','confirmed','rejected']
    const results = await Promise.all(
      statuses.map(s => fetch(`/api/verify?status=${s}`, { headers: authHeaders() }).then(r=>r.json()))
    )
    const [pend, verif, conf] = results
    const totalOrders = results.reduce((a,r)=>a+(r.orders?.length||0),0)
    const revenue = (conf.orders||[]).reduce((a:number,o:Order)=>a+Number(o.amount_usdt),0)
    setStats({ total:totalOrders, pending:(pend.orders?.length||0)+(verif.orders?.length||0), confirmed:conf.orders?.length||0, revenue })
  }

  const handleLogin = async () => {
    const res = await fetch('/api/verify?status=verifying', { headers: authHeaders() })
    if (res.ok) { setAuth(true); loadOrders('verifying'); loadStats() }
    else showToast('❌ Contraseña incorrecta')
  }

  const handleAction = async (orderId: string, action: 'confirmed'|'rejected', autoVerify=false) => {
    const res = await fetch('/api/verify', {
      method:'POST',
      headers: authHeaders(),
      body: JSON.stringify({ order_id:orderId, action, admin_secret:secret, auto_verify:autoVerify }),
    })
    const data = await res.json()
    if (data.success) {
      if (action==='confirmed' && data.download_url) {
        navigator.clipboard.writeText(data.download_url).catch(()=>{})
        showToast('✅ Confirmado · URL de descarga copiada')
      } else {
        showToast(action==='confirmed'?'✅ Confirmado':'❌ Rechazado')
      }
      loadOrders(filter); loadStats()
    } else {
      showToast('Error: '+(data.error||'Desconocido'))
    }
  }

  if (!auth) return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{...S.card,maxWidth:400,width:'100%',textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>🔐</div>
        <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:2,marginBottom:24}}>PANEL ADMIN</div>
        <input style={{...S.input,marginBottom:16}} type="password" value={secret} onChange={e=>setSecret(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Contraseña de acceso" />
        <button style={{...S.btn,width:'100%'}} onClick={handleLogin}>Entrar</button>
        <div style={{marginTop:16}}><Link href="/" style={{fontFamily:'DM Mono',fontSize:11,color:'#4a4a6a'}}>← Volver al marketplace</Link></div>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <header style={S.nav}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <div style={{width:22,height:22,background:'conic-gradient(from 0deg,#6C47FF,#00D4AA,#00D4FF,#6C47FF)',borderRadius:'50%'}}/>
          <span style={{fontFamily:'Bebas Neue',fontSize:17,letterSpacing:3,color:'#6C47FF'}}>VAULTLY</span>
          <span style={{fontFamily:'DM Mono',fontSize:10,color:'#4a4a6a'}}>/ADMIN</span>
        </Link>
        <div style={{fontFamily:'DM Mono',fontSize:11,color:'#00D4AA',display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#00D4AA',boxShadow:'0 0 6px #00D4AA'}}/>Panel activo
        </div>
      </header>

      <div style={S.main}>
        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:32}}>
          {[
            {label:'Total órdenes',val:stats.total,color:'#E8E8F0'},
            {label:'Pendientes',val:stats.pending,color:'#FFB547'},
            {label:'Confirmadas',val:stats.confirmed,color:'#00D4AA'},
            {label:'Revenue USDT',val:stats.revenue.toFixed(2),color:'#6C47FF'},
          ].map(s=>(
            <div key={s.label} style={{background:'#0f0f1e',border:'1px solid rgba(108,71,255,0.12)',borderRadius:10,padding:'18px 20px'}}>
              <div style={{fontFamily:'DM Mono',fontSize:10,color:'#4a4a6a',textTransform:'uppercase',letterSpacing:1.5,marginBottom:8}}>{s.label}</div>
              <div style={{fontFamily:'DM Mono',fontSize:28,fontWeight:500,color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* ÓRDENES */}
        <div style={S.card}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:2}}>ÓRDENES</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {['verifying','pending','confirmed','rejected'].map(f=>(
                <button key={f} onClick={()=>{setFilter(f);loadOrders(f)}} style={{...S.btnSm,background:filter===f?'#6C47FF':'rgba(108,71,255,0.08)',color:filter===f?'#fff':'#8888a8',border:`1px solid ${filter===f?'rgba(108,71,255,0.5)':'rgba(108,71,255,0.15)'}`,textTransform:'capitalize'}}>{f}</button>
              ))}
              <button onClick={()=>loadOrders(filter)} style={{...S.btnSm,background:'rgba(0,212,170,0.1)',color:'#00D4AA',border:'1px solid rgba(0,212,170,0.2)'}}>↻ Actualizar</button>
            </div>
          </div>

          {loading ? (
            <div style={{textAlign:'center',padding:40,fontFamily:'DM Mono',fontSize:12,color:'#4a4a6a'}}>Cargando...</div>
          ) : orders.length===0 ? (
            <div style={{textAlign:'center',padding:40,fontFamily:'DM Mono',fontSize:12,color:'#4a4a6a'}}>Sin órdenes con estado "{filter}"</div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>{['Fecha','Cliente','Producto','Monto','Red','TX Hash','Ref','Estado','Acciones'].map(h=>(<th key={h} style={S.th}>{h}</th>))}</tr>
                </thead>
                <tbody>
                  {orders.map(order=>(
                    <tr key={order.id}>
                      <td style={S.td}>{new Date(order.created_at).toLocaleDateString('es')}</td>
                      <td style={S.td}><div style={{color:'#E8E8F0'}}>{order.buyer_name||'—'}</div><div style={{fontSize:10,color:'#4a4a6a'}}>{order.buyer_email}</div></td>
                      <td style={{...S.td,color:'#E8E8F0'}}>{order.products?.name||'—'}</td>
                      <td style={{...S.td,color:'#00D4AA'}}>{order.amount_usdt} USDT</td>
                      <td style={S.td}>{order.network}</td>
                      <td style={S.td}>
                        <a href={`https://tronscan.org/#/transaction/${order.tx_hash}`} target="_blank" rel="noreferrer" style={{color:'#6C47FF',textDecoration:'none',fontSize:11}}>
                          {order.tx_hash?.slice(0,14)}...
                        </a>
                      </td>
                      <td style={S.td}>{order.ref_code||'—'}</td>
                      <td style={S.td}>
                        <span style={{...S.btnSm,cursor:'default',background:STATUS_C[order.status]?.bg||'transparent',color:STATUS_C[order.status]?.color||'#8888a8',border:`1px solid ${STATUS_C[order.status]?.color||'#8888a8'}30`,padding:'3px 10px'}}>
                          {order.status}
                        </span>
                      </td>
                      <td style={S.td}>
                        {order.status==='verifying' && (
                          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                            <button onClick={()=>handleAction(order.id,'confirmed',true)} style={{...S.btnSm,background:'rgba(0,212,170,0.08)',color:'#00D4AA',border:'1px solid rgba(0,212,170,0.25)'}}>⚡ Auto</button>
                            <button onClick={()=>handleAction(order.id,'confirmed',false)} style={{...S.btnSm,background:'rgba(0,212,170,0.15)',color:'#00D4AA',border:'1px solid rgba(0,212,170,0.3)'}}>✓ Manual</button>
                            <button onClick={()=>handleAction(order.id,'rejected')} style={{...S.btnSm,background:'rgba(255,59,92,0.12)',color:'#FF3B5C',border:'1px solid rgba(255,59,92,0.25)'}}>✗</button>
                          </div>
                        )}
                        {order.status==='confirmed' && (
                          <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/download/${order.download_token}`);showToast('URL copiada')}} style={{...S.btnSm,background:'rgba(108,71,255,0.12)',color:'#A78BFA',border:'1px solid rgba(108,71,255,0.25)'}}>📋 URL</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:'#13132a',border:'1px solid rgba(108,71,255,0.3)',borderRadius:10,padding:'12px 18px',fontFamily:'DM Mono',fontSize:12,color:'#E8E8F0',zIndex:9999,boxShadow:'0 8px 32px rgba(0,0,0,.4)'}}>
          {toast}
        </div>
      )}
    </div>
  )
}
