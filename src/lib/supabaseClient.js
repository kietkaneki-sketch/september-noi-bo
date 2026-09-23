import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Fails loudly at build/dev time instead of silently returning empty data everywhere.
  throw new Error(
    'Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Tạo file .env ở gốc project (xem .env.example).'
  )
}

export const supabase = createClient(url, anonKey)

// All employee accounts log in with a plain "username" (no email needed in the UI).
// We keep this deterministic so login never needs an extra lookup query.
export const AUTH_DOMAIN = '@september.internal'
export const usernameToEmail = (username) => `${username.trim().toLowerCase()}${AUTH_DOMAIN}`
