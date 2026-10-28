import { Routes, Route } from "react-router-dom";
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
import Placeholder from "@/pages/Placeholder";
import DramaPage from "@/pages/DramaPage";
import { shelves } from "@/data";

function Home() {
  return (
    <>
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
    </>
  );
}

export default function App() {
  return (
    <div className="relative min-h-screen">
      <Nav />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/drama/:slug" element={<DramaPage />} />
          <Route path="/explore" element={<Placeholder title="Explore" kicker="Browse the catalogue" blurb="Filter by genre, year, mood and rating. Full searchable grid coming right up." />} />
          <Route path="/discover" element={<Placeholder title="Discover" kicker="The canon" blurb="Hand-verified entries sorted by rating, recency, or release." />} />
          <Route path="/genres" element={<Placeholder title="Genres" kicker="Browse by mood" blurb="Every genre shelf in one place." />} />
          <Route path="/genres/:slug" element={<Placeholder title="Genre" kicker="Genre collection" blurb="Titles in this genre." />} />
          <Route path="/lists" element={<Placeholder title="Collections" kicker="Editorial" blurb="Hand-built collections argued over at length." />} />
          <Route path="/actors" element={<Placeholder title="Actors" kicker="On screen" blurb="Browse actors in the archive." />} />
          <Route path="/actors/:slug" element={<Placeholder title="Actor" kicker="Filmography" blurb="Verified cast metadata." />} />
          <Route path="/midnight-watchlist" element={<Placeholder title="Midnight Watchlist" kicker="01 · Mood recommender" blurb="Tell us your mood. We'll find your next obsession." />} />
          <Route path="/second-lead-syndrome" element={<Placeholder title="Second Lead Syndrome" kicker="02 · Hall of fame" blurb="For the characters who deserved a happy ending." />} />
          <Route path="/emotional-damage" element={<Placeholder title="Emotional Damage Meter" kicker="03 · Tracker" blurb="Log exactly how destroyed you were." />} />
          <Route path="*" element={<Placeholder title="Coming soon" kicker="KDramaWorld" blurb="This page is still being written — but the homepage is beautiful, isn't it?" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
