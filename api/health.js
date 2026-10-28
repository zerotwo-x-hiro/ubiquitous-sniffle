// Vercel Node serverless handler — /api/health
//
// Lightweight smoke endpoint:
//   - Reports build version (git SHA), node version, timestamp
//   - Probes the TVMaze upstream via the in-project proxy so we know
//     whether data fetches from the browser will work right now.
//   - Reports rough catalogue size (drama count) so we can alert if
//     the seed file ever collapses to zero.
//
// Safe to hit from uptime monitors. Returns 200 when upstream is reachable,
// 503 when TVMaze is unreachable (so monitors can page).

const UPSTREAM_TIMEOUT_MS = 5000;

// Slice of the curated catalogue so we don't have to import the full data
// graph inside a serverless function (keeps cold-start tiny).
//
// Keep this list in sync with src/data.ts (one slug per curated drama).
// It's only used for count reporting, not for correctness.
const CURATED_SLUGS = [
  "my-mister", "when-life-gives-you-tangerines", "twinkling-watermelon",
  "reply-1988", "lovely-runner", "alchemy-of-souls", "hospital-playlist",
  "goblin", "marry-my-husband", "business-proposal", "extraordinary-attorney-woo",
  "the-glory", "twenty-five-twenty-one", "my-dearest", "moon-lovers",
  "weightlifting-fairy", "coffee-prince", "fight-for-my-way", "my-liberation-notes",
  "run-on", "youth-of-may", "daily-dose-of-sunshine", "crash-landing-on-you",
  "mr-sunshine", "mouse", "flower-of-evil", "signal", "healer", "kingdom",
  "sky-castle", "tunnel", "squid-game", "arthdal", "secret-garden", "chicago-typewriter",
  "strangers-from-hell", "my-love-from-the-star", "whats-wrong-with-secretary-kim",
];

function baseOrigin(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || (host && host.includes("localhost") ? "http" : "https");
  return proto + "://" + host;
}

export default async function handler(req, res) {
  const started = Date.now();
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_MESSAGE || "dev";
  const commitSha = typeof commit === "string" && /^[0-9a-f]{7,40}$/i.test(commit) ? commit.slice(0, 7) : (process.env.VERCEL_GIT_COMMIT_SHA || "unknown").slice(0, 7);

  let tvmazeOk = false;
  let tvmazeLatencyMs = null;
  let tvmazeError = null;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), UPSTREAM_TIMEOUT_MS);
    const t0 = Date.now();
    const r = await fetch(baseOrigin(req) + "/api/tvmaze/shows/16150", {
      headers: { Accept: "application/json" },
      signal: ac.signal,
    });
    tvmazeLatencyMs = Date.now() - t0;
    clearTimeout(t);
    if (r.ok) {
      const body = await r.json();
      tvmazeOk = !!(body && body.id === 16150 && body.name);
      if (!tvmazeOk) tvmazeError = "unexpected-payload";
    } else {
      tvmazeError = "http-" + r.status;
    }
  } catch (e) {
    tvmazeError = String((e && e.message) || e);
  }

  const payload = {
    ok: tvmazeOk,
    service: "kdramaworld",
    version: commitSha,
    region: process.env.VERCEL_REGION || null,
    environment: process.env.VERCEL_ENV || "dev",
    deploymentUrl: process.env.VERCEL_URL || null,
    node: process.version,
    catalog: {
      curatedCount: CURATED_SLUGS.length,
    },
    dependencies: {
      tvmaze: { ok: tvmazeOk, latencyMs: tvmazeLatencyMs, error: tvmazeError },
    },
    ts: new Date().toISOString(),
    latencyMs: Date.now() - started,
  };

  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("access-control-allow-origin", "*");
  res.statusCode = tvmazeOk ? 200 : 503;
  res.end(JSON.stringify(payload));
}
