import { createClient } from "@supabase/supabase-js";

// --- Supabase client ---
//
// Env vars are sourced from Vercel (or a local .env.local when developing):
//   VITE_SUPABASE_URL        — your project URL, e.g. https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY   — the anon public key (NOT the service_role key)
//
// If either is missing we still export a stub client so the build doesn't
// crash during development before the env is configured. Auth calls will
// throw cleanly in that state — caller code should surface a friendly
// "Auth not configured" message.

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        // Session persisted in localStorage, auto-refreshed when expiring.
        persistSession: true,
        autoRefreshToken: true,
        // `detectSessionInUrl` lets the auth callback page (after magic
        // link / OAuth) read the session from the URL hash fragment.
        detectSessionInUrl: true,
      },
    })
  : null;
