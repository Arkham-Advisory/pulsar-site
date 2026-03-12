/**
 * Playwright screenshot script for the Pulsar landing page.
 * Starts the Vite dev server, injects mock GitHub API data,
 * and captures screenshots into assets/screenshots/.
 *
 * Usage:
 *   cd scripts
 *   npm install
 *   npx playwright install chromium
 *   node screenshot.mjs
 *
 * The Pulsar app repo must be available. By default the script looks for it at
 * ../../app (i.e. a sibling directory when both repos are cloned side by side).
 * Override with the PULSAR_APP_DIR environment variable:
 *
 *   PULSAR_APP_DIR=/path/to/pulsar/app node screenshot.mjs
 *
 * Output: ../assets/screenshots/*.png
 */

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR  = path.resolve(__dirname, '../assets/screenshots');
const APP_DIR  = process.env.PULSAR_APP_DIR ?? path.resolve(__dirname, '../../app');
const PORT     = 5174;
const APP_URL  = `http://localhost:${PORT}`;

console.log(`App directory: ${APP_DIR}`);

// ─── Mock data ────────────────────────────────────────────────────────────────

const NOW = new Date('2026-03-11T10:00:00Z');
const d = (daysAgo, h = 0) => new Date(NOW - (daysAgo * 86400 + h * 3600) * 1000).toISOString();

const AVATARS = {
  alexchen:  'https://avatars.githubusercontent.com/u/1?v=4',
  'sarah.kim': 'https://avatars.githubusercontent.com/u/2?v=4',
  'marcus.t':  'https://avatars.githubusercontent.com/u/3?v=4',
  'priya.v':   'https://avatars.githubusercontent.com/u/4?v=4',
  'leo.wang':  'https://avatars.githubusercontent.com/u/5?v=4',
};

function user(login) {
  return { login, avatar_url: AVATARS[login] ?? `https://avatars.githubusercontent.com/u/99?v=4`, html_url: `https://github.com/${login}` };
}

function makePR(id, number, title, repo, authorLogin, opts = {}) {
  const {
    state = 'open',
    merged = false,
    draft = false,
    labels = [],
    requestedReviewers = [],
    sha = `abc${id}`,
    updatedDaysAgo = 1,
    createdDaysAgo = 5,
    mergedDaysAgo = null,
    closedDaysAgo = null,
    baseBranch = 'main',
    headBranch = `feature/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
  } = opts;

  return {
    id,
    number,
    title,
    html_url: `https://github.com/${repo}/pull/${number}`,
    state: merged ? 'closed' : state,
    draft,
    merged_at: mergedDaysAgo !== null ? d(mergedDaysAgo) : null,
    closed_at: (mergedDaysAgo !== null || closedDaysAgo !== null) ? d(mergedDaysAgo ?? closedDaysAgo) : null,
    created_at: d(createdDaysAgo),
    updated_at: d(updatedDaysAgo),
    user: user(authorLogin),
    labels: labels.map(([name, color]) => ({ name, color })),
    requested_reviewers: requestedReviewers.map(login => user(login)),
    requested_teams: [],
    assignees: [],
    base: { ref: baseBranch, label: `acme-corp:${baseBranch}` },
    head: { ref: headBranch, sha, label: `acme-corp:${headBranch}` },
    review_comments: 3,
    comments: 1,
    commits: 4,
  };
}

// ─── Frontend repo PRs ────────────────────────────────────────────────────────
const frontendOpenPRs = [
  makePR(10142, 142, 'feat: add dashboard analytics widget', 'acme-corp/frontend', 'sarah.kim', {
    labels: [['enhancement', '84b6eb'], ['dashboard', '0075ca']],
    sha: 'fe142sha', updatedDaysAgo: 0.3, createdDaysAgo: 4,
  }),
  makePR(10141, 141, 'fix: resolve hydration mismatch in SSR header', 'acme-corp/frontend', 'marcus.t', {
    labels: [['bug', 'd93f0b']],
    sha: 'fe141sha', updatedDaysAgo: 0.5, createdDaysAgo: 2,
  }),
  makePR(10140, 140, 'refactor: extract shared form components', 'acme-corp/frontend', 'priya.v', {
    labels: [['refactor', 'e4e669']],
    requestedReviewers: ['alexchen'],
    sha: 'fe140sha', updatedDaysAgo: 1, createdDaysAgo: 6,
  }),
  makePR(10139, 139, 'chore: upgrade Vite and React to latest', 'acme-corp/frontend', 'leo.wang', {
    labels: [['dependencies', '0052cc']],
    sha: 'fe139sha', updatedDaysAgo: 8, createdDaysAgo: 10,
  }),
  makePR(10138, 138, 'feat: dark mode theming for reporting page', 'acme-corp/frontend', 'alexchen', {
    draft: true,
    labels: [['enhancement', '84b6eb'], ['wip', 'fbca04']],
    sha: 'fe138sha', updatedDaysAgo: 1.5, createdDaysAgo: 3,
  }),
];

