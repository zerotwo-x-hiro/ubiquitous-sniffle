export type Drama = {
  slug: string;
  title: string;
  year: number;
  rating: number; // 0-10, 0 = unreleased
  episodes?: number;
  genres: string[];
  tagline?: string;
  blurb: string;
  art: string; // art-a..art-h
  network?: string;
  isNew?: boolean;
};

export type Shelf = { id: string; title: string; eyebrow?: string; items: Drama[] };

const D: (d: Drama) => Drama = (d) => d;

// Helper palette cycles for poster art
const arts = ["art-a","art-b","art-c","art-d","art-e","art-f","art-g","art-h"] as const;
const A = (i: number) => arts[i % arts.length];

export const featured: Drama = D({
  slug: "my-mister",
  title: "My Mister",
  year: 2018,
  rating: 8.5,
  episodes: 16,
  genres: ["Drama", "Slice of Life"],
  tagline: "Top Pick · Featured K-Drama",
  blurb:
    "Two people carrying the worst of their lives meet in an office corridor. Nothing about their meeting is romantic in the usual sense — and everything about it is love.",
  art: "art-a",
  network: "tvN",
});

export const discover: Drama[] = [
  { slug: "when-life-gives-you-tangerines", title: "When Life Gives You Tangerines", year: 2025, rating: 9.0, genres: ["Romance","Drama","Life"], blurb: "A sweeping, generation-spanning love story set on Jeju Island across decades of laughter, loss, and tangerines.", art: A(1) },
  { slug: "twinkling-watermelon",      title: "Twinkling Watermelon",           year: 2023, rating: 8.8, genres: ["Romance","Fantasy","Youth"], blurb: "A CODA boy time-slips to 1995 and joins a band with his teenage father.", art: A(2) },
  { slug: "reply-1988",                 title: "Reply 1988",                     year: 2015, rating: 9.0, genres: ["Comedy","Life","Family"], blurb: "Five neighbourhood families in late-80s Seoul share side-dishes, secrets, and first loves.", art: A(3) },
  { slug: "lovely-runner",              title: "Lovely Runner",                  year: 2024, rating: 8.6, genres: ["Romance","Fantasy","Time Travel"], blurb: "A devoted fan gets a second chance to save her idol — 15 years in the past.", art: A(4) },
  { slug: "alchemy-of-souls",           title: "Alchemy of Souls",               year: 2022, rating: 8.7, genres: ["Fantasy","Romance","Historical"], blurb: "An elite warrior trapped in a weak body crosses fates with a noble heir in Daeho.", art: A(5) },
  { slug: "hospital-playlist",          title: "Hospital Playlist",              year: 2020, rating: 8.7, genres: ["Comedy","Life","Medical"], blurb: "Five doctors who've been friends for twenty years navigate patients, bands and bad karaoke.", art: A(6) },
  { slug: "goblin",                     title: "Goblin",                         year: 2016, rating: 8.6, genres: ["Fantasy","Romance","Melodrama"], blurb: "A 900-year-old immortal needs a human bride to end his life — and finds her.", art: A(7) },
  { slug: "marry-my-husband",           title: "Marry My Husband",               year: 2024, rating: 8.5, genres: ["Revenge","Romance","Workplace"], blurb: "Murdered by her best friend and husband, she travels ten years back to make them pay.", art: A(0) },
  { slug: "business-proposal",          title: "Business Proposal",              year: 2022, rating: 8.5, genres: ["Romance","Comedy","Workplace"], blurb: "An ordinary office worker agrees to a blind date in her friend's place — and dates her CEO.", art: A(1) },
  { slug: "extraordinary-attorney-woo", title: "Extraordinary Attorney Woo",     year: 2022, rating: 8.5, genres: ["Legal","Comedy","Romance"], blurb: "A brilliant autistic rookie lawyer navigates courtrooms, whales, and office politics.", art: A(2) },
  { slug: "the-glory",                  title: "The Glory",                      year: 2022, rating: 8.5, genres: ["Revenge","Melodrama","Thriller"], blurb: "A bullied teen meticulously plans a reckoning that spans almost two decades.", art: A(3) },
  { slug: "twenty-five-twenty-one",     title: "Twenty-Five Twenty-One",         year: 2022, rating: 8.5, genres: ["Romance","Youth","Sports"], blurb: "A fencer chasing gold and a boy rebuilding his life fall in love against the IMF crisis.", art: A(4) },
];

