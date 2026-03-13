# AGENTS.md — Pulsar Website (Landing Page)

## Overview
Static marketing website for [Pulsar](https://github.com/Arkham-Advisory/pulsar) — the GitHub PR dashboard. Serves as the public-facing landing page, hosted on GitHub Pages.

This is a **standalone git repository**, separate from the main Pulsar app repo.

**Live URL**: https://pulsar.arkham-advisory.com

---

## Project structure
```
. (repo root)
  index.html                     Single-file landing page (HTML + inline CSS + inline JS)
  sitemap.xml                    XML sitemap for search engine indexing
  robots.txt                     robots.txt — allows all + points to sitemap
  README.md                      Human-facing docs
  AGENTS.md                      This file — agent/AI memory
  assets/
    favicon.svg                  Logo — sourced from Arkham-Advisory/pulsar app
    favicon.ico                  Favicon
    screenshots/                 App screenshots used on the landing page
      pr-list.png                PR list view, dark mode, 1440×900 @2x
      pr-list-pinned.png         PR list with Pinned section at top, dark mode, 1440×900 @2x
      pr-list-dnd.png            PR list with a section being dragged (mid-drag state), dark mode, 1440×900 @2x
      pr-list-light.png          PR list view, light mode, 1440×900 @2x
      pr-list-mobile.png         PR list view, mobile (390×844 @3x)
      pr-detail.png              PR list + open detail side panel, dark mode, 1440×900 @2x
      pr-detail-timeline.png     PR detail panel showing full lifecycle timeline (merged PR), dark mode, 1440×900 @2x
      pr-reviewer-filter.png     PR list with reviewer filter dropdown open, dark mode, 1440×900 @2x
      share-link.png             SharedLinkPreviewModal open over the PR list, dark mode, 1440×900 @2x
      dashboard.png              Dashboard view, dark mode, 1440×900 @2x
      dashboard-heatmap.png      Dashboard scrolled to show Contributor Heatmap, dark mode, 1440×900 @2x
      api-limits.png             API Rate Limits page, dark mode, 1440×900 @2x
  scripts/
    package.json                 Dependencies: @playwright/test
    screenshot.mjs               Playwright script — starts the app, captures screenshots
  .github/
    workflows/
      deploy.yml                 GitHub Actions: deploys this repo to GitHub Pages
```

The Playwright screenshot tool lives in `scripts/` inside this repo.

---

## Technology
- **Pure static HTML** — no build step, no bundler, no framework
- **Inline CSS** — all styles in a `<style>` block in `index.html`
- **Inline JS** — minimal JS for screenshot tab switching and smooth scroll
- **Google Fonts** — Inter (same as the app) loaded from CDN
- **No runtime dependencies**

---

## Visual style
Matches the Pulsar app's design system exactly:

| Token | Value |
|---|---|
| Background | `#020617` (slate-950) |
| Card / surface | `#0f172a` (slate-900) |
| Border | `#1e293b` (slate-800) |
| Primary text | `#f8fafc` (slate-50) |
| Secondary text | `#94a3b8` (slate-400) |
| Brand (primary) | `#6170f8` (brand-500) |
| Brand (button) | `#4e51ee` (brand-600) |
| Font | Inter, system-ui |

---

## How to update screenshots

Screenshots are taken with Playwright using mock GitHub API data.

### Prerequisites (one-time)
```bash
cd scripts
npm install
npx playwright install chromium
```

### Capture
```bash
cd scripts
node screenshot.mjs
# Outputs to: ../assets/screenshots/
```

The script starts the Pulsar app's Vite dev server. By default it expects the app at `../../app` (both repos cloned into the same parent folder). Override:
```bash
PULSAR_APP_DIR=/path/to/pulsar/app node screenshot.mjs
```

Then commit the updated PNGs to this repo.

The script:
1. Starts the Vite dev server (`app/`) on port 5174
2. Opens Chromium (headless) via Playwright
3. Injects mock `localStorage` settings (fake PAT, 2 repos: `acme-corp/frontend` and `acme-corp/api-service`)
4. Routes all `https://api.github.com/**` calls to return realistic mock data
5. Takes 12 screenshots:
   - `pr-list.png` — dark mode, 1440×900 @2x
   - `pr-list-pinned.png` — dark mode, Pinned section at top
   - `pr-list-dnd.png` — dark mode, section mid-drag
   - `pr-list-light.png` — light mode, 1440×900 @2x
   - `pr-list-mobile.png` — dark mode, 390×844 @3x
   - `pr-detail.png` — PR list with open detail panel, dark mode, 1440×900 @2x
   - `pr-detail-timeline.png` — PR detail panel with full lifecycle timeline (merged PR)
   - `pr-reviewer-filter.png` — reviewer dropdown open, dark mode
   - `share-link.png` — SharedLinkPreviewModal overlay, dark mode
   - `dashboard.png` — dark mode, after clicking "Dashboard" nav tab
   - `dashboard-heatmap.png` — dashboard scrolled to Contributor Heatmap
   - `api-limits.png` — API Rate Limits page, dark mode, 1440×900 @2x

### Extending mock data
Edit `MOCK_SETTINGS`, `frontendOpenPRs`, `apiOpenPRs`, `CI_RESPONSES`, and `REVIEW_RESPONSES` in `scripts/screenshot.mjs`.

---

## Editing the landing page

The entire website is in `index.html` (repo root). Key sections in order:

| Section | Where to find it | What it contains |
|---|---|---|
| `<nav>` | top of body | Logo, nav links, CTA button |
| `.hero` | `<!-- ── Hero` | Headline, subheadline, CTA buttons, hero screenshot |
| `.logos-bar` | after hero | "Works with any GitHub repository" strip |
| `#features` | `<section id="features">` | 6 feature cards + stats row |
| `#whats-new` | `<section id="whats-new">` | 7 recently-added feature cards (share links, drag & drop, pin, checkout, reviewer filter, timeline, heatmap) |
| `#screenshots` | `<section id="screenshots">` | Tab-based screenshot showcase |
| `#how-it-works` | `<section id="how-it-works">` | 3 steps + privacy highlight |
| `.cta-section` | near bottom | Final CTA with buttons |
| `<footer>` | bottom | Logo, links, attribution |

---

## GitHub Pages deployment

This repo deploys itself. The workflow at `.github/workflows/deploy.yml` uploads the repo root (`.`) as the Pages artifact — meaning `index.html`, `assets/`, etc. are all served directly.

### Enable GitHub Pages
1. Push this repo to GitHub (e.g. `Arkham-Advisory/pulsar-website`)
2. Go to **Settings → Pages → Source** and select **GitHub Actions**
3. Push to `main` — the workflow triggers automatically

### Custom domain (optional)
Create a `CNAME` file at the repo root:
```
your-custom-domain.com
```
Then configure DNS as per GitHub Pages docs.

---

## Commands
```bash
# Serve locally for preview
npx serve .
# or just open index.html in a browser — it works without a server

# Re-take screenshots
cd scripts && node screenshot.mjs
```

---

## Writing style
- **No em dashes (`—`) anywhere in the page content.** Use a comma, colon, or rewrite the sentence instead. This applies to all copy: meta tags, feature descriptions, captions, and any other user-visible text.

## Gotchas
- Screenshots are committed to this repo (`assets/screenshots/*.png`). Re-run `cd scripts && node screenshot.mjs` whenever the app UI changes significantly, then commit the updated PNGs here.
- All external links point to `https://app.pulsar.arkham-advisory.com` (the deployed app) and `https://github.com/Arkham-Advisory/pulsar`. Update these if the repo or deployment URL changes.
- The `<script>` tag's `showTab()` function finds the matching tab button by its `onclick` attribute, so it works both from tab buttons and from inline `<a>` links.
