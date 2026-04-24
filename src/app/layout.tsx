import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vaultly — Premium Digital Products',
  description: 'Marketplace de productos digitales premium. SaaS, bots cripto, automatizaciones, plantillas y más. Pago en criptomonedas.',
  keywords: 'digital products, saas, crypto bots, automation, templates, usdt, marketplace',
  openGraph: {
    title: 'Vaultly — Premium Digital Products',
    description: 'Productos digitales premium. Pago en USDT. Acceso inmediato.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
