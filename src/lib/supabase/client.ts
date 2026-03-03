// ---------------------------------------------------------------------------
// Supabase Browser Client — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// This module creates a singleton Supabase client for use in browser-side
// React components. It relies on the public (anon) key so all queries are
// subject to Row Level Security.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
      'Add it to your .env.local file.',
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add it to your .env.local file.',
  );
}

/**
 * Singleton Supabase client for browser-side usage.
 *
 * Uses the anon key so every request goes through RLS.
 * Persists the session in localStorage by default.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
