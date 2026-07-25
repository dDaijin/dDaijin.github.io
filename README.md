# RateFeed — Live Currency &amp; Crypto Parser

A single-page JavaScript demo: fetch two public, keyless JSON APIs client-side, parse the responses, and render them into live tables. No backend, no build step, no external fonts — just `fetch`, `async/await`, and the DOM.

## What it demonstrates

- **`fetch()` + `async/await`** — two requests fired in parallel with `Promise.allSettled`, so one API failing doesn't break the other.
- **JSON parsing & reshaping** — turning `{ rates: { EUR: 0.86, ... } }` and `{ bitcoin: { usd: 67000, usd_24h_change: 1.2 } }` into flat row objects ready to render.
- **DOM rendering without a framework** — rows are built with `document.createElement` / `textContent`, no `innerHTML` string-building of untrusted data.
- **Error handling** — a failed request shows an inline error row instead of breaking the page, and is logged to the on-page console panel.
- **A live request log** — the "parser.log" panel shows each request and parse step as it happens, so the fetch → parse → render pipeline is visible, not hidden.

## Data sources

| Panel | API | Auth | Notes |
|---|---|---|---|
| Foreign exchange | [Frankfurter](https://frankfurter.dev) (`api.frankfurter.dev`) | None | European Central Bank reference rates, ~31 major currencies, updated on business days |
| Crypto markets | [CoinGecko](https://www.coingecko.com/en/api) keyless public endpoint (`api.coingecko.com`) | None | Public rate limit ~30 calls/min — fine for personal/portfolio use |

Both APIs are free, require no signup or API key, and have CORS enabled, so they can be called directly from browser JavaScript.

## Tech Stack

Plain **HTML5 / CSS3 / vanilla JavaScript**. Fonts are the OS system-font stack (`-apple-system`, `Segoe UI`, `Roboto`, etc. for UI; `ui-monospace` / `Consolas` / `Menlo` for data and the console panel) — no Google Fonts or other external font loading.

## Project Structure

```
rate-parser/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js       # all fetch + parse + render logic
└── README.md
```

## Running locally

Static site, no build step:

```bash
git clone <this-repo-url>
cd rate-parser
python3 -m http.server 8000
```

Visit `http://localhost:8000`. (Opening `index.html` directly by double-clicking also works in most browsers, since there's no server-only dependency.)

## Deploying

Works as-is on GitHub Pages, Netlify, or Vercel — point them at the repo root.

## Notes

- Rates and prices are for informational/demo purposes only — not financial advice.
- If a request fails (rate limit, network issue, ad-blocker blocking the API domain), the affected panel shows an error row and the console log records what happened, rather than the whole page breaking.
