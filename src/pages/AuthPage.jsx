import { useState } from "react";
import { Loader2, Mail, Check, AlertCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// --- AuthPage ---
//
// First-run / logged-out entry point for the app. Offers three sign-in
// methods, all routed through Supabase Auth:
//
//   1. Magic link (passwordless email) — user enters email, we send a
//      link they click to sign in. No password ever stored.
//   2. Continue with Google — OAuth via Supabase's Google provider.
//   3. Continue with Apple — OAuth via Supabase's Apple provider.
//      (Required if we ever ship a Capacitor native iOS app.)
//
// OAuth providers must be enabled in the Supabase dashboard under
// Authentication → Providers before the Google/Apple buttons do
// anything useful. Instructions in SUPABASE_SETUP.md.

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!isSupabaseConfigured) {
      setError("Auth isn't configured yet — add your Supabase keys in Vercel env vars.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // When the user clicks the link in their email, they land back
          // on the app at the root URL with the session in the URL hash.
          // Supabase's detectSessionInUrl flag picks it up automatically.
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message || "Couldn't send the magic link. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider) => {
    if (!isSupabaseConfigured) {
      setError("Auth isn't configured yet — add your Supabase keys in Vercel env vars.");
      return;
    }
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      // supabase.auth.signInWithOAuth navigates the browser away, so we
      // won't actually reach code past this line.
    } catch (err) {
      setError(err.message || `Couldn't start ${provider} sign-in.`);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-orange-50 via-white to-pink-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">O</div>
          <span className="font-bold text-gray-900">Optimus.AI</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 text-center">Sign in to continue</h1>
        <p className="text-sm text-gray-500 text-center mt-1">
          {sent
            ? "Check your inbox for the magic link."
            : "New here? Enter your email — we'll create your account automatically."}
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              Auth isn't configured on this deploy yet. Add <code className="font-mono text-[10px]">VITE_SUPABASE_URL</code> and <code className="font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> to your Vercel env vars and redeploy.
            </div>
          </div>
        )}

        {/* OAuth buttons */}
        {!sent && (
          <div className="mt-6 space-y-2.5">
            <button
              onClick={() => handleOAuth("google")}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700 disabled:opacity-50">
              <GoogleIcon /> Continue with Google
            </button>
            <button
              onClick={() => handleOAuth("apple")}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 transition text-sm font-medium disabled:opacity-50">
              <AppleIcon /> Continue with Apple
            </button>
          </div>
        )}

        {!sent && (
          <div className="my-5 flex items-center gap-3 text-[11px] text-gray-400">
            <div className="flex-1 h-px bg-gray-100" />
            OR
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        )}

        {/* Magic link form */}
        {!sent ? (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              {submitting ? "Sending…" : "Send magic link"}
            </button>
          </form>
        ) : (
          <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-100 flex items-start gap-2.5">
            <Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900">Email sent</p>
              <p className="text-green-700 text-xs mt-0.5">
                We sent a link to <span className="font-medium">{email}</span>. Click it to finish signing in.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-xs text-green-800 underline mt-2">
                Use a different email
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

// --- Brand icons (inline SVG to avoid an extra dependency) ---

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25"/>
    </svg>
  );
}
