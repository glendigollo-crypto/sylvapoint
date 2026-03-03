// ---------------------------------------------------------------------------
// Supabase Admin (Service Role) Client — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Creates a Supabase client using the service_role key, which bypasses
// Row Level Security.  This client must ONLY be used server-side (API
// routes, background jobs) and NEVER exposed to the browser.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

/**
 * Returns (or lazily creates) a Supabase client that uses the service_role
 * key.  This bypasses RLS entirely, so it should only be used for trusted
 * server-side write operations (e.g. inserting audit results from the
 * scoring pipeline, updating lead nurture status).
 *
 * The client is created once per Node process and reused thereafter.
 */
export function getAdminSupabase(): SupabaseClient {
  if (_adminClient) {
    return _adminClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing environment variable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL). ' +
        'Add it to your .env.local file.',
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. ' +
        'Add it to your .env.local file.',
    );
  }

  _adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Service role: no session persistence, no auto-refresh.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _adminClient;
}

// ---------------------------------------------------------------------------
// Convenience alias — backward-compatible named export used by existing code
// ---------------------------------------------------------------------------

/**
 * Lazily-initialized admin client proxy.
 *
 * Prefer `getAdminSupabase()` for new code. This export exists for backward
 * compatibility with files that import `supabaseAdmin`. Uses a getter to
 * defer initialization until first use (avoids throwing during build).
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getAdminSupabase(), prop, receiver);
  },
});