const frontendMergedPRs = [
  makePR(10137, 137, 'feat: add CSV export to table component', 'acme-corp/frontend', 'sarah.kim', {
    state: 'closed', merged: true, labels: [['enhancement', '84b6eb']],
    sha: 'fe137sha', updatedDaysAgo: 5, createdDaysAgo: 9, mergedDaysAgo: 5,
  }),
  makePR(10136, 136, 'fix: tooltip positioning on mobile', 'acme-corp/frontend', 'priya.v', {
    state: 'closed', merged: true, labels: [['bug', 'd93f0b']],
    sha: 'fe136sha', updatedDaysAgo: 8, createdDaysAgo: 12, mergedDaysAgo: 8,
  }),
  makePR(10135, 135, 'docs: update component API reference', 'acme-corp/frontend', 'marcus.t', {
    state: 'closed', merged: true, labels: [['documentation', '0075ca']],
    sha: 'fe135sha', updatedDaysAgo: 12, createdDaysAgo: 14, mergedDaysAgo: 12,
  }),
];

// ─── API-service repo PRs ─────────────────────────────────────────────────────
const apiOpenPRs = [
  makePR(20089, 89, 'feat: implement rate limiting middleware', 'acme-corp/api-service', 'marcus.t', {
    labels: [['enhancement', '84b6eb'], ['security', 'e11d48']],
    sha: 'api89sha', updatedDaysAgo: 0.2, createdDaysAgo: 3,
  }),
  makePR(20088, 88, 'fix: database connection pool leak under load', 'acme-corp/api-service', 'priya.v', {
    labels: [['bug', 'd93f0b'], ['performance', 'c5def5']],
    sha: 'api88sha', updatedDaysAgo: 0.8, createdDaysAgo: 2,
  }),
  makePR(20087, 87, 'feat: add /healthz liveness probe endpoint', 'acme-corp/api-service', 'sarah.kim', {
    labels: [['enhancement', '84b6eb']],
    requestedReviewers: ['alexchen'],
    sha: 'api87sha', updatedDaysAgo: 1.2, createdDaysAgo: 5,
  }),
  makePR(20086, 86, 'feat: add distributed tracing with OpenTelemetry', 'acme-corp/api-service', 'alexchen', {
    labels: [['enhancement', '84b6eb'], ['observability', '7057ff']],
    sha: 'api86sha', updatedDaysAgo: 2, createdDaysAgo: 7,
  }),
  makePR(20085, 85, 'chore: update OpenAPI spec to v3.1', 'acme-corp/api-service', 'marcus.t', {
    draft: true, labels: [['documentation', '0075ca']],
    sha: 'api85sha', updatedDaysAgo: 3, createdDaysAgo: 5,
  }),
];

const apiMergedPRs = [
  makePR(20084, 84, 'feat: JWT refresh token rotation', 'acme-corp/api-service', 'alexchen', {
    state: 'closed', merged: true, labels: [['enhancement', '84b6eb'], ['security', 'e11d48']],
    sha: 'api84sha', updatedDaysAgo: 3, createdDaysAgo: 8, mergedDaysAgo: 3,
  }),
  makePR(20083, 83, 'fix: race condition in session cleanup', 'acme-corp/api-service', 'priya.v', {
    state: 'closed', merged: true, labels: [['bug', 'd93f0b']],
    sha: 'api83sha', updatedDaysAgo: 7, createdDaysAgo: 11, mergedDaysAgo: 7,
  }),
  makePR(20082, 82, 'refactor: migrate to async/await throughout', 'acme-corp/api-service', 'leo.wang', {
    state: 'closed', merged: true, labels: [['refactor', 'e4e669']],
    sha: 'api82sha', updatedDaysAgo: 10, createdDaysAgo: 15, mergedDaysAgo: 10,
  }),
  makePR(20081, 81, 'chore: upgrade Node.js to v22 LTS', 'acme-corp/api-service', 'sarah.kim', {
    state: 'closed', merged: true, labels: [['dependencies', '0052cc']],
    sha: 'api81sha', updatedDaysAgo: 14, createdDaysAgo: 17, mergedDaysAgo: 14,
  }),
];

