import { createBrowserClient } from '@supabase/ssr';

// Fallback placeholders allow the client to be created without crashing when
// Supabase is not yet configured. Queries will fail gracefully (try/catch in
// AuthProvider), and the app falls back to client-side AuthGuard only.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Singleton for use in client components
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
