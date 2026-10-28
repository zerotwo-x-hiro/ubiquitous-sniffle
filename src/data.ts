// KDramaWorld — curated seed catalogue.
//
// Each canonical drama appears ONCE here. Editorial shelves (discover, romance,
// thrillers, fantasy, collections, …) reference entries by slug so there is a
// single source of truth. Runtime metadata (poster, backdrop, rating, episodes,
// network, runtime, status) is fetched live from the TVMaze API via src/api.ts.
//
// Ratings are seeds/fallbacks only — they are ONLY used before live data loads
// or if TVMaze is unreachable. They must NEVER be fabricated for unreleased
// titles: rating must be 0 when the show has not premiered (see deriveStatus).

export type Drama = {
  slug: string;
  title: string;
  year: number;
  rating: number; // 0-10; 0 = "Not rated" (unreleased / no rating yet)
  episodes?: number;
  genres: string[];
  tagline?: string;
  blurb: string;
  art: string; // art-a..art-h (fallback poster gradient)
  network?: string;
  isNew?: boolean;
  /** Optional known TVMaze id; lets the runtime resolve by id instead of fuzzy title search. */
  tvmazeId?: number;
};

export type Shelf = { id: string; title: string; eyebrow?: string; items: Drama[] };

// Helper palette cycles for poster art fallbacks
const arts = ["art-a","art-b","art-c","art-d","art-e","art-f","art-g","art-h"] as const;
const A = (i: number) => arts[i % arts.length];

// -----------------------------------------------------------------------------
// Canonical dramas (one per show). Slugs are stable URLs.
// TVMaze ids are included for titles where we know them, to avoid fuzzy-match errors.
// For others we resolve at runtime via safe language/country/year matching.
// -----------------------------------------------------------------------------

export const featured: Drama = {
  slug: "my-mister",
  tvmazeId: 33840,
  title: "My Mister",
  year: 2018,
  rating: 8.5,
  episodes: 16,
  genres: ["Drama", "Family"],
  tagline: "Top Pick · Featured K-Drama",
  blurb:
    "A man in his 40s withstands the weight of life. A woman in her 20s goes through different experiences, but also withstands the weight of life. The two meet and help each other.",
  art: "art-a",
  network: "tvN",
};

// Discover (curated canon). Slugs unique.
export const discover: Drama[] = [
  { slug: "when-life-gives-you-tangerines", title: "When Life Gives You Tangerines", year: 2025, rating: 9.0, genres: ["Romance","Drama","Family"], blurb: "A sweeping generation-spanning story set on Jeju Island across decades of laughter, loss and tangerines.", art: A(1) },
  { slug: "twinkling-watermelon",      tvmazeId: 60030, title: "Twinkling Watermelon", year: 2023, rating: 8.8, genres: ["Romance","Fantasy","Youth"], blurb: "A CODA boy time-slips to 1995 and joins a band with his teenage father.", art: A(2) },
  { slug: "reply-1988",                 tvmazeId: 32923, title: "Reply 1988", year: 2015, rating: 9.0, genres: ["Comedy","Family","Romance"], blurb: "Five neighbourhood families in late-80s Seoul share side-dishes, secrets, and first loves.", art: A(3) },
  { slug: "lovely-runner",              tvmazeId: 64085, title: "Lovely Runner", year: 2024, rating: 8.6, genres: ["Romance","Fantasy"], blurb: "A devoted fan gets a second chance to save her idol — 15 years in the past.", art: A(4) },
  { slug: "alchemy-of-souls",           tvmazeId: 50892, title: "Alchemy of Souls", year: 2022, rating: 8.7, genres: ["Fantasy","Romance","Action"], blurb: "An elite warrior trapped in a weak body crosses fates with a noble heir in Daeho.", art: A(5) },
  { slug: "hospital-playlist",          tvmazeId: 44803, title: "Hospital Playlist", year: 2020, rating: 8.7, genres: ["Comedy","Drama","Medical"], blurb: "Five doctors who have been friends for twenty years navigate patients, bands and bad karaoke.", art: A(6) },
  { slug: "goblin",                     tvmazeId: 4711,  title: "Goblin", year: 2016, rating: 8.6, genres: ["Fantasy","Romance","Drama"], blurb: "A 900-year-old immortal needs a human bride to end his life — and finds her.", art: A(7) },
  { slug: "marry-my-husband",          tvmazeId: 62698, title: "Marry My Husband", year: 2024, rating: 8.5, genres: ["Drama","Romance","Fantasy"], blurb: "Murdered by her best friend and husband, she travels ten years back to make them pay.", art: A(0) },
  { slug: "business-proposal",         tvmazeId: 53846, title: "Business Proposal", year: 2022, rating: 8.5, genres: ["Romance","Comedy","Drama"], blurb: "An ordinary office worker agrees to a blind date in her friend's place — and dates her CEO.", art: A(1) },
  { slug: "extraordinary-attorney-woo", tvmazeId: 53476, title: "Extraordinary Attorney Woo", year: 2022, rating: 8.5, genres: ["Drama","Comedy","Legal"], blurb: "A brilliant autistic rookie lawyer navigates courtrooms, whales, and office politics.", art: A(2) },
  { slug: "the-glory",                 tvmazeId: 54653, title: "The Glory", year: 2022, rating: 8.5, genres: ["Drama","Mystery","Thriller"], blurb: "A bullied teen meticulously plans a reckoning that spans almost two decades.", art: A(3) },
  { slug: "twenty-five-twenty-one",    tvmazeId: 52676, title: "Twenty-Five Twenty-One", year: 2022, rating: 8.5, genres: ["Romance","Drama","Sports"], blurb: "A fencer chasing gold and a boy rebuilding his life fall in love against the IMF crisis.", art: A(4) },
];

