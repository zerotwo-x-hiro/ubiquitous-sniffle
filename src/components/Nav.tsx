import { Link, NavLink } from "react-router-dom";
import { useTheme } from "@/theme";

const links = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/genres", label: "Genres" },
  { to: "/lists", label: "Lists" },
  { to: "/actors", label: "Actors" },
];

export default function Nav() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 px-4 md:px-8 lg:px-12 pt-3 md:pt-4">
      <div className="glass-strong rounded-2xl px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl grid place-items-center font-black text-white"
                style={{ background: "linear-gradient(135deg,#ff5ea8,#9b5cff,#4aa8ff)", boxShadow:"var(--shadow-glow)"}}>
            K
          </span>
          <span className="font-display text-lg md:text-xl font-black tracking-tight">
            KDrama<span className="gradient-text">World</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/explore" className="btn-ghost hidden sm:inline-flex h-9 px-3 rounded-xl items-center gap-2 text-sm font-medium" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            <span className="hidden lg:inline">Browse dramas</span>
          </Link>
          <button onClick={toggle} aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
                  className="btn-ghost h-9 w-9 grid place-items-center rounded-xl"
                  title={theme === "dark" ? "Switch to light" : "Switch to dark"}>
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
