# Clearway — Loan Calculator (Portfolio Demo)

A front-end-only demo of a loan calculator and multi-step application flow. Built to showcase interactive UI (custom sliders, live data visualization, multi-step form with validation, client-side file preview) without any of the risk of a real data-collection form.

**Live concept:** same UI surface as a typical "instant loan" application — sliders, personal-details form, document upload, confirmation screen — but fully static and self-contained.

## Why it's safe to publish

This project is intentionally built with **no backend and no data transmission**:

- No `fetch`, `XMLHttpRequest`, or form `action` anywhere in the code — nothing is ever sent to a server.
- The "document upload" step only creates a local `URL.createObjectURL()` preview; the file is never read into memory beyond the browser tab and never uploaded.
- Form values live in JavaScript variables / the DOM only. Nothing is written to `localStorage`, a database, or a third party.
- Refreshing or closing the tab discards everything.

A banner at the top of the page and a dedicated "How it works" section make this explicit to anyone visiting the live site.

## Features

- **Live loan calculator** — three sliders (amount, term, APR) drive a real amortization calculation (monthly payment, total interest) and an animated principal/interest breakdown bar.
- **4-step application wizard** — loan summary → applicant details (with validation) → document preview → review & simulated submit.
- **Simulated submission** — a confirmation screen that explicitly explains no data was sent anywhere.
- Fully responsive, keyboard-accessible, and respects `prefers-reduced-motion`.

## Tech Stack

Plain **HTML5 / CSS3 / vanilla JavaScript** — no framework, no build step, no dependencies. Fonts (Fraunces, IBM Plex Sans, IBM Plex Mono) are loaded from Google Fonts.

## Project Structure

```
clearway-demo/
├── index.html       # markup for hero, calculator, wizard, confirmation
├── css/
│   └── style.css    # design tokens + all styling
├── js/
│   └── app.js        # calculator math + wizard logic (no network calls)
└── README.md
```

## Running locally

No build step needed — it's a static site.

```bash
git clone <this-repo-url>
cd clearway-demo
# open index.html directly, or serve it:
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying

Works out of the box on GitHub Pages, Netlify, or Vercel as a static site — just point them at the repo root.

## Background

This project intentionally reuses the visual concept of an earlier loan-application UI experiment of mine that (in an early, non-published version) collected real personal data and documents to a backend. This rebuild removes all of that: no backend, no file handling, no data collection of any kind — while keeping the interesting front-end problems (live calculations, multi-step form UX, file preview) that made the original worth building in the first place.