export const recent: Drama[] = [
  { slug: "reborn-rookie",        title: "Reborn Rookie",              year: 2026, rating: 8.2, genres: ["Drama","Workplace"],  blurb: "A burnt-out intern gets a do-over at the same company — ten years earlier.", art: A(0), isNew: true },
  { slug: "dive-into-you",        title: "Dive into You",              year: 2026, rating: 9.0, genres: ["Romance","Sports"],   blurb: "A competitive diver and her coach's son discover what it means to fall together.", art: A(5), isNew: true },
  { slug: "bloody-flower",        title: "Bloody Flower",              year: 2026, rating: 8.1, genres: ["Historical","Revenge"], blurb: "A court dancer with a blade hidden in her sleeve hunts the men who killed her house.", art: A(6), isNew: true },
  { slug: "tantara",              title: "Tantara",                    year: 2026, rating: 0,   genres: ["Thriller","Crime"],    blurb: "A disgraced reporter returns to her hometown to chase a story that should stay buried.", art: A(7), isNew: true },
  { slug: "dream-to-you",         title: "Dream to You",               year: 2026, rating: 9.4, genres: ["Romance","Comedy"],   blurb: "Two insomniacs share the same lucid dream and fall for each other before meeting in real life.", art: A(1), isNew: true },
  { slug: "our-sticky-love",      title: "Our Sticky Love",            year: 2026, rating: 8.7, genres: ["Romance","Slice of Life"], blurb: "A ceramicist and a pediatric dentist keep bumping into each other in all the wrong places.", art: A(2), isNew: true },
  { slug: "100-days-of-deception",title: "100 Days of Deception",      year: 2026, rating: 9.3, genres: ["Action","Romance"],   blurb: "A con artist agrees to one last marriage of convenience with an intelligence officer.", art: A(3), isNew: true },
  { slug: "dead-end-job",         title: "Dead-End Job",               year: 2026, rating: 0,   genres: ["Comedy","Workplace"], blurb: "Three best friends make a pact to quit their terrible jobs on the same Friday — if only.", art: A(4), isNew: true },
];

export const romance: Drama[] = [
  discover[0], discover[2], discover[1],
  { slug: "crash-landing-on-you", title: "Crash Landing on You", year: 2019, rating: 8.7, genres: ["Romance","Comedy"], blurb: "A South Korean heiress paraglides into North Korea and lands on an officer's heart.", art: A(4) },
  discover[4],
  { slug: "my-dearest",           title: "My Dearest",           year: 2023, rating: 8.9, genres: ["Historical","Romance"], blurb: "A nobleman who swore off love meets a woman with nothing left to lose.", art: A(5) },
  { slug: "mr-sunshine",          title: "Mr. Sunshine",         year: 2018, rating: 8.7, genres: ["Historical","Melodrama","Romance"], blurb: "A Korean-born US Marine returns to Joseon and falls for an aristocrat's granddaughter.", art: A(6) },
  { slug: "moon-lovers",          title: "Moon Lovers: Scarlet Heart Ryeo", year: 2016, rating: 8.6, genres: ["Historical","Romance","Time Travel"], blurb: "A modern woman is thrown into Goryeo palace politics — and the arms of several princes.", art: A(7) },
];

