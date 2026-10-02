import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthResult = { error: string | null; needsConfirmation?: boolean };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  // `true` until the initial session has been resolved, so the UI can avoid
  // flashing a logged-out state on first paint.
  loading: boolean;
  // `false` when Supabase env vars are missing (client is null).
  ready: boolean;
  // `true` when the signed-in user has a row in `admin_user`. RLS still
  // enforces admin rights server-side; this only decides what UI to show.
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!supabase || !userId) {
      setIsAdmin(false);
      return;
    }

    let active = true;
    // RLS on admin_user only returns the caller's own row, so a hit means
    // "this user is an admin".
    supabase
      .from("admin_user")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsAdmin(Boolean(data));
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      ready: Boolean(supabase),
      isAdmin,
      async signIn(email, password) {
        if (!supabase) return { error: "auth-unavailable" };
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        return { error: error?.message ?? null };
      },
      async signUp(email, password) {
        if (!supabase) return { error: "auth-unavailable" };
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) return { error: error.message };
        // When email confirmation is on, signUp returns a user but no session.
        return { error: null, needsConfirmation: !data.session };
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [session, loading, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
