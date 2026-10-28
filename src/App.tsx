import { Routes, Route, Link } from "react-router-dom";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Shelf from "@/components/Shelf";
import Genres from "@/components/Genres";
import TopRated from "@/components/TopRated";
import ComingSoon from "@/components/ComingSoon";
import Actors from "@/components/Actors";
import Collections from "@/components/Collections";
import MiniFeatures from "@/components/MiniFeatures";
import Promise from "@/components/Promise";
import RecentlyAdded from "@/components/RecentlyAdded";
import Footer from "@/components/Footer";
import DramaPage from "@/pages/DramaPage";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LiveDataProvider, useLiveData } from "@/LiveData";

// Real pages (replacing placeholders)
import ExplorePage from "@/pages/ExplorePage";
import GenresIndexPage from "@/pages/GenresIndexPage";
import GenrePage from "@/pages/GenrePage";
import ActorsIndexPage from "@/pages/ActorsIndexPage";
import ActorPage from "@/pages/ActorPage";
import ListsPage from "@/pages/ListsPage";
import MoodPage from "@/pages/MoodPage";
import AboutPage from "@/pages/AboutPage";
import SourcesPage from "@/pages/SourcesPage";
import StaticPage from "@/pages/StaticPage";

function Home() {
  const { shelves } = useLiveData();
  return (
    <ErrorBoundary fallbackLabel="Home page">
      <Hero />
      {shelves.map((s) => <Shelf key={s.id} shelf={s} />)}
      <TopRated />
      <ComingSoon />
      <Actors />
      <Genres />
      <Collections />
      <MiniFeatures />
      <RecentlyAdded />
      <Promise />
    </ErrorBoundary>
  );
}

function NotFoundPage() {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-20 max-w-xl mx-auto text-center">
      <div className="text-7xl md:text-8xl font-serif italic gradient-text mb-4">404</div>
      <h1 className="section-title text-3xl md:text-4xl mb-3">Page not found</h1>
      <p className="text-white/70 mb-8">
        That URL doesn't live here. The drama you're looking for may not be in the archive yet, or the link may be stale.
      </p>
      <Link to="/" className="btn-primary h-11 px-6 rounded-xl inline-flex items-center gap-2 font-semibold">
        Back to home
      </Link>
    </section>
  );
}

const PRIVACY_BLOCKS = [
  { h: "In short", p: "KDramaWorld does not ask you to make an account. We do not set advertising cookies, fingerprint your browser, or sell data about you to anyone." },
  { h: "Data stored on your device", bullets: [
    "Theme preference (dark/light) in localStorage under kdw:theme.",
    "Any watchlist or personal notes you create (when the feature is enabled) stay in your browser and are never uploaded unless you explicitly export them.",
    "Vercel's hosting infrastructure may record standard request logs (IP, path, timestamp) for security and debugging; we do not use those logs for marketing or share them with third parties.",
  ] },
  { h: "Analytics", p: "We use Vercel's aggregated Web Analytics (no cookies, no personally identifying data) to count rough visits per page so we know what people actually read." },
  { h: "Third-party network calls", bullets: [
    "api.tvmaze.com — to enrich drama metadata.",
    "static.tvmaze.com — to load poster images.",
    "fonts.googleapis.com / fonts.gstatic.com — to load the Inter and Playfair Display typefaces.",
  ] },
  { h: "Your rights", p: "Because we don't hold any personal data about you, there's nothing for us to export or delete on request — but if you want to clear what's in localStorage, use your browser's clear-site-data controls, or email us and we'll walk you through it." },
];

const TERMS_BLOCKS = [
  { h: "Use at your own risk", p: "KDramaWorld is a hobby project and an editorial archive. Information is provided in good faith, but we cannot guarantee that ratings, airdates, episode counts, or availability are 100% accurate at the moment you load them — always cross-reference with the source." },
  { h: "No medical / legal / professional advice", p: "Our editorial copy is opinion and recommendation only. Please watch responsibly and don't let a K-drama substitute for a therapist (even when it really does feel like one)." },
  { h: "Content ownership", p: "Posters, synopses, and episode metadata are © their respective rights-holders and are used for informational/cataloguing purposes under fair-use-style fair-dealing and the source API's terms. If you are a rights-holder and would like content removed or credited differently, please contact us." },
  { h: "External links", p: "We link out to TVMaze, MyDramaList (search-only), and occasionally to streaming services. We do not control those sites and are not responsible for their content or practices." },
  { h: "Changes to these terms", p: "We will update this page when the site materially changes. Continued use after changes means you accept the revised terms." },
];

export default function App() {
  return (
    <ErrorBoundary fallbackLabel="KDramaWorld">
      <LiveDataProvider>
        <div className="relative min-h-screen">
          <Nav />
          <main className="relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/drama/:slug" element={<ErrorBoundary fallbackLabel="Drama page"><DramaPage /></ErrorBoundary>} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/discover" element={<ExplorePage />} />
              <Route path="/genres" element={<GenresIndexPage />} />
              <Route path="/genres/:slug" element={<GenrePage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/actors" element={<ActorsIndexPage />} />
              <Route path="/actors/:slug" element={<ActorPage />} />
              <Route path="/midnight-watchlist" element={<MoodPage kind="midnight-watchlist" />} />
              <Route path="/second-lead-syndrome" element={<MoodPage kind="second-lead-syndrome" />} />
              <Route path="/emotional-damage" element={<MoodPage kind="emotional-damage" />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/privacy" element={<StaticPage kicker="Legal" title="Privacy" updated="28 October 2026" blocks={PRIVACY_BLOCKS} />} />
              <Route path="/terms" element={<StaticPage kicker="Legal" title="Terms" updated="28 October 2026" blocks={TERMS_BLOCKS} />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </LiveDataProvider>
    </ErrorBoundary>
  );
}
