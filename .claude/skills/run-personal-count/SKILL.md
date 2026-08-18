---
name: run-personal-count
description: Build, run, and drive Personal Count (finance tracker web app). Use when asked to start the app, run its tests, seed a database, take a screenshot of its UI, or interact with the running dashboard/transactions/charts screens.
---

Personal Count is a static HTML/JS frontend (no bundler) served together
with Vercel serverless functions (`/api`) backed by Postgres (Neon). It's
driven with `vercel dev` (dev server + API in one process) plus a small
Playwright REPL driver at `.claude/skills/run-personal-count/driver.mjs`
(there's no `chromium-cli` in this environment, so this is the fallback
raw-Playwright driver the run-skill-generator describes).

All paths below are relative to the repo root.

**Never point this at the real `DATABASE_URL` from `.env.local`.** That's
the user's actual production financial data. Always use a separate test
Neon database (see Setup) — the driver writes real rows via the real UI.

## Prerequisites

- Node.js (tested with v25.4.0) and the Vercel CLI, already installed and
  logged in (`vercel whoami` → `jacomunicacion`, project linked in
  `.vercel/project.json`).
- Playwright + Chromium, installed as a devDependency for this skill:

```bash
npm install --save-dev playwright
npx playwright install chromium
```

## Setup — a disposable test database

Do not reuse the project's `.env.local`. Create (or reuse) a separate Neon
project for testing and run the migrations against it directly with the
same driver the app uses (`@neondatabase/serverless`'s `neon()` — its HTTP
mode rejects multi-statement strings, so split each `.sql` file on
`;\n` and run statements one at a time):

```bash
node -e "
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const sql = neon(process.env.TEST_DB_URL);
(async () => {
  for (const f of ['db/001_init.sql', 'db/002_settings.sql']) {
    const statements = fs.readFileSync(f, 'utf8').split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) await sql(stmt);
  }
})();
"
```

Categories seed themselves the first time the frontend loads (see
`api/categories/seed.js`) — no separate step needed once the app is running
and you log in.

## Build

No build step — the frontend is plain HTML/JS served as static files.

## Run (agent path)

Launch `vercel dev` with the test DB's env vars (a fresh `APP_PASSWORD`
and `SESSION_SECRET` are fine — they don't need to match production):

```bash
DATABASE_URL='<test-neon-connection-string>' \
APP_PASSWORD='testpass123' \
SESSION_SECRET='0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd' \
vercel dev --listen 3111 --yes > /tmp/vercel-dev.log 2>&1 &

timeout 30 bash -c 'until curl -sf http://localhost:3111/login.html >/dev/null; do sleep 1; done'
```

Stop it with `lsof -ti:3111 -sTCP:LISTEN | xargs -r kill` (or just kill the
background job) before relaunching, or the next run hits `EADDRINUSE`.

Drive it with the REPL driver — pipe a script to stdin, one command per
line:

```bash
node .claude/skills/run-personal-count/driver.mjs <<'EOF'
nav http://localhost:3111/login.html
wait-for #password
fill #password testpass123
click #submit-btn
wait-for text=Estado de Mis Finanzas
wait-idle
click #btn-pagar
wait-for #transaction-name
fill #transaction-name Smoke test
fill #transaction-amount 123.45
fill #transaction-date 2026-08-18
click #transaction-submit-btn
wait-ms 1500
screenshot after-submit
click button[data-screen=transactions]
wait-for text=Smoke test
screenshot transactions-list
EOF
```

Screenshots land in `.claude/skills/run-personal-count/screenshots/<name>.png`.

| command | what it does |
|---|---|
| `nav <url>` | navigate |
| `wait-for <selector>` | wait for a CSS selector to be visible |
| `wait-for text=<text>` | wait for text to appear anywhere on the page |
| `wait-idle` | wait for network to go quiet — see Gotchas, do this once after login before the first click |
| `wait-ms <n>` | fixed wait, use sparingly |
| `fill <selector> <value>` | fill an input |
| `click <selector>` | click |
| `press <key>` | keyboard press (e.g. `Enter`) |
| `screenshot [name]` | full-page screenshot |
| `eval <js>` | `page.evaluate(js)`, prints the JSON result |
| `text <selector>` | print an element's textContent |

Console errors and page errors print to stderr automatically as each
command runs — check them, don't just check exit code.

## Run (human path)

`vercel dev` opens no window on its own; open `http://localhost:3111` in a
real browser. Same env vars as above. Ctrl-C to stop.

## Test

```bash
npm test
```

119 tests, all pure-function unit tests (date ranges, search, validation)
— no DB or server needed.

---

## Gotchas

- **The first click after login needs `wait-idle`, not just `wait-for text=...`.**
  On login, `loginPage.js` navigates to `index.html`, which then loads ~30
  `<script src>` tags in sequence and fires off the categories/transactions
  API calls. The dashboard text ("Estado de Mis Finanzas") is visible
  before every script has finished attaching its listeners — a `click` on
  `#btn-pagar` right after that text appears lands on a button with no
  listener yet and silently does nothing (no error, the modal just never
  opens). Waiting for `networkidle` after the dashboard text appears fixed
  it reliably. This is normal app behavior, not a bug — the user confirmed
  a few seconds' load time on open is expected.
- **`@neondatabase/serverless`'s `neon()` HTTP driver refuses multi-statement
  strings** (`cannot insert multiple commands into a prepared statement`).
  Split `.sql` migration files into individual statements before running
  them (see Setup).
- **The seed endpoint (`/api/categories/seed`) requires an authenticated
  session** — log in first, then let the frontend call it (it does this
  automatically on load once categories are empty), or call it yourself
  with the session cookie from `/api/auth/login`.

## Troubleshooting

- **`page.waitForSelector` times out with "locator resolved to hidden"
  on `#transaction-name`**: you clicked the action button before the app
  finished settling. Add `wait-idle` before the click (see Gotchas).
- **`sql.query is not a function` / `sql.transaction`**: this project's
  `@neondatabase/serverless` version (0.9.5) exposes `neon()` as a callable
  tagged-template function, not an object with `.query()`. Call `sql(stmt)`
  directly for a plain string, not `sql.query(stmt)`.