export const thrillers: Drama[] = [
  { slug: "mouse",         title: "Mouse",        year: 2021, rating: 8.6, genres: ["Thriller","Crime"], blurb: "A rookie cop hunts a psychopath whose DNA may be closer to home than he imagines.", art: A(0) },
  { slug: "flower-of-evil",title: "Flower of Evil", year: 2020, rating: 8.5, genres: ["Thriller","Melodrama","Romance"], blurb: "A detective begins to suspect that her perfect husband is hiding a violent past.", art: A(1) },
  { slug: "signal",        title: "Signal",       year: 2016, rating: 8.4, genres: ["Crime","Fantasy","Thriller"], blurb: "A walkie-talkie connects past and present detectives on cold cases that refuse to stay cold.", art: A(2) },
  { slug: "healer",        title: "Healer",       year: 2014, rating: 8.4, genres: ["Action","Romance","Thriller"], blurb: "A night courier with a dark past takes on one last job — and one stubborn reporter.", art: A(3) },
  { slug: "kingdom",       title: "Kingdom",      year: 2019, rating: 8.3, genres: ["Historical","Zombie","Thriller"], blurb: "A crown prince investigates a mysterious plague that is turning his kingdom into monsters.", art: A(6) },
  { slug: "sky-castle",    title: "SKY Castle",   year: 2018, rating: 8.4, genres: ["Satire","Thriller","Drama"], blurb: "Four wealthy mothers will do anything to get their children into Seoul's top universities.", art: A(4) },
  { slug: "tunnel-thriller",title: "Tunnel",       year: 2017, rating: 8.3, genres: ["Crime","Time Travel","Thriller"], blurb: "A detective chases a serial killer through a tunnel and emerges thirty years in the future.", art: A(5) },
  { slug: "squid-game",    title: "Squid Game",   year: 2021, rating: 7.9, genres: ["Thriller","Survival"], blurb: "Debt-ridden strangers compete in deadly children's games for a fortune.", art: A(7) },
];

export const fantasy: Drama[] = [
  discover[1], discover[4],
  { slug: "moon-lovers-f", title: "Moon Lovers: Scarlet Heart Ryeo", year: 2016, rating: 8.6, genres: ["Time Travel","Historical"], blurb: "A 21st-century woman wakes in the body of a Goryeo noblewoman.", art: A(7) },
  { slug: "kingdom-f",      title: "Kingdom", year: 2019, rating: 8.3, genres: ["Zombie","Historical"], blurb: "Joseon's crown prince fights a plague that reanimates the dead.", art: A(6) },
  { slug: "arthdal",        title: "Arthdal Chronicles", year: 2019, rating: 8.3, genres: ["Epic","Fantasy"], blurb: "Tribal war, prophecies and bronze-age ambition in the mythic land of Arth.", art: A(0) },
  { slug: "tunnel-f",       title: "Tunnel",  year: 2017, rating: 8.3, genres: ["Time Travel","Crime"], blurb: "A detective walks through a tunnel into 2016 chasing a serial killer.", art: A(5) },
  { slug: "secret-garden",  title: "Secret Garden", year: 2010, rating: 8.0, genres: ["Romance","Fantasy","Comedy"], blurb: "A bickering CEO and a stuntwoman swap bodies whenever it rains.", art: A(2) },
  { slug: "chicago-typewriter", title: "Chicago Typewriter", year: 2017, rating: 8.2, genres: ["Fantasy","Romance","Mystery"], blurb: "Three 1930s resistance fighters are reincarnated as a writer, a fan, and a ghost.", art: A(3) },
];

export const topRated: Drama[] = [...discover].sort((a,b)=>b.rating-a.rating).slice(0,12);

export const comingSoon: Drama[] = [
  { slug: "family-register", title: "Family Register", year: 2026, rating: 0, genres: ["Drama"], network: "MBC", blurb: "A family secret unravels when an old register book is found in an attic.", art: A(2) },
  { slug: "doctor-x-mafia", title: "Doctor X: Mafia in White", year: 2026, rating: 0, genres: ["Crime","Medical"], network: "SBS", blurb: "A gifted surgeon operating off-the-books for a crime syndicate is offered one chance at redemption.", art: A(1) },
  { slug: "dream-to-you-cs", title: "Dream to You", year: 2026, rating: 9.4, genres: ["Comedy","Romance"], network: "ENA", blurb: "Two insomniacs share a lucid dream and fall in love before ever meeting IRL.", art: A(5) },
  { slug: "teach-you-a-lesson", title: "Teach You a Lesson", year: 2026, rating: 0, genres: ["Action & Adventure"], network: "Netflix", blurb: "A retired hitman goes back to high school to protect the daughter of his only friend.", art: A(6) },
  { slug: "100-days-of-deception-cs", title: "100 Days of Deception", year: 2026, rating: 9.3, genres: ["Action & Adventure"], network: "tvN", blurb: "A con artist and an intelligence officer sign a 100-day marriage contract neither can afford to break.", art: A(3) },
  { slug: "four-hands", title: "Four Hands, Two Sonatas", year: 2026, rating: 0, genres: ["Drama","Romance"], network: "tvN", blurb: "Two rival concert pianists are forced to share a stage, a tour, and a terrible secret.", art: A(4) },
  { slug: "honour", title: "Honour", year: 2026, rating: 0, genres: ["Crime","Legal"], network: "ENA", blurb: "A disgraced prosecutor takes on cases nobody else will touch — starting with her sister's.", art: A(0) },
  { slug: "between-steps", title: "Between Steps", year: 2026, rating: 0, genres: ["Comedy","Romance"], network: "ENA", blurb: "A ballroom dancer and a delivery boy waltz through a summer neither will forget.", art: A(7) },
];

