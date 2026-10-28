import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "@/theme";
import { useAuth } from "@/Auth";
import { useState, useRef, useEffect } from "react";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/explore?type=movies", label: "Movies" },
  { to: "/explore?type=tv", label: "TV Shows" },
  { to: "/genres", label: "Genres" },
  { to: "/explore?sort=top-rated", label: "Top Rated" },
  { to: "/explore?sort=newest", label: "Upcoming" },
];

export default function Nav() {
  const { theme, toggleTheme } = useTheme();
  const { search } = useLocation();
  const { user, profile, openAuthModal, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <header
      className="sticky top-0 z-50 w-full transition-colors duration-300"
      style={{ background: "var(--nav-gradient)" }}
    >
      <div className="flex items-center gap-6 px-[4%] py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center leading-none shrink-0" aria-label="KDramaWorld home">
          <span className="text-[26px] md:text-[30px] font-black tracking-tight" style={{ color: "var(--logo-primary)" }}>
            KDrama
          </span>
          <span className="text-[26px] md:text-[30px] font-black tracking-tight" style={{ color: "var(--logo-accent)" }}>
            World
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-[14px]">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={{ pathname: l.to.split("?")[0], search: l.to.includes("?") ? "?" + l.to.split("?")[1] : undefined }}
              end={l.end}
              className={({ isActive }) =>
                `nav-link ${isActive && search === (l.to.includes("?") ? "?" + l.to.split("?")[1] : "") ? "active" : ""}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link
            to="/explore"
            aria-label="Search"
            className="group flex items-center gap-2 rounded-full px-3 h-10 transition-colors"
            style={{
              border: "1px solid rgba(255,255,255,0.0)",
              background: "transparent",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--nav-icon)" }}>
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="hidden lg:inline text-[13px]" style={{ color: "var(--nav-icon)", opacity: 0.85 }}>
              Search Korean dramas, movies…
            </span>
          </Link>

          <button aria-label="Notifications" className="grid place-items-center" style={{ color: "var(--nav-icon)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
            className="grid place-items-center rounded-full overflow-hidden border border-white/20"
            style={{ width: 34, height: 34 }}
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={theme === "dark" ? "#f5c518" : "#ff9f1c"}>
              {theme === "dark" ? (
                <circle cx="12" cy="12" r="5" />
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              )}
            </svg>
          </button>

          {/* User avatar / sign-in */}
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-sm overflow-hidden shrink-0"
                style={{
                  width: 34, height: 34,
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  display: "grid", placeItems: "center", color: "#fff", fontSize: 13, fontWeight: 800,
                }}
                aria-label="Account menu"
              >
                {(profile?.display_name || profile?.username || user.email || "U").charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-xl overflow-hidden z-50"
                     style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}>
                  <div className="px-4 py-3 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="font-semibold truncate" style={{ color: "var(--text)" }}>
                      {profile?.display_name || profile?.username || "Signed in"}
                    </div>
                    <div className="text-[12px] truncate" style={{ color: "var(--text-dim)" }}>{user.email}</div>
                  </div>
                  <Link to="/lists" onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm hover:bg-black/10 dark:hover:bg-white/10" style={{ color: "var(--text)" }}>
                    My List
                  </Link>
                  <button onClick={async () => { setMenuOpen(false); await signOut(); }}
                          className="block w-full text-left px-4 py-2.5 text-sm hover:bg-black/10 dark:hover:bg-white/10" style={{ color: "var(--text)" }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="h-9 px-4 rounded-md text-[13px] font-semibold transition"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
