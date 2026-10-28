// KDramaWorld — curated seed catalogue.
//
// LAYOUT IS DELIBERATE to avoid temporal-dead-zone crashes:
//   1. All Drama OBJECTS are declared first (CATALOG map built from them).
//   2. Shelves / collections / genres / actors are declared AFTER the catalog,
//      using slug arrays and lazy resolution so a rearrange can never crash.
//   3. resolveSlug() never throws at runtime: missing slugs are filtered out
//      and logged once in dev. Build-time validation catches bad slugs in CI.
//
// Runtime metadata (poster, backdrop, rating, episodes, network, runtime, status)
// is fetched live from the TVMaze API via src/api.ts. Seed ratings are fallbacks
// only; never fabricated for unreleased titles.

export type Drama = {
  slug: string;
  title: string;
  year: number;
  rating: number;
  episodes?: number;
  genres: string[];
  tagline?: string;
  blurb: string;
  art: string;
  network?: string;
  isNew?: boolean;
  tvmazeId?: number;
};

export type ShelfDef = { id: string; title: string; eyebrow?: string; slugList: string[]; live?: boolean };

const arts = ["art-a","art-b","art-c","art-d","art-e","art-f","art-g","art-h"] as const;
const A = (i: number) => arts[i % arts.length];

const IS_DEV = typeof (globalThis as any)?.import?.meta?.env?.DEV !== "undefined"
  ? (globalThis as any).import.meta.env.DEV
  : false;

// -----------------------------------------------------------------------------
// Step 1: every canonical Drama object, in one place. Order doesn't matter.
// -----------------------------------------------------------------------------
const D: Record<string, Drama> = {};
function add(d: Drama): Drama {
  if (IS_DEV && D[d.slug]) {
    console.warn(`[data] duplicate slug "${d.slug}" — first entry wins`);
    return D[d.slug];
  }
  D[d.slug] = d;
  return d;
}

export const featured: Drama = add({
  slug: "my-mister", title: "My Mister", year: 2018, rating: 8.5,
  episodes: 16, genres: ["Drama","Family"], tagline: "Top Pick · Featured K-Drama",
  blurb: "A man in his 40s withstands the weight of life. A woman in her 20s goes through different experiences, but also withstands the weight of life. The two meet and help each other.",
  art: "art-a", network: "tvN",
});