export type Actor = { slug: string; name: string; dramas: number; leads?: number; art: string };
export const actors: Actor[] = [
  { slug: "choi-soo-jong", name: "Choi Soo Jong", dramas: 20, art: "art-g" },
  { slug: "lee-dong-wook",  name: "Lee Dong-wook",  dramas: 19, leads: 1, art: "art-b" },
  { slug: "ryu-jin",        name: "Ryu Jin",        dramas: 19, art: "art-d" },
  { slug: "ji-seong",       name: "Ji Seong",       dramas: 18, art: "art-e" },
  { slug: "joo-sang-wook",  name: "Joo Sang Wook",  dramas: 18, art: "art-c" },
  { slug: "jang-hyeok",     name: "Jang Hyeok",     dramas: 17, art: "art-h" },
  { slug: "gong-hyo-jin",   name: "Gong Hyo-jin",   dramas: 16, art: "art-a" },
  { slug: "kim-go-eun",     name: "Kim Go-eun",     dramas: 15, leads: 2, art: "art-f" },
];

export type Genre = { slug: string; name: string; count: number; art: string; accent: string };
export const genres: Genre[] = [
  { slug: "romance",         name: "Romance",         count: 1168, art: "art-a", accent: "#ff5ea8" },
  { slug: "comedy",          name: "Comedy",          count: 808,  art: "art-c", accent: "#ffc464" },
  { slug: "mystery",         name: "Mystery",         count: 341,  art: "art-e", accent: "#9b5cff" },
  { slug: "crime",           name: "Crime",           count: 248,  art: "art-g", accent: "#ff5e7d" },
  { slug: "sci-fi-and-fantasy", name: "Sci-Fi & Fantasy", count: 160, art: "art-b", accent: "#4aa8ff" },
  { slug: "family",          name: "Family",          count: 138,  art: "art-d", accent: "#6be3c5" },
  { slug: "thriller",        name: "Thriller",        count: 297,  art: "art-h", accent: "#ff7a5e" },
  { slug: "historical",      name: "Historical",      count: 182,  art: "art-f", accent: "#c77dff" },
];

export type Collection = { slug: string; title: string; number: string; blurb: string; items: Drama[] };
export const collections: Collection[] = [
  {
    slug: "the-all-time-greats", number: "01",
    title: "The All-Time Greats",
    blurb: "The dramas we would defend in a courtroom. Canon, in our house.",
    items: [
      { slug: "my-mister-c", title: "My Mister", year: 2018, rating: 8.5, genres: ["Slice of Life"], blurb: "", art: "art-a" },
      { slug: "reply-1988-c", title: "Reply 1988", year: 2015, rating: 9.0, genres: ["Life"], blurb: "", art: "art-d" },
      { slug: "mr-sunshine-c", title: "Mr. Sunshine", year: 2018, rating: 8.7, genres: ["Historical"], blurb: "", art: "art-f" },
      { slug: "my-liberation-notes", title: "My Liberation Notes", year: 2022, rating: 8.4, genres: ["Slice of Life"], blurb: "", art: "art-b" },
      { slug: "signal-c", title: "Signal", year: 2016, rating: 8.4, genres: ["Crime"], blurb: "", art: "art-h" },
    ],
  },
  {
    slug: "hidden-gems", number: "02",
    title: "Hidden Gems",
    blurb: "Under-watched, over-delivering. Start here and become insufferable about them.",
    items: [
      { slug: "run-on", title: "Run On", year: 2020, rating: 8.2, genres: ["Romance"], blurb: "", art: "art-c" },
      { slug: "youth-of-may", title: "Youth of May", year: 2021, rating: 8.6, genres: ["Melodrama"], blurb: "", art: "art-g" },
      { slug: "daily-dose-of-sunshine", title: "Daily Dose of Sunshine", year: 2023, rating: 8.7, genres: ["Life"], blurb: "", art: "art-e" },
      { slug: "twinkling-watermelon-gem", title: "Twinkling Watermelon", year: 2023, rating: 8.8, genres: ["Youth"], blurb: "", art: "art-d" },
      { slug: "chicago-typewriter-gem", title: "Chicago Typewriter", year: 2017, rating: 8.2, genres: ["Fantasy"], blurb: "", art: "art-h" },
    ],
  },
  {
    slug: "perfect-romantic-comedies", number: "03",
    title: "Perfect Romantic Comedies",
    blurb: "Twelve episodes, zero irony, a kiss that fixes your week.",
    items: [
      { slug: "coffee-prince", title: "Coffee Prince", year: 2007, rating: 8.4, genres: ["Comedy"], blurb: "", art: "art-b" },
      { slug: "weightlifting-fairy", title: "Weightlifting Fairy Kim Bok-joo", year: 2016, rating: 8.8, genres: ["Sports"], blurb: "", art: "art-a" },
      { slug: "fight-for-my-way", title: "Fight for My Way", year: 2017, rating: 8.5, genres: ["Life"], blurb: "", art: "art-c" },
      { slug: "business-proposal-c", title: "Business Proposal", year: 2022, rating: 8.5, genres: ["Romance"], blurb: "", art: "art-f" },
      { slug: "whats-wrong-secretary-kim", title: "What's Wrong with Secretary Kim", year: 2018, rating: 8.5, genres: ["Workplace"], blurb: "", art: "art-e" },
    ],
  },
];

