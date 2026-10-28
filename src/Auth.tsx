import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, WatchlistEntry, UserRating } from "@/lib/supabase";

type Status = "want-to-watch" | "watching" | "completed" | "dropped";

type AuthCtx = {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  loading: boolean;
  watchlist: Map<string, WatchlistEntry>;
  ratings: Map<string, UserRating>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  addToWatchlist: (dramaSlug: string, status?: Status) => Promise<{ error?: string }>;
  removeFromWatchlist: (dramaSlug: string) => Promise<{ error?: string }>;
  setWatchStatus: (dramaSlug: string, status: Status) => Promise<{ error?: string }>;
  rateDrama: (dramaSlug: string, score: number, review?: string) => Promise<{ error?: string }>;
  deleteRating: (dramaSlug: string) => Promise<{ error?: string }>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthCtx["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<Map<string, WatchlistEntry>>(new Map());
  const [ratings, setRatings] = useState<Map<string, UserRating>>(new Map());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const loadUserData = useCallback(async (uid: string) => {
    const [wRes, rRes, pRes] = await Promise.all([
      supabase.from("watchlist").select("*").eq("user_id", uid),
      supabase.from("user_ratings").select("*").eq("user_id", uid),
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    ]);
    const wMap = new Map<string, WatchlistEntry>();
    (wRes.data ?? []).forEach((e: WatchlistEntry) => wMap.set(e.drama_slug, e));
    setWatchlist(wMap);
    const rMap = new Map<string, UserRating>();
    (rRes.data ?? []).forEach((e: UserRating) => rMap.set(e.drama_slug, e));
    setRatings(rMap);
    if (pRes.data) setProfile(pRes.data as Profile);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u ? { id: u.id, email: u.email } : null);
      if (u) loadUserData(u.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u ? { id: u.id, email: u.email } : null);
      if (u) loadUserData(u.id);
      else {
        setWatchlist(new Map());
        setRatings(new Map());
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setAuthModalOpen(false);
    return { error: error?.message };
  };
  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName || email.split("@")[0] } },
    });
    if (!error) setAuthModalOpen(false);
    return { error: error?.message, needsConfirm: !!data.user && !data.session };
  };
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message };
  };
  const signOut = async () => { await supabase.auth.signOut(); };
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    return { error: error?.message };
  };

  const addToWatchlist = async (dramaSlug: string, status: Status = "want-to-watch") => {
    if (!user) { setAuthModalOpen(true); return { error: "Please sign in" }; }
    const { error } = await supabase.from("watchlist").upsert({ user_id: user.id, drama_slug: dramaSlug, status }, { onConflict: "user_id,drama_slug" });
    if (!error) loadUserData(user.id);
    return { error: error?.message };
  };
  const removeFromWatchlist = async (dramaSlug: string) => {
    if (!user) return { error: "Not signed in" };
    const { error } = await supabase.from("watchlist").delete().match({ user_id: user.id, drama_slug: dramaSlug });
    if (!error) loadUserData(user.id);
    return { error: error?.message };
  };
  const setWatchStatus = async (dramaSlug: string, status: Status) => addToWatchlist(dramaSlug, status);

  const rateDrama = async (dramaSlug: string, score: number, review?: string) => {
    if (!user) { setAuthModalOpen(true); return { error: "Please sign in" }; }
    const { error } = await supabase.from("user_ratings").upsert({ user_id: user.id, drama_slug: dramaSlug, score, review }, { onConflict: "user_id,drama_slug" });
    if (!error) loadUserData(user.id);
    return { error: error?.message };
  };
  const deleteRating = async (dramaSlug: string) => {
    if (!user) return { error: "Not signed in" };
    const { error } = await supabase.from("user_ratings").delete().match({ user_id: user.id, drama_slug: dramaSlug });
    if (!error) loadUserData(user.id);
    return { error: error?.message };
  };

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  return (
    <Ctx.Provider value={{
      user, profile, loading, watchlist, ratings,
      signIn, signUp, signInWithGoogle, signOut, resetPassword,
      addToWatchlist, removeFromWatchlist, setWatchStatus, rateDrama, deleteRating,
      openAuthModal, closeAuthModal, authModalOpen,
    }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
