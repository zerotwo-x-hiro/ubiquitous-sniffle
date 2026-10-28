# KDramaWorld

A cinematic Korean-drama discovery site — Next.js-inspired, built with **Vite + React + TypeScript + Tailwind v4**.
Dark/light mode with glassmorphism, cinematic gradients, editorial shelves, top-rated canon, coming-soon slate,
actors, hand-built collections, and mood-recommender mini-features.

## Stack

- Vite 6 · React 18 · TypeScript 5 · React Router 6
- Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- Playfair Display (display) + Inter (UI)
- Deterministic CSS gradient "posters" (no external image dependencies)

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
npm run preview    # preview production build
npm run typecheck
```

## Features

- 🌓 Dark / light theme with `prefers-color-scheme` detection + localStorage persistence
- 🪟 Glassmorphism navigation, cards, shelves, and hero panels
- 🎞️ Cinematic hero with animated auroras, floating artwork card, and progress pill
- 🎬 Horizontal scroll-snap shelves (Discover, Recent, Romance, Thriller, Fantasy)
- 🏆 Top-rated canon with ranked medals and sticky sidebar
- 📅 2026 Coming-soon slate with network badges
- 🎭 Actor portraits carousel
- 🎨 8 genre collection cards with animated gradients
- 📚 Three hand-built editorial collections ("The All-Time Greats", "Hidden Gems", "Perfect Rom-Coms")
- 💘 Mini-features (Midnight Watchlist, Second Lead Syndrome, Emotional Damage Meter)
- ✉️ Footer with newsletter, sitemap columns, social buttons
- 📱 Fully responsive (mobile → widescreen)