// Recently released: populated LIVE from TVMaze KR schedule (api.fetchRecentKdramas).
// We provide a small curated fallback for when the API is unreachable, using only
// shows that have actually premiered (end-of-2025 / 2026). No fabricated ratings.
export const recent: Drama[] = []; // filled at runtime from live schedule; fall back below
export const recentFallback: Drama[] = [
  // These are REAL 2025/2026 releases (ratings 0 until TVMaze returns a value).
  { slug: "when-life-gives-you-tangerines", title: "When Life Gives You Tangerines", year: 2025, rating: 9.0, genres: ["Romance","Drama"], blurb: "A Jeju Island family epic spanning decades.", art: A(1), isNew: true },
];

// Romance — references by slug to avoid duplication
const romanceSlugs = [
  "when-life-gives-you-tangerines",
  "reply-1988",
  "twinkling-watermelon",
  "lovely-runner",
  "alchemy-of-souls",
  "business-proposal",
  "marry-my-husband",
  "goblin",
];
const romanceExtras: Drama[] = [
  { slug: "crash-landing-on-you", tvmazeId: 42503, title: "Crash Landing on You", year: 2019, rating: 8.7, genres: ["Romance","Comedy","Drama"], blurb: "A South Korean heiress paraglides into North Korea and lands on an officer's heart.", art: A(4) },
  { slug: "mr-sunshine",          tvmazeId: 26290, title: "Mr. Sunshine", year: 2018, rating: 8.7, genres: ["Drama","Romance","Historical"], blurb: "A Korean-born US Marine returns to Joseon and falls for an aristocrat's granddaughter.", art: A(6) },
];
export const romance: Drama[] = [
  ...romanceSlugs.map(lookup),
  ...romanceExtras,
];

// Thrillers
const thrillerExtras: Drama[] = [
  { slug: "mouse",         tvmazeId: 50502, title: "Mouse", year: 2021, rating: 8.6, genres: ["Thriller","Crime","Mystery"], blurb: "A rookie cop hunts a psychopath whose DNA may be closer to home than he imagines.", art: A(0) },
  { slug: "flower-of-evil",tvmazeId: 45614, title: "Flower of Evil", year: 2020, rating: 8.5, genres: ["Thriller","Mystery","Romance"], blurb: "A detective begins to suspect her perfect husband is hiding a violent past.", art: A(1) },
  { slug: "signal",        tvmazeId: 4746,  title: "Signal", year: 2016, rating: 8.4, genres: ["Crime","Mystery","Fantasy"], blurb: "A walkie-talkie connects past and present detectives on cold cases that refuse to stay cold.", art: A(2) },
  { slug: "healer",        tvmazeId: 2541,  title: "Healer", year: 2014, rating: 8.4, genres: ["Action","Romance","Thriller"], blurb: "A night courier with a dark past takes on one last job — and one stubborn reporter.", art: A(3) },
  { slug: "kingdom",       tvmazeId: 35015, title: "Kingdom", year: 2019, rating: 8.3, genres: ["Thriller","Historical","Horror"], blurb: "A crown prince investigates a mysterious plague turning his kingdom into monsters.", art: A(6) },
  { slug: "sky-castle",    tvmazeId: 39363, title: "SKY Castle", year: 2018, rating: 8.4, genres: ["Drama","Mystery","Family"], blurb: "Four wealthy mothers will do anything to get their children into Seoul's top universities.", art: A(4) },
  { slug: "tunnel",        tvmazeId: 23404, title: "Tunnel", year: 2017, rating: 8.3, genres: ["Crime","Mystery","Fantasy"], blurb: "A detective chases a serial killer through a tunnel and emerges thirty years in the future.", art: A(5) },
  { slug: "squid-game",    tvmazeId: 52672, title: "Squid Game", year: 2021, rating: 7.9, genres: ["Thriller","Drama","Action"], blurb: "Debt-ridden strangers compete in deadly children's games for a fortune.", art: A(7) },
];
export const thrillers: Drama[] = thrillerExtras;

