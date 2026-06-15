// Supabase Client Configuration
// When real Supabase credentials are provided, this connects to the live instance.
// Otherwise, falls back to mock mode for demo purposes.

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Support both variable names: ANON_KEY (standard) and PUBLISHABLE_KEY (newer Supabase dashboard)
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

let _supabase: SupabaseClient | null = null
let _connectionTested = false
let _isConnected = false

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
}

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    if (isSupabaseConfigured()) {
      _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      })
    } else {
      // Return a placeholder client that won't crash
      _supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
    }
  }
  return _supabase
}

// Test if Supabase connection actually works (tables exist)
export async function testSupabaseConnection(): Promise<boolean> {
  if (_connectionTested) return _isConnected
  if (!isSupabaseConfigured()) {
    _connectionTested = true
    _isConnected = false
    return false
  }
  try {
    const client = getSupabaseClient()
    // Try a lightweight query — just check if the users_profile table exists
    const { error } = await client.from('users_profile').select('id', { count: 'exact', head: true })
    _isConnected = !error
    _connectionTested = true
    return _isConnected
  } catch {
    _connectionTested = true
    _isConnected = false
    return false
  }
}

// Reset connection test (e.g., after tables are created)
export function resetConnectionTest() {
  _connectionTested = false
  _isConnected = false
}

export const supabase = getSupabaseClient()
