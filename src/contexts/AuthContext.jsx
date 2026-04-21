import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// --- AuthContext ---
//
// Wraps the app. Listens for Supabase auth state changes and exposes:
//   - user:         the current authenticated user object, or null
//   - loading:      true until the initial session has been resolved
//   - signOut:      helper to sign out
//   - refreshUser:  force a re-read of the current session
//
// Consumers use `useAuth()` to read these.

const AuthContext = createContext({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase isn't configured yet, skip loading state so the app
    // shows the AuthPage with a "not configured" message instead of
    // spinning forever.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Grab the initial session (if any).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes — login, logout, token refresh, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => { subscription?.unsubscribe?.(); };
  }, []);

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    if (!isSupabaseConfigured) return;
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
