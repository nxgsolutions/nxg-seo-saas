# nxg-seo-saas

Frontend for the Enterprise SEO + AI Search SaaS — a Next.js dashboard that talks
to the FastAPI backend ([`nxg-seo-saas-api`](https://github.com/nxgsolutions/nxg-seo-saas-api)).

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4 + shadcn (`base-nova`) over Base UI
- **Data:** TanStack Query + Axios, typed API clients in `src/lib/api/*`
- **Charts:** Recharts (lazy-loaded) · **Animation:** `motion`
- **Node:** 20 or newer

---

## Prerequisites

- **Node.js 20+** and npm — https://nodejs.org (the LTS installer includes npm)
- The **backend API** running locally (see the `nxg-seo-saas-api` repo). The
  dashboard expects it at `http://localhost:8000` by default.

Check your versions:

```bash
node -v   # should print v20.x or newer
npm -v
```

---

## Setup

Run these once, from the `frontend/` directory.

### macOS / Linux

```bash
cd frontend
npm install
cp .env.example .env.local        # then edit .env.local if your API runs elsewhere
```

### Windows (PowerShell)

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # then edit .env.local if your API runs elsewhere
```

### Environment variables (`.env.local`)

`.env.local` is **not** committed. Create it from `.env.example`:

```
# Base URL of the FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Public site URL (used for canonical/SEO links). Optional in dev.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Restart `npm run dev` after changing any `NEXT_PUBLIC_*` value — they are
> inlined at build/start time.

---

## Run the development server

Start the backend first (in a separate terminal), then:

### macOS / Linux

```bash
cd frontend
npm run dev
```

### Windows (PowerShell)

```powershell
cd frontend
npm run dev
```

Open **http://localhost:3000**.

In development, `/api/*` requests are proxied through Next.js to
`NEXT_PUBLIC_API_URL`, so authentication cookies work whether you open
`localhost:3000` or `127.0.0.1:3000`.

---

## Build & run for production

```bash
npm run build        # compile an optimized production build
npm run start        # serve the build on http://localhost:3000
```

In production the browser calls `NEXT_PUBLIC_API_URL` directly, so the backend's
`BACKEND_CORS_ORIGINS` and cookie settings must match the deployed origin.

---

## Other scripts

```bash
npm run lint                                 # ESLint
node --test tests/api-client.test.cjs        # API-client regression tests
```

---

## Dashboard features

Tools live under `src/app/dashboard/*`; navigation is configured in
`src/config/nav.ts`:

- **Keyword Analysis → Competitive Strategy → Action Plan**
- **Page Audit**, **Page Optimization**, **Content Optimization**, **Page Discovery**
- **SERP Analyzer** / **Keyword Breakdown** — SERPs saved as snapshots
- **Competitor Analysis** — editable competitor list, AI "Find competitors" by
  domain, rank-change-over-time chart
- **Rankings**, **Search Performance / GSC**, **Reports**, **Team**, **Billing**,
  **Settings** (per-domain niche / market / language)

A top-bar domain switcher drives a global `activeDomain` used across every page.

---

## Project layout

```
src/
  app/            # App Router pages (dashboard/*, auth, public)
  components/     # shared UI (dashboard, charts, auth, shadcn primitives)
  config/nav.ts   # dashboard navigation
  hooks/api/      # TanStack Query hooks
  lib/api/        # typed Axios clients (one file per backend domain)
public/           # static assets
tests/            # node:test suites
```

---

## Troubleshooting

- **Blank data / network errors in the dashboard** — the backend isn't running or
  `NEXT_PUBLIC_API_URL` is wrong. Start the API and confirm
  http://localhost:8000/health responds.
- **Changed the API URL but nothing happened** — stop and restart `npm run dev`.
- **`npm install` fails on an old Node** — upgrade to Node 20+ (`node -v`).
