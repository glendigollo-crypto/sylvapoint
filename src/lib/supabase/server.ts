// ---------------------------------------------------------------------------
// Supabase Server Client — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Creates a Supabase client for use in Next.js API routes and server
// components.  Uses the anon key so all reads still go through RLS.
//
// For write operations that need to bypass RLS, use the admin client
// exported from ./admin.ts instead.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _serverClient: SupabaseClient | null = null;

/**
 * Returns (or lazily creates) a Supabase client intended for server-side
 * read operations within API routes, server components, and middleware.
 *
 * The client is created once per Node process and reused thereafter.
 * It uses the anon key so queries respect RLS policies.
 */
export function getServerSupabase(): SupabaseClient {
  if (_serverClient) {
    return _serverClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing environment variable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL). ' +
        'Add it to your .env.local file.',
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing environment variable: SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY). ' +
        'Add it to your .env.local file.',
    );
  }

  _serverClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Server-side: no session persistence needed.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _serverClient;
}
