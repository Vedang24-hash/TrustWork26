// =============================================================================
// supabase.js — Supabase client singleton
// Exported as a promise so it can be awaited once on first use.
// Returns null if env vars are missing or package not installed.
// =============================================================================

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

let _client = null

export async function getSupabase() {
  if (_client !== null) return _client

  if (!url || !key || url.includes('your-project')) {
    _client = false   // mark as "checked, not available"
    return null
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    _client = createClient(url, key)
    return _client
  } catch {
    _client = false
    return null
  }
}
