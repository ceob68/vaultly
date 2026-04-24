import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Category = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  sort_order: number
}

export type Product = {
  id: string
  slug: string
  name: string
  description: string
  long_description: string
  category_id: string
  price_usdt: number
  tags: string[]
  tech_stack: string[]
  thumbnail_url: string
  preview_url: string
  file_url: string
  file_size: string
  version: string
  is_featured: boolean
  is_active: boolean
  is_new: boolean
  downloads: number
  created_at: string
  categories?: Category
}

export type Order = {
  id: string
  product_id: string
  buyer_email: string
  buyer_name: string
  amount_usdt: number
  network: string
  wallet_from: string
  tx_hash: string
  status: 'pending' | 'verifying' | 'confirmed' | 'rejected' | 'refunded'
  download_token: string
  download_count: number
  max_downloads: number
  expires_at: string
  created_at: string
}

export type Wallet = {
  id: string
  network: string
  address: string
  is_active: boolean
}
