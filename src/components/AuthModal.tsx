import { useState } from "react";
import { useAuth } from "@/Auth";

type Mode = "signin" | "signup" | "reset";

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, signIn, signUp, resetPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!authModalOpen) return null;

  const close = () => { setErr(null); setMsg(null); closeAuthModal(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      if (mode === "signin") {
        const r = await signIn(email, password);
        if (r.error) setErr(r.error);
      } else if (mode === "signup") {
        const r = await signUp(email, password, displayName || undefined);
        if (r.error) setErr(r.error);
        else if (r.needsConfirm) setMsg("Account created! Check your inbox to confirm your email (or continue if email auto-confirm is on).");
      } else {
        const r = await resetPassword(email);
        if (r.error) setErr(r.error);
        else setMsg("If an account exists, a password reset link is on its way.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create your account" : "Reset password"}
          </h3>
          <button onClick={close} aria-label="Close" className="grid place-items-center w-8 h-8 rounded-full"
                  style={{ color: "var(--text-dim)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <button
          onClick={() => signInWithGoogle()}
          className="w-full h-11 rounded-md font-semibold inline-flex items-center justify-center gap-2 mb-3 transition"
          style={{ background: "#fff", color: "#111" }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-7.9 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.5 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-2 1.4-4.4 2.2-7 2.2-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.5l6 5.1C41 35 43.5 30 43.5 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-3 text-[11px] uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          or
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name (optional)"
              className="w-full h-11 px-3 rounded-md text-sm outline-none"
              style={{ background: "var(--bg-elev)", border: "1px solid var(--border-strong)", color: "var(--text)" }}
            />
          )}
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full h-11 px-3 rounded-md text-sm outline-none"
            style={{ background: "var(--bg-elev)", border: "1px solid var(--border-strong)", color: "var(--text)" }}
          />
          {mode !== "reset" && (
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-11 px-3 rounded-md text-sm outline-none"
              style={{ background: "var(--bg-elev)", border: "1px solid var(--border-strong)", color: "var(--text)" }}
            />
          )}
          {err && <div className="text-[13px]" style={{ color: "#ff616f" }}>{err}</div>}
          {msg && <div className="text-[13px]" style={{ color: "var(--accent-2)" }}>{msg}</div>}
          <button
            type="submit" disabled={busy}
            className="w-full h-11 rounded-md font-semibold text-sm disabled:opacity-60"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {busy ? "..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        <div className="mt-4 text-center text-[13px]" style={{ color: "var(--text-dim)" }}>
          {mode === "signin" && (
            <>
              <button onClick={() => { setMode("reset"); setErr(null); setMsg(null); }}
                      className="hover:underline">Forgot password?</button>
              <span className="mx-2">·</span>
              <button onClick={() => { setMode("signup"); setErr(null); setMsg(null); }}
                      className="hover:underline">Create an account</button>
            </>
          )}
          {mode === "signup" && (
            <>Already have an account?{" "}
              <button onClick={() => { setMode("signin"); setErr(null); setMsg(null); }}
                      className="hover:underline font-semibold" style={{ color: "var(--accent)" }}>Sign in</button></>
          )}
          {mode === "reset" && (
            <>Back to{" "}
              <button onClick={() => { setMode("signin"); setErr(null); setMsg(null); }}
                      className="hover:underline font-semibold" style={{ color: "var(--accent)" }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