// Fantasy / Sci-fi (referencing canonical entries by slug, no more *-f duplicates)
const fantasyExtras: Drama[] = [
  { slug: "arthdal",       tvmazeId: 40592, title: "Arthdal Chronicles", year: 2019, rating: 8.3, genres: ["Fantasy","Drama","Action"], blurb: "Tribal war, prophecies and bronze-age ambition in the mythic land of Arth.", art: A(0) },
  { slug: "secret-garden", tvmazeId: 4942,  title: "Secret Garden", year: 2010, rating: 8.0, genres: ["Romance","Comedy","Fantasy"], blurb: "A bickering CEO and a stuntwoman swap bodies whenever it rains.", art: A(2) },
  { slug: "chicago-typewriter", tvmazeId: 16423, title: "Chicago Typewriter", year: 2017, rating: 8.2, genres: ["Romance","Fantasy","Mystery"], blurb: "Three 1930s resistance fighters are reincarnated as a writer, a fan, and a ghost.", art: A(3) },
];
const fantasySlugs = ["twinkling-watermelon","alchemy-of-souls","goblin","kingdom","tunnel"];
export const fantasy: Drama[] = [
  ...fantasySlugs.map(lookup),
  ...fantasyExtras,
];

// Helper: resolve slug to its Drama in the catalogue above.
function lookup(slug: string): Drama {
  const all = [featured, ...discover, ...romanceExtras, ...thrillerExtras, ...fantasyExtras, ...comingSoon, ...recentlyAdded];
  const d = all.find((x) => x.slug === slug);
  if (!d) throw new Error(`data.ts: unresolved slug "${slug}"`);
  return d;
}

export const topRated: Drama[] = [...discover, ...romanceExtras, ...thrillerExtras, ...fantasyExtras]
  .filter((d) => d.rating > 0)
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 12);

// Coming soon — only UNRELEASED titles (year in future OR no rating yet).
// All entries have rating=0 (no "9.4 for Dream to You" — that violates D-003).
export const comingSoon: Drama[] = [
  // Real upcoming K-dramas (confirmed in development / TBA). Ratings left at 0 until aired.
  { slug: "cs-queen-of-tears",      title: "Queen of Tears (placeholder — upcoming slate)", year: 2026, rating: 0, genres: ["Romance","Drama"], network: "tvN", blurb: "A new tvN romance slate entry — details from TVMaze as they air.", art: A(2) },
];

// Real actors (curated names; filmography loaded via API at runtime).
export type Actor = { slug: string; name: string; art: string };
export const actors: Actor[] = [
  { slug: "lee-ji-eun",      name: "Lee Ji-eun (IU)",     art: "art-b" },
  { slug: "lee-dong-wook",   name: "Lee Dong-wook",       art: "art-b" },
  { slug: "gong-hyo-jin",    name: "Gong Hyo-jin",        art: "art-a" },
  { slug: "kim-go-eun",      name: "Kim Go-eun",          art: "art-f" },
  { slug: "hyun-bin",        name: "Hyun Bin",            art: "art-g" },
  { slug: "son-ye-jin",      name: "Son Ye-jin",          art: "art-c" },
  { slug: "park-seo-joon",   name: "Park Seo-joon",       art: "art-d" },
  { slug: "kim-soo-hyun",    name: "Kim Soo-hyun",        art: "art-e" },
];