// ─── CI check-run responses ───────────────────────────────────────────────────
const CI_RESPONSES = {
  fe142sha: [{ name: 'CI / build', status: 'completed', conclusion: 'success' }, { name: 'CI / test', status: 'completed', conclusion: 'success' }],
  fe141sha: [{ name: 'CI / build', status: 'completed', conclusion: 'failure' }, { name: 'CI / test', status: 'completed', conclusion: 'failure' }],
  fe140sha: [{ name: 'CI / build', status: 'completed', conclusion: 'success' }, { name: 'CI / test', status: 'completed', conclusion: 'success' }],
  fe139sha: [{ name: 'CI / build', status: 'in_progress', conclusion: null }],
  fe138sha: [],
  api89sha: [{ name: 'CI / build', status: 'completed', conclusion: 'success' }, { name: 'CI / test', status: 'completed', conclusion: 'success' }, { name: 'Security / snyk', status: 'completed', conclusion: 'success' }],
  api88sha: [{ name: 'CI / build', status: 'completed', conclusion: 'failure' }, { name: 'CI / test', status: 'completed', conclusion: 'failure' }],
  api87sha: [{ name: 'CI / build', status: 'completed', conclusion: 'success' }],
  api86sha: [{ name: 'CI / build', status: 'completed', conclusion: 'success' }, { name: 'CI / test', status: 'completed', conclusion: 'success' }],
  api85sha: [],
};

// ─── Review responses ─────────────────────────────────────────────────────────
const REVIEW_RESPONSES = {
  'acme-corp/frontend:142': [{ id: 1, user: user('alexchen'), state: 'APPROVED', submitted_at: d(0.5) }],
  'acme-corp/frontend:141': [{ id: 2, user: user('sarah.kim'), state: 'CHANGES_REQUESTED', submitted_at: d(0.6) }],
  'acme-corp/frontend:140': [],
  'acme-corp/frontend:139': [],
  'acme-corp/frontend:138': [],
  'acme-corp/api-service:89': [{ id: 3, user: user('alexchen'), state: 'APPROVED', submitted_at: d(0.3) }, { id: 4, user: user('sarah.kim'), state: 'APPROVED', submitted_at: d(0.4) }],
  'acme-corp/api-service:88': [{ id: 5, user: user('marcus.t'), state: 'CHANGES_REQUESTED', submitted_at: d(1) }],
  'acme-corp/api-service:87': [],
  'acme-corp/api-service:86': [],
  'acme-corp/api-service:85': [],
};

// ─── Detailed PR responses (for dashboard enrichment) ────────────────────────
function detailResponse(pr, additions, deletions, changedFiles, body = '## Summary\n\nThis PR adds improvements to the codebase.', mergeable = true) {
  return { ...pr, additions, deletions, changed_files: changedFiles, body, commits: 4, comments: 2, review_comments: 3, mergeable };
}
const PR_DETAIL_RESPONSES = {
  'acme-corp/frontend:142': detailResponse(frontendOpenPRs[0], 312, 45, 8,
    '## Summary\n\nAdds the analytics widget to the main dashboard. Pulls data from the existing metrics API and renders a sparkline chart using Recharts.\n\n## Changes\n\n- New `AnalyticsWidget` component in `components/dashboard/`\n- Wired up to `/api/metrics` endpoint\n- Added loading skeleton and empty state\n- Unit tests for data transformation helpers\n\n## Testing\n\n```\nnpm run test -- --testPathPattern=AnalyticsWidget\n```\n\n> Closes #138'),
  'acme-corp/frontend:141': detailResponse(frontendOpenPRs[1], 28, 14, 3),
  'acme-corp/frontend:140': detailResponse(frontendOpenPRs[2], 187, 92, 12),
  'acme-corp/frontend:139': detailResponse(frontendOpenPRs[3], 5, 5, 4, '## Summary\n\nThis PR adds improvements to the codebase.', false),
  'acme-corp/frontend:138': detailResponse(frontendOpenPRs[4], 420, 12, 6),
  'acme-corp/frontend:137': detailResponse(frontendMergedPRs[0], 203, 18, 7),
  'acme-corp/frontend:136': detailResponse(frontendMergedPRs[1], 15, 8, 2),
  'acme-corp/frontend:135': detailResponse(frontendMergedPRs[2], 45, 22, 5),
  'acme-corp/api-service:89': detailResponse(apiOpenPRs[0], 156, 12, 5),
  'acme-corp/api-service:88': detailResponse(apiOpenPRs[1], 67, 34, 6),
  'acme-corp/api-service:87': detailResponse(apiOpenPRs[2], 34, 0, 3),
  'acme-corp/api-service:86': detailResponse(apiOpenPRs[3], 287, 23, 9),
  'acme-corp/api-service:85': detailResponse(apiOpenPRs[4], 78, 12, 4),
  'acme-corp/api-service:84': detailResponse(apiMergedPRs[0], 445, 78, 11),
  'acme-corp/api-service:83': detailResponse(apiMergedPRs[1], 23, 18, 3),
  'acme-corp/api-service:82': detailResponse(apiMergedPRs[2], 312, 298, 24),
  'acme-corp/api-service:81': detailResponse(apiMergedPRs[3], 12, 8, 3),
};

