# Vaultly 🔐

Marketplace de productos digitales premium con pago en criptomonedas.

## Stack
- **Frontend:** Next.js 15 + TypeScript
- **DB:** Supabase (PostgreSQL)
- **Deploy:** Vercel
- **Pagos:** USDT TRC20 · BEP20 · Binance Pay

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Edita .env.local con tus credenciales
npm run dev
```

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
ADMIN_SECRET=
```

## API Admin

Verificar órdenes pendientes:
```
GET /api/verify?secret=TU_ADMIN_SECRET&status=verifying
```

Confirmar/rechazar orden:
```
POST /api/verify
{ "order_id": "...", "action": "confirmed", "admin_secret": "..." }
```

## Flujo de compra

1. Usuario elige producto → `/product/[slug]`
2. Selecciona red de pago → `/order/[id]`
3. Realiza transferencia USDT → comparte TX hash
4. Admin verifica → `/api/verify`
5. Usuario descarga → `/download/[token]`
