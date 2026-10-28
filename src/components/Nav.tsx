import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "@/theme";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/explore?type=movies", label: "Movies" },
  { to: "/explore?type=tv", label: "TV Shows" },
  { to: "/genres", label: "Genres" },
  { to: "/explore?sort=top-rated", label: "Top Rated" },
  { to: "/explore?sort=newest", label: "Upcoming" },
];

function CrownMark() {
  return (
    <svg width="29" height="25" viewBox="0 0 32 28" fill="none" aria-hidden="true">
      <path d="M3 9.2 8.5 14l7.3-10 7.1 10 6-4.8-2.4 12.4H5.4L3 9.2Z" fill="var(--logo-accent)" />
      <path d="M6 23.4h20v2H6z" fill="var(--logo-accent)" />
      <circle cx="3" cy="7" r="2.1" fill="var(--logo-accent)" />
      <circle cx="15.8" cy="2.5" r="2.1" fill="var(--logo-accent)" />
      <circle cx="29" cy="7" r="2.1" fill="var(--logo-accent)" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export default function Nav() {
  const { theme, toggleTheme } = useTheme();
  const { search } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header sticky top-0 z-50 w-full">
      <div className="site-header-inner flex items-center gap-5 px-[2.5%]">
        <Link to="/" className="brand-mark flex items-center gap-2 shrink-0" aria-label="KDramaWorld home" onClick={() => setMobileOpen(false)}>
          <CrownMark />
          <span className="brand-wordmark">
            <span style={{ color: "var(--logo-primary)" }}>KDrama</span><span style={{ color: "var(--logo-accent)" }}>World</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-[13px]" aria-label="Main navigation">
          {LINKS.map((l) => {
            const targetSearch = l.to.includes("?") ? "?" + l.to.split("?")[1] : "";
            return (
              <NavLink
                key={l.to}
                to={{ pathname: l.to.split("?")[0], search: targetSearch || undefined }}
                end={l.end}
                className={({ isActive }) => `nav-link ${isActive && search === targetSearch ? "active" : ""}`}
              >
                {l.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="header-actions flex items-center gap-3">
          <Link to="/explore" aria-label="Search Korean dramas and movies" className="header-search flex items-center gap-2 rounded-full px-3 h-9">
            <SearchIcon />
            <span className="hidden xl:inline text-[12px] whitespace-nowrap">Search Korean dramas, movies…</span>
          </Link>

          <button aria-label="Notifications" className="header-icon grid place-items-center" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </button>

          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="theme-toggle grid place-items-center rounded-full"
            type="button"
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21 14.1A8.4 8.4 0 0 1 9.9 3 9 9 0 1 0 21 14.1Z" />
              </svg>
            )}
          </button>

          <Link to="/lists" className="header-avatar grid place-items-center rounded-full" aria-label="Your lists">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0H4Z" />
            </svg>
          </Link>

          <button
            type="button"
            className="mobile-menu-button grid place-items-center rounded-full lg:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="mobile-nav lg:hidden" aria-label="Mobile navigation">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>{link.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