// ─── Settings to inject into localStorage ────────────────────────────────────
const MOCK_SETTINGS = {
  state: {
    pat: 'ghp_mockpat1234567890abcdefgh',
    userLogin: 'alexchen',
    selectedRepos: ['acme-corp/frontend', 'acme-corp/api-service'],
    repoFilters: [
      { id: 'f1', type: 'repo', owner: 'acme-corp', repo: 'frontend' },
      { id: 'f2', type: 'repo', owner: 'acme-corp', repo: 'api-service' },
    ],
    timeRange: '30d',
    staleDaysThreshold: 7,
    darkMode: true,
    refreshIntervalMinutes: 5,
    sectionOpen: {
      readyToMerge: true,
      attention: true,
      reviewRequested: true,
      mine: true,
      allOpen: true,
      drafts: false,
      merged: false,
    },
    analyticsConsent: false,
    hideBotPRs: false,
    filterPresets: [],
  },
  version: 0,
};

// ─── API route handler ────────────────────────────────────────────────────────
function setupRoutes(page) {
  page.route('https://api.github.com/**', async (route) => {
    const url = new URL(route.request().url());
    const urlPath = url.pathname;
    const params = Object.fromEntries(url.searchParams.entries());

    const json = (data, status = 200, headers = {}) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: {
          'X-OAuth-Scopes': 'repo, read:org',
          'X-RateLimit-Limit': '5000',
          'X-RateLimit-Remaining': '4823',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
          ...headers,
        },
        body: JSON.stringify(data),
      });

    if (urlPath === '/user' || urlPath === '/users/alexchen') {
      return json({ login: 'alexchen', id: 1, avatar_url: AVATARS.alexchen, html_url: 'https://github.com/alexchen' });
    }

    if (urlPath === '/rate_limit') {
      return json({
        resources: {
          core:    { limit: 5000, used: 177, remaining: 4823, reset: Math.floor(Date.now() / 1000) + 3600 },
          search:  { limit: 30,   used: 2,   remaining: 28,   reset: Math.floor(Date.now() / 1000) + 60 },
          graphql: { limit: 5000, used: 50,  remaining: 4950, reset: Math.floor(Date.now() / 1000) + 3600 },
        },
        rate: { limit: 5000, used: 177, remaining: 4823, reset: Math.floor(Date.now() / 1000) + 3600 },
      });
    }

    const pullsMatch = urlPath.match(/^\/repos\/([^/]+)\/([^/]+)\/pulls$/);
    if (pullsMatch) {
      const [, owner, repo] = pullsMatch;
      const repoKey = `${owner}/${repo}`;
      const state = params.state ?? 'open';
      if (repoKey === 'acme-corp/frontend')    return json(state === 'open' ? frontendOpenPRs : frontendMergedPRs);
      if (repoKey === 'acme-corp/api-service') return json(state === 'open' ? apiOpenPRs : apiMergedPRs);
      return json([]);
    }

    const prDetailMatch = urlPath.match(/^\/repos\/([^/]+)\/([^/]+)\/pulls\/(\d+)$/);
    if (prDetailMatch) {
      const [, owner, repo, number] = prDetailMatch;
      const detail = PR_DETAIL_RESPONSES[`${owner}/${repo}:${number}`];
      return detail ? json(detail) : json({ message: 'Not Found' }, 404);
    }

    const checkRunsMatch = urlPath.match(/^\/repos\/([^/]+)\/([^/]+)\/commits\/([^/]+)\/check-runs$/);
    if (checkRunsMatch) {
      const [, , , sha] = checkRunsMatch;
      const runs = CI_RESPONSES[sha] ?? [];
      return json({ total_count: runs.length, check_runs: runs });
    }

    const reviewsMatch = urlPath.match(/^\/repos\/([^/]+)\/([^/]+)\/pulls\/(\d+)\/reviews$/);
    if (reviewsMatch) {
      const [, owner, repo, number] = reviewsMatch;
      return json(REVIEW_RESPONSES[`${owner}/${repo}:${number}`] ?? []);
    }

    console.warn('[mock] unhandled:', urlPath);
    return json({ message: 'Not Found' }, 404);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function startDevServer() {
  console.log('Starting Vite dev server...');
  const vite = spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--host'], {
    cwd: APP_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Vite server timeout')), 30000);
    vite.stdout.on('data', (data) => {
      const line = data.toString();
      if (line.includes('Local:') || line.includes('ready')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    vite.stderr.on('data', (data) => {
      const line = data.toString();
      if (line.includes('Error') || line.includes('error')) {
        console.error('[vite]', line);
      }
    });
    vite.on('error', reject);
  });

  console.log('Dev server ready.');
  return vite;
}

async function takeScreenshots() {
  await mkdir(OUT_DIR, { recursive: true });

  let viteProcess;
  let browser;

  try {
    viteProcess = await startDevServer();
    await new Promise(r => setTimeout(r, 1000));

    browser = await chromium.launch({ headless: true });

    // PR List — dark
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      setupRoutes(page);
      await page.addInitScript(s => { window.localStorage.setItem('pr-dashboard-settings', JSON.stringify(s)); }, MOCK_SETTINGS);
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForSelector('[data-section-id]', { timeout: 20000 }).catch(() => page.waitForTimeout(4000));
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${OUT_DIR}/pr-list.png`, fullPage: false });
      console.log('✓ pr-list.png');
      await ctx.close();
    }

    // Dashboard — dark
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      setupRoutes(page);
      await page.addInitScript(s => { window.localStorage.setItem('pr-dashboard-settings', JSON.stringify(s)); }, MOCK_SETTINGS);
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.click('button:has-text("Dashboard")');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: `${OUT_DIR}/dashboard.png`, fullPage: false });
      console.log('✓ dashboard.png');
      await ctx.close();
    }

    // PR List — light
    {
      const lightSettings = { ...MOCK_SETTINGS, state: { ...MOCK_SETTINGS.state, darkMode: false } };
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      setupRoutes(page);
      await page.addInitScript(s => { window.localStorage.setItem('pr-dashboard-settings', JSON.stringify(s)); }, lightSettings);
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: `${OUT_DIR}/pr-list-light.png`, fullPage: false });
      console.log('✓ pr-list-light.png');
      await ctx.close();
    }

    // PR List — mobile
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', deviceScaleFactor: 3 });
      const page = await ctx.newPage();
      setupRoutes(page);
      await page.addInitScript(s => { window.localStorage.setItem('pr-dashboard-settings', JSON.stringify(s)); }, MOCK_SETTINGS);
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${OUT_DIR}/pr-list-mobile.png`, fullPage: false });
      console.log('✓ pr-list-mobile.png');
      await ctx.close();
    }

    // API Limits page
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      setupRoutes(page);
      await page.addInitScript(s => { window.localStorage.setItem('pr-dashboard-settings', JSON.stringify(s)); }, MOCK_SETTINGS);
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.click('button:has-text("API Limits")');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${OUT_DIR}/api-limits.png`, fullPage: false });
      console.log('✓ api-limits.png');
      await ctx.close();
    }

    // PR detail side panel
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      setupRoutes(page);
      await page.addInitScript(s => { window.localStorage.setItem('pr-dashboard-settings', JSON.stringify(s)); }, MOCK_SETTINGS);
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForSelector('div[role="button"]', { timeout: 20000 });
      await page.waitForTimeout(2000);
      // Click the first PR row (feat: add dashboard analytics widget)
      await page.locator('div[role="button"]').first().click();
      // Wait for the detail panel to animate in and the detail fetch to complete
      await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${OUT_DIR}/pr-detail.png`, fullPage: false });
      console.log('✓ pr-detail.png');
      await ctx.close();
    }

  } finally {
    if (browser) await browser.close();
    if (viteProcess) {
      viteProcess.kill('SIGTERM');
      console.log('Dev server stopped.');
    }
  }
}

takeScreenshots()
  .then(() => { console.log('\nAll screenshots saved to assets/screenshots/'); })
  .catch((err) => { console.error('Screenshot failed:', err); process.exit(1); });
