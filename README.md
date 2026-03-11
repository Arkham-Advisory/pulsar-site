# Pulsar — Landing Page

Marketing website for **[Pulsar](https://github.com/Arkham-Advisory/pulsar)**, the GitHub PR dashboard for engineering teams.

**Live site**: https://arkham-advisory.github.io/pulsar-website/ *(update once deployed)*

---

## What's in here

```
.
├── index.html                   Single-file landing page
├── assets/
│   ├── favicon.svg              App logo
│   ├── favicon.ico
│   └── screenshots/             Real screenshots captured with Playwright
│       ├── pr-list.png
│       ├── dashboard.png
│       ├── pr-list-light.png
│       └── pr-list-mobile.png
├── scripts/
│   ├── package.json
│   └── screenshot.mjs           Playwright script that captures the screenshots
└── .github/
    └── workflows/
        └── deploy.yml           Deploys this repo to GitHub Pages on push to main
```

No build step. No bundler. Open `index.html` in a browser and it works.

---

## Local preview

```bash
# Option 1 — open directly (works for everything except relative font paths)
open index.html

# Option 2 — serve locally
npx serve .
# → http://localhost:3000
```

---

## Updating screenshots

Screenshots are taken with Playwright against the running [Pulsar app](https://github.com/Arkham-Advisory/pulsar) using fully mocked GitHub API data — no real token needed.

The script lives in `scripts/` inside this repo.

### Setup (one-time)

```bash
cd scripts
npm install
npx playwright install chromium
```

### Capture

```bash
cd scripts
node screenshot.mjs
# Output → ../assets/screenshots/
```

The script needs to start the Pulsar app's Vite dev server. By default it looks for the app at `../../app` (i.e. when both repos are cloned side by side in the same parent folder). Override with an env var if your layout differs:

```bash
PULSAR_APP_DIR=/path/to/pulsar/app node screenshot.mjs
```

This starts the Vite dev server, injects mock data, and captures 4 screenshots:

| File | Viewport | Mode |
|---|---|---|
| `pr-list.png` | 1440×900 @2x | Dark |
| `dashboard.png` | 1440×900 @2x | Dark (Dashboard tab) |
| `pr-list-light.png` | 1440×900 @2x | Light |
| `pr-list-mobile.png` | 390×844 @3x | Dark |

Commit the updated PNGs to this repo after re-capturing.

---