export const recentlyAdded: Drama[] = [
  { slug: "into-the-ring", title: "Into the Ring", year: 2020, rating: 0, genres: ["Comedy","Workplace"], blurb: "An idealistic district rep takes on city hall.", art: "art-e" },
  { slug: "romance-talking", title: "Romance, Talking", year: 2020, rating: 0, genres: ["Romance","Indie"], blurb: "A slow-burn conversation piece about two people who talk for a living.", art: "art-a" },
  { slug: "the-world-of-my-17", title: "The World of My 17", year: 2020, rating: 0, genres: ["Youth"], blurb: "High-school friendship drama told through vlogs and voice notes.", art: "art-d" },
  { slug: "going-out", title: "Going Out", year: 2020, rating: 0, genres: ["Romance"], blurb: "A single night out stretches into a week neither will forget.", art: "art-g" },
  { slug: "wind-clouds-rain", title: "Wind, Clouds and Rain", year: 2020, rating: 0, genres: ["Historical"], blurb: "A Joseon physician and a fate reader cross paths in a time of plague.", art: "art-h" },
  { slug: "like", title: "Like", year: 2019, rating: 0, genres: ["Romance"], blurb: "Social media double-taps turn into real-life heartbeats.", art: "art-c" },
];

export const shelves: Shelf[] = [
  { id: "discover", title: "Discover Your Next Favorite", eyebrow: "Curated",      items: discover },
  { id: "recent",   title: "Recently Released",         eyebrow: "2026 slate",    items: recent },
  { id: "romance",  title: "A Little Romance",          eyebrow: "Romance",       items: romance },
  { id: "thriller", title: "One More Episode",          eyebrow: "Thriller",      items: thrillers },
  { id: "fantasy",  title: "Beyond the Ordinary",       eyebrow: "Sci-Fi & Fantasy", items: fantasy },
];

export type Minifeature = { slug: string; eyebrow: string; title: string; blurb: string; cta: string; accent: string };
export const minifeatures: Minifeature[] = [
  { slug: "midnight-watchlist", eyebrow: "01 · Mood Recommender", title: "Midnight Watchlist", blurb: "Tell us your mood. We'll find your next obsession — with reasons, not vibes.", cta: "Explore", accent: "#ff5ea8" },
  { slug: "second-lead-syndrome", eyebrow: "02 · Hall of Fame", title: "Second Lead Syndrome", blurb: "For the characters who deserved their own happy ending. A hall of fame for the almosts.", cta: "Explore", accent: "#9b5cff" },
  { slug: "emotional-damage", eyebrow: "03 · Tracker", title: "Emotional Damage Meter", blurb: "Some dramas end. The damage doesn't. Log exactly how destroyed you were.", cta: "Explore", accent: "#4aa8ff" },
];