add({ slug: "when-life-gives-you-tangerines", title: "When Life Gives You Tangerines", year: 2025, rating: 9.0, genres: ["Romance","Drama","Family"], blurb: "A sweeping generation-spanning story set on Jeju Island across decades of laughter, loss and tangerines.", art: A(1) });
add({ slug: "twinkling-watermelon",      title: "Twinkling Watermelon", year: 2023, rating: 8.8, genres: ["Romance","Fantasy","Youth"], blurb: "A CODA boy time-slips to 1995 and joins a band with his teenage father.", art: A(2) });
add({ slug: "reply-1988",                title: "Reply 1988", year: 2015, rating: 9.0, genres: ["Comedy","Family","Romance"], blurb: "Five neighbourhood families in late-80s Seoul share side-dishes, secrets, and first loves.", art: A(3) });
add({ slug: "lovely-runner",             title: "Lovely Runner", year: 2024, rating: 8.6, genres: ["Romance","Fantasy"], blurb: "A devoted fan gets a second chance to save her idol — 15 years in the past.", art: A(4) });
add({ slug: "alchemy-of-souls",          title: "Alchemy of Souls", year: 2022, rating: 8.7, genres: ["Fantasy","Romance","Action"], blurb: "An elite warrior trapped in a weak body crosses fates with a noble heir in Daeho.", art: A(5) });
add({ slug: "hospital-playlist",         title: "Hospital Playlist", year: 2020, rating: 8.7, genres: ["Comedy","Drama","Medical"], blurb: "Five doctors who have been friends for twenty years navigate patients, bands and bad karaoke.", art: A(6) });
add({ slug: "goblin",                     title: "Goblin", year: 2016, rating: 8.6, genres: ["Fantasy","Romance","Drama"], blurb: "A 900-year-old immortal needs a human bride to end his life — and finds her.", art: A(7) });
add({ slug: "marry-my-husband",         title: "Marry My Husband", year: 2024, rating: 8.5, genres: ["Drama","Romance","Fantasy"], blurb: "Murdered by her best friend and husband, she travels ten years back to make them pay.", art: A(0) });
add({ slug: "business-proposal",        title: "Business Proposal", year: 2022, rating: 8.5, genres: ["Romance","Comedy","Drama"], blurb: "An ordinary office worker agrees to a blind date in her friend's place — and dates her CEO.", art: A(1) });
add({ slug: "extraordinary-attorney-woo", title: "Extraordinary Attorney Woo", year: 2022, rating: 8.5, genres: ["Drama","Comedy","Legal"], blurb: "A brilliant autistic rookie lawyer navigates courtrooms, whales, and office politics.", art: A(2) });
add({ slug: "the-glory",                title: "The Glory", year: 2022, rating: 8.5, genres: ["Drama","Mystery","Thriller"], blurb: "A bullied teen meticulously plans a reckoning that spans almost two decades.", art: A(3) });
add({ slug: "twenty-five-twenty-one",   title: "Twenty-Five Twenty-One", year: 2022, rating: 8.5, genres: ["Romance","Drama","Sports"], blurb: "A fencer chasing gold and a boy rebuilding his life fall in love against the IMF crisis.", art: A(4) });
add({ slug: "my-dearest",               title: "My Dearest", year: 2023, rating: 8.9, genres: ["Historical","Romance","Drama"], blurb: "A Joseon noblewoman and a mysterious trader fall in love amid the chaos of the Qing invasion.", art: A(5) });
add({ slug: "moon-lovers",              title: "Moon Lovers: Scarlet Heart Ryeo", year: 2016, rating: 8.6, genres: ["Historical","Romance","Fantasy","Time Travel"], blurb: "A modern woman time-slips to Goryeo and is caught between the hearts of princes.", art: A(6) });
add({ slug: "weightlifting-fairy",      title: "Weightlifting Fairy Kim Bok-joo", year: 2016, rating: 8.6, genres: ["Romance","Comedy","Sports","Youth"], blurb: "A weightlifter and a swimmer fall for each other on a college athletics campus.", art: A(7) });
add({ slug: "coffee-prince",            title: "Coffee Prince", year: 2007, rating: 8.5, genres: ["Romance","Comedy","Drama"], blurb: "A tomboy mistaken for a boy gets a job at a coffee shop full of handsome men.", art: A(0) });
add({ slug: "fight-for-my-way",         title: "Fight for My Way", year: 2017, rating: 8.3, genres: ["Romance","Comedy","Sports"], blurb: "Two underdog friends chase their long-forgotten dreams and each other.", art: A(1) });
add({ slug: "my-liberation-notes",      title: "My Liberation Notes", year: 2022, rating: 8.8, genres: ["Drama","Slice of Life","Romance"], blurb: "Three siblings and a mysterious stranger seek to escape their dead-end lives.", art: A(2) });
add({ slug: "run-on",                   title: "Run On", year: 2020, rating: 8.3, genres: ["Romance","Drama","Sports"], blurb: "A former sprinter and a subtitle translator fall in love in their own quiet, stubborn way.", art: A(3) });
add({ slug: "youth-of-may",             title: "Youth of May", year: 2021, rating: 8.7, genres: ["Drama","Romance","Historical"], blurb: "Two young people fall in love amid the Gwangju Uprising of May 1980.", art: A(4) });
add({ slug: "daily-dose-of-sunshine",   title: "Daily Dose of Sunshine", year: 2023, rating: 8.6, genres: ["Drama","Medical","Slice of Life"], blurb: "A young nurse starts work in a psychiatric ward and learns what healing really means.", art: A(5) });
add({ slug: "crash-landing-on-you", title: "Crash Landing on You", year: 2019, rating: 8.7, genres: ["Romance","Comedy","Drama"], blurb: "A South Korean heiress paraglides into North Korea and lands on an officer's heart.", art: A(4) });
add({ slug: "mr-sunshine",          title: "Mr. Sunshine", year: 2018, rating: 8.7, genres: ["Drama","Romance","Historical"], blurb: "A Korean-born US Marine returns to Joseon and falls for an aristocrat's granddaughter.", art: A(6) });
add({ slug: "mouse",         title: "Mouse", year: 2021, rating: 8.6, genres: ["Thriller","Crime","Mystery"], blurb: "A rookie cop hunts a psychopath whose DNA may be closer to home than he imagines.", art: A(0) });
add({ slug: "flower-of-evil",title: "Flower of Evil", year: 2020, rating: 8.5, genres: ["Thriller","Mystery","Romance"], blurb: "A detective begins to suspect her perfect husband is hiding a violent past.", art: A(1) });
add({ slug: "signal",         title: "Signal", year: 2016, rating: 8.4, genres: ["Crime","Mystery","Fantasy"], blurb: "A walkie-talkie connects past and present detectives on cold cases that refuse to stay cold.", art: A(2) });
add({ slug: "healer",         title: "Healer", year: 2014, rating: 8.4, genres: ["Action","Romance","Thriller"], blurb: "A night courier with a dark past takes on one last job — and one stubborn reporter.", art: A(3) });
add({ slug: "kingdom",       title: "Kingdom", year: 2019, rating: 8.3, genres: ["Thriller","Historical","Horror"], blurb: "A crown prince investigates a mysterious plague turning his kingdom into monsters.", art: A(6) });
add({ slug: "sky-castle",    title: "SKY Castle", year: 2018, rating: 8.4, genres: ["Drama","Mystery","Family"], blurb: "Four wealthy mothers will do anything to get their children into Seoul's top universities.", art: A(4) });
add({ slug: "tunnel",        title: "Tunnel", year: 2017, rating: 8.3, genres: ["Crime","Mystery","Fantasy"], blurb: "A detective chases a serial killer through a tunnel and emerges thirty years in the future.", art: A(5) });
add({ slug: "squid-game",    title: "Squid Game", year: 2021, rating: 7.9, genres: ["Thriller","Drama","Action"], blurb: "Debt-ridden strangers compete in deadly children's games for a fortune.", art: A(7) });
add({ slug: "arthdal",            title: "Arthdal Chronicles", year: 2019, rating: 8.3, genres: ["Fantasy","Drama","Action"], blurb: "Tribal war, prophecies and bronze-age ambition in the mythic land of Arth.", art: A(0) });
add({ slug: "secret-garden",       title: "Secret Garden", year: 2010, rating: 8.0, genres: ["Romance","Comedy","Fantasy"], blurb: "A bickering CEO and a stuntwoman swap bodies whenever it rains.", art: A(2) });
add({ slug: "chicago-typewriter", title: "Chicago Typewriter", year: 2017, rating: 8.2, genres: ["Romance","Fantasy","Mystery"], blurb: "Three 1930s resistance fighters are reincarnated as a writer, a fan, and a ghost.", art: A(3) });

