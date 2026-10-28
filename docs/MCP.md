# MCP servers registered for Codex

This workspace uses Codex as its MCP client. Config lives at `~/.codex/config.toml`.

| Server | Command | Purpose | Browsers/auth needed |
|---|---|---|---|
| **rea** | `npx -y rea-agents@6.7.0 mcp` | Reverse-engineering (native, JS/Electron, .NET, EVM, …) | Ghidra + JDK 21 for native analysis (see `~/tools/rea-SETUP.md`) |
| **github** | `mcp-server-github` | Repos, PRs, issues, search, code, files | `GITHUB_TOKEN` (mirrored from `GH_TOKEN` in `~/.bashrc`) |
| **playwright** | `playwright-mcp --headless` | Headless browser automation (navigate, click, screenshot, fill) | Chromium via `npx -y playwright install chromium` |
| **chrome-devtools** | `chrome-devtools-mcp --headless --isolated` | Deep Chrome DevTools access (DOM, network, perf, debugger) | Google Chrome / Chromium installed on PATH |
| **context7** | `context7-mcp` | Fresh library/framework docs pulled on demand | None (free tier) |
| **graftmap** | `graft serve` | Local codebase map (defs, xrefs, impact, search) | None (indexes the repo at cwd) |

After changing `~/.codex/config.toml`, restart Codex to pick up new servers.

## Per-server notes

- **chrome-devtools** and **playwright** both drive a Chromium-family browser. They are registered with `--headless --isolated` so they start a throwaway profile on demand. In this sandbox the Playwright/Chrome binary download CDNs are blocked, so browser-backed servers won't start their browser until you run on a machine with egress OR `apt-get install chromium` works; until then their MCP endpoints still boot (they launch the browser on first tool call).
- **rea** is fully usable for static targets (JS/Electron, .NET, Go/Rust, EVM, Flutter, artifacts) without Ghidra. Native decompilation needs Ghidra 12.1.x + JDK 21 (see `~/tools/rea-SETUP.md`).
- **github** picks up the same `gh` CLI token you already have authenticated; no extra config.
- **context7** works without a key. Set `CONTEXT7_API_KEY` (and add `[mcp_servers.context7.env]`) if you hit rate limits.
- **graftmap** works best when Codex is opened inside a repo; it indexes with tree-sitter and exposes code navigation tools.

## Adding more clients

Use `rea setup --client <name> --yes` for REA on other clients (Cursor, Claude Code, Gemini CLI, …). For the other 5 servers, replicate the `[mcp_servers.<name>]` blocks into the client's MCP config file (Cursor: `~/.cursor/mcp.json`, Claude Desktop: `~/.config/Claude/claude_desktop_config.json`, etc.).
