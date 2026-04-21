import { useState } from "react";
import { Loader2, Mail, ArrowLeft, AlertCircle, KeyRound } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// --- AuthPage ---
//
// Sign-in flow optimised for iOS PWAs. The problem with magic links on
// iPhone: when the user clicks a link inside the Mail app, iOS ALWAYS
// opens it in Safari — never in the installed PWA on the home screen.
// That breaks the "sign in once and stay signed in" flow because the
// session lands in a different browser storage than the home-screen app.
//
// The fix: use email OTP codes instead of link clicks. Supabase sends a
// 6-digit code alongside the magic link in the same email. The user
// stays inside the home-screen PWA the whole time — they read the code
// from the email and type it into our code input. Zero Safari involvement.
//
// Flow:
//   Step 1 (email):  user types email → we call signInWithOtp → Supabase
//                    sends an email containing both the link AND a code.
//   Step 2 (code):   user reads the code from their email → types it
//                    into our OTP input → we call verifyOtp → session
//                    established, AuthProvider picks it up, app loads.
//
// We also keep Google / Apple OAuth for future use (they don't have the
// iOS-Safari-vs-PWA problem because the OAuth redirect back lands in
// whatever browser started the flow).

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // "email" | "code"
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [resentAt, setResentAt] = useState(0);

  // --- Step 1: send the email with the OTP code ---
  const handleSendCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
          // The link in the email will still redirect here if clicked on
          // a device where that works (desktop, Android Chrome). On iOS
          // PWA we ignore the link and use the OTP code.
          emailRedirectTo: window.location.origin,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setStep("code");
      setResentAt(Date.now());
    } catch (err) {
      setError(err.message || "Couldn't send the code. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Step 2: verify the OTP code ---
  //
  // Supabase accepts multiple `type` values for email OTPs depending on
  // whether the user is signing up for the first time or signing in.
  // We try each in order so the user never has to think about it.
  const handleVerifyCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = otp.replace(/\D/g, "");
    if (clean.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    setError(null);
    const typesToTry = ["email", "magiclink", "signup"];
    let lastErr = null;
    for (const type of typesToTry) {
      try {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: clean,
          type,
        });
        if (!error) {
          // AuthProvider's onAuthStateChange will flip us to signed-in.
          setVerifying(false);
          return;
        }
        lastErr = error;
        // Don't keep trying if the code is genuinely expired/used — only
        // retry on a "type mismatch"-ish message.
        if (/expired|used/i.test(error.message || "")) break;
      } catch (err) {
        lastErr = err;
      }
    }
    setError(
      (lastErr && lastErr.message) ||
      "That code didn't work. Double-check it — and if you already clicked the link in the email, request a fresh code below."
    );
    setVerifying(false);
  };

  // Cooldown for the "Resend code" button so users can't hammer Supabase.
  const secondsSinceResend = Math.floor((Date.now() - resentAt) / 1000);
  const canResend = resentAt === 0 || secondsSinceResend >= 30;

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

        {step === "email" ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 text-center">Sign in to continue</h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              New here? Enter your email — we'll create your account automatically.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 text-center">Enter your code</h1>
            <p className="text-sm text-gray-500 text-center mt-1 leading-relaxed">
              We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>.
              Open the email and type the code below.
            </p>
          </>
        )}

        {!isSupabaseConfigured && (
          <div className="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              Auth isn't configured on this deploy yet. Add <code className="font-mono text-[10px]">VITE_SUPABASE_URL</code> and <code className="font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> to your Vercel env vars and redeploy.
            </div>
          </div>
        )}

        {/* --- Step 1: email --- */}
        {step === "email" && (
          <>
            {/* OAuth buttons */}
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

            <div className="my-5 flex items-center gap-3 text-[11px] text-gray-400">
              <div className="flex-1 h-px bg-gray-100" />
              OR
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <form onSubmit={handleSendCode} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                {submitting ? "Sending…" : "Email me a code"}
              </button>
            </form>
          </>
        )}

        {/* --- Step 2: 6-digit code --- */}
        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">6-digit code</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoFocus
                className="w-full px-3 py-3 text-center tracking-[0.4em] text-lg font-mono font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={verifying || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50">
              {verifying ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
              {verifying ? "Verifying…" : "Verify & sign in"}
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); setError(null); }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                <ArrowLeft size={12} /> Change email
              </button>
              <button
                type="button"
                onClick={() => canResend && handleSendCode()}
                disabled={!canResend || submitting}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed">
                {canResend ? "Resend code" : `Resend in ${30 - secondsSinceResend}s`}
              </button>
            </div>
          </form>
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