// -----------------------------------------------------------------------------
// Step 2: catalogue is complete. Shelves/collections are slug lists only.
// -----------------------------------------------------------------------------
const missingLog = new Set<string>();
export function resolveSlug(slug: string): Drama | undefined {
  const d = D[slug];
  if (!d) {
    if (IS_DEV && !missingLog.has(slug)) {
      missingLog.add(slug);
      console.warn(`[data] unresolved slug "${slug}" — dropped from output`);
    }
    return undefined;
  }
  return d;
}

export function bySlugs(slugs: string[]): Drama[] {
  return slugs.map(resolveSlug).filter((d): d is Drama => Boolean(d));
}

export const CATALOG: Drama[] = Object.values(D);

const RECENT_FALLBACK_SLUGS = [
  "when-life-gives-you-tangerines","lovely-runner","marry-my-husband","twenty-five-twenty-one",
];
export const recentFallback: Drama[] = bySlugs(RECENT_FALLBACK_SLUGS).map(d => ({ ...d, isNew: true }));

export const DISCOVER_SLUGS = [
  "when-life-gives-you-tangerines","twinkling-watermelon","reply-1988","lovely-runner",
  "alchemy-of-souls","hospital-playlist","goblin","marry-my-husband","business-proposal",
  "extraordinary-attorney-woo","the-glory","twenty-five-twenty-one",
];
export const ROMANCE_SLUGS = [
  "when-life-gives-you-tangerines","reply-1988","twinkling-watermelon","lovely-runner",
  "alchemy-of-souls","business-proposal","marry-my-husband","goblin",
  "crash-landing-on-you","mr-sunshine",
];
export const THRILLER_SLUGS = [
  "mouse","flower-of-evil","signal","healer","kingdom","sky-castle","tunnel","squid-game",
];
export const FANTASY_SLUGS = [
  "twinkling-watermelon","alchemy-of-souls","goblin","kingdom","tunnel",
  "arthdal","secret-garden","chicago-typewriter",
];

export const discover: Drama[]    = bySlugs(DISCOVER_SLUGS);
export const romance: Drama[]     = bySlugs(ROMANCE_SLUGS);
export const thrillers: Drama[]   = bySlugs(THRILLER_SLUGS);
export const fantasy: Drama[]     = bySlugs(FANTASY_SLUGS);

export const topRated: Drama[] = CATALOG
  .filter((d) => d.rating > 0 && d.year <= new Date().getFullYear())
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 12);

export const comingSoon: Drama[] = []; // no fabricated future slates