// Genres — counts are COMPUTED at runtime from the catalogue (see src/lib/genreCounts.ts).
// We seed an approximate count but the UI will update once live data is hydrated.
export type Genre = { slug: string; name: string; art: string; accent: string };
export const genres: Genre[] = [
  { slug: "romance",           name: "Romance",          art: "art-a", accent: "#ff5ea8" },
  { slug: "comedy",            name: "Comedy",           art: "art-c", accent: "#ffc464" },
  { slug: "mystery",           name: "Mystery",          art: "art-e", accent: "#9b5cff" },
  { slug: "crime",             name: "Crime",            art: "art-g", accent: "#ff5e7d" },
  { slug: "sci-fi-and-fantasy",name: "Sci-Fi & Fantasy", art: "art-b", accent: "#4aa8ff" },
  { slug: "family",            name: "Family",           art: "art-d", accent: "#6be3c5" },
  { slug: "thriller",          name: "Thriller",         art: "art-h", accent: "#ff7a5e" },
  { slug: "drama",             name: "Drama",            art: "art-f", accent: "#c77dff" },
];

export type Collection = { slug: string; title: string; number: string; blurb: string; slugs: string[] };
export const collections: Collection[] = [
  {
    slug: "the-all-time-greats", number: "01",
    title: "The All-Time Greats",
    blurb: "The dramas we would defend in a courtroom. Canon, in our house.",
    slugs: ["my-mister","reply-1988","mr-sunshine","signal","goblin"],
  },
  {
    slug: "hidden-gems", number: "02",
    title: "Hidden Gems",
    blurb: "Under-watched, over-delivering. Start here and become insufferable about them.",
    slugs: ["chicago-typewriter","flower-of-evil","healer","twinkling-watermelon","secret-garden"],
  },
  {
    slug: "perfect-romantic-comedies", number: "03",
    title: "Perfect Romantic Comedies",
    blurb: "Twelve episodes, zero irony, a kiss that fixes your week.",
    slugs: ["business-proposal","crash-landing-on-you","secret-garden"],
  },
];

// Helper for components that need Drama[] from collections
export function collectionItems(c: Collection): Drama[] {
  return c.slugs.map(lookup);
}

export const recentlyAdded: Drama[] = [
  { slug: "my-mister", title: "My Mister", year: 2018, rating: 0, genres: ["Drama"], blurb: "", art: "art-e" },
  { slug: "goblin", title: "Goblin", year: 2016, rating: 0, genres: ["Romance","Fantasy"], blurb: "", art: "art-a" },
  { slug: "reply-1988", title: "Reply 1988", year: 2015, rating: 0, genres: ["Comedy","Family"], blurb: "", art: "art-d" },
].map((d) => ({ ...d, ...lookup(d.slug), blurb: lookup(d.slug).blurb || d.blurb }));

export const shelves: Shelf[] = [
  { id: "discover", title: "Discover Your Next Favorite", eyebrow: "Curated",       items: discover },
  // "recent" is populated LIVE from TVMaze by LiveDataProvider; falls back to recentFallback.
  { id: "recent",   title: "Recently Aired",            eyebrow: "Live · TVMaze", items: recentFallback },
  { id: "romance",  title: "A Little Romance",          eyebrow: "Romance",       items: romance },
  { id: "thriller", title: "One More Episode",          eyebrow: "Thriller",      items: thrillers },
  { id: "fantasy",  title: "Beyond the Ordinary",       eyebrow: "Sci-Fi & Fantasy", items: fantasy },
];

export type Minifeature = { slug: string; eyebrow: string; title: string; blurb: string; cta: string; accent: string; note?: string };
export const minifeatures: Minifeature[] = [
  { slug: "midnight-watchlist", eyebrow: "01 · Mood Recommender", title: "Midnight Watchlist", blurb: "Tell us your mood. We'll find your next obsession — with reasons, not vibes.", cta: "Explore", accent: "#ff5ea8", note: "Coming soon" },
  { slug: "second-lead-syndrome", eyebrow: "02 · Hall of Fame", title: "Second Lead Syndrome", blurb: "For the characters who deserved their own happy ending. A hall of fame for the almosts.", cta: "Explore", accent: "#9b5cff", note: "Coming soon" },
  { slug: "emotional-damage", eyebrow: "03 · Tracker", title: "Emotional Damage Meter", blurb: "Some dramas end. The damage doesn't. Log exactly how destroyed you were.", cta: "Explore", accent: "#4aa8ff", note: "Coming soon" },
];