export type Actor = { slug: string; name: string; art: string };
export const actors: Actor[] = [
  { slug: "lee-ji-eun",    name: "Lee Ji-eun (IU)",   art: "art-b" },
  { slug: "lee-dong-wook", name: "Lee Dong-wook",     art: "art-b" },
  { slug: "gong-hyo-jin",  name: "Gong Hyo-jin",      art: "art-a" },
  { slug: "kim-go-eun",    name: "Kim Go-eun",        art: "art-f" },
  { slug: "hyun-bin",      name: "Hyun Bin",          art: "art-g" },
  { slug: "son-ye-jin",    name: "Son Ye-jin",        art: "art-c" },
  { slug: "park-seo-joon", name: "Park Seo-joon",     art: "art-d" },
  { slug: "kim-soo-hyun",  name: "Kim Soo-hyun",      art: "art-e" },
];

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
  { slug: "historical",        name: "Historical",       art: "art-g", accent: "#d4a373" },
];

export type Collection = { slug: string; title: string; number: string; blurb: string; slugs: string[] };
export const collections: Collection[] = [
  { slug: "the-all-time-greats",      number: "01", title: "The All-Time Greats",       blurb: "The dramas we would defend in a courtroom. Canon, in our house.",        slugs: ["my-mister","reply-1988","mr-sunshine","signal","goblin"] },
  { slug: "hidden-gems",              number: "02", title: "Hidden Gems",               blurb: "Under-watched, over-delivering. Start here and become insufferable.",   slugs: ["chicago-typewriter","flower-of-evil","healer","twinkling-watermelon","secret-garden"] },
  { slug: "perfect-romantic-comedies",number: "03", title: "Perfect Romantic Comedies", blurb: "Twelve episodes, zero irony, a kiss that fixes your week.",             slugs: ["business-proposal","crash-landing-on-you","weightlifting-fairy","coffee-prince","secret-garden"] },
];

export function collectionItems(c: Collection): Drama[] {
  return bySlugs(c.slugs);
}

export const SHELF_DEFS: ShelfDef[] = [
  { id: "discover", title: "Discover Your Next Favorite", eyebrow: "Curated",       slugList: DISCOVER_SLUGS },
  { id: "recent",   title: "Recently Aired",              eyebrow: "TVMaze",        slugList: RECENT_FALLBACK_SLUGS, live: true },
  { id: "romance",  title: "A Little Romance",            eyebrow: "Romance",       slugList: ROMANCE_SLUGS },
  { id: "thriller", title: "One More Episode",            eyebrow: "Thriller",      slugList: THRILLER_SLUGS },
  { id: "fantasy",  title: "Beyond the Ordinary",         eyebrow: "Sci-Fi & Fantasy", slugList: FANTASY_SLUGS },
];

export const shelves = SHELF_DEFS.map(s => ({
  id: s.id, title: s.title, eyebrow: s.eyebrow,
  items: s.live ? recentFallback : bySlugs(s.slugList),
}));

export type Minifeature = { slug: string; eyebrow: string; title: string; blurb: string; cta: string; accent: string; note?: string };
export const minifeatures: Minifeature[] = [
  { slug: "midnight-watchlist",   eyebrow: "01 · Mood Recommender", title: "Midnight Watchlist",      blurb: "Tell us your mood. We'll find your next obsession — with reasons, not vibes.", cta: "Explore", accent: "#ff5ea8" },
  { slug: "second-lead-syndrome", eyebrow: "02 · Hall of Fame",     title: "Second Lead Syndrome",    blurb: "For the characters who deserved their own happy ending.",                       cta: "Explore", accent: "#9b5cff" },
  { slug: "emotional-damage",     eyebrow: "03 · Tracker",          title: "Emotional Damage Meter",  blurb: "Some dramas end. The damage doesn't. Log exactly how destroyed you were.",      cta: "Explore", accent: "#4aa8ff" },
];

export const SLUG_REDIRECTS: Record<string, string> = {
  "moon-lovers-f": "moon-lovers",
  "kingdom-f": "kingdom",
  "tunnel-f": "tunnel",
  "tunnel-thriller": "tunnel",
  "my-mister-c": "my-mister",
  "reply-1988-c": "reply-1988",
  "mr-sunshine-c": "mr-sunshine",
  "signal-c": "signal",
  "twinkling-watermelon-gem": "twinkling-watermelon",
  "chicago-typewriter-gem": "chicago-typewriter",
  "business-proposal-c": "business-proposal",
  "dream-to-you-cs": "",
  "100-days-of-deception-cs": "",
  "dream-to-you": "",
  "100-days-of-deception": "",
  "reborn-rookie": "",
  "dive-into-you": "",
  "bloody-flower": "",
  "tantara": "",
  "our-sticky-love": "",
  "dead-end-job": "",
  "cs-queen-of-tears": "",
};

export const PLACEHOLDER_MARKERS = ["placeholder", "coming right up", "(tba)", "(tbd)"];
