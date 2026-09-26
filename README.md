# pricing-delivery

Standalone delivery-pricing app (extracted from `novalux` / myshop dashboard).

Shows ECOTRACK delivery fees (home 🏠 / office 🏢) for all 58 Algerian wilayas,
with search, per-wilaya price cards and a copy-prices button.

## Setup

```bash
npm install
cp .env.example .env   # then fill ECOTRACK_TOKEN + ECOTRACK_BASE_URL
npm run dev
```

Selecting a wilaya expands its row with the home/office prices, a copy button and
the stop-desk offices (ECOTRACK `/api/v1/get/desks`) available in that wilaya.

The three API routes (`/api/fees`, `/api/wilayas`, `/api/desks`) are served two ways:

- **Local**: Vite middlewares defined in `vite.config.js` (work in `npm run dev` and `npm run preview`).
- **Vercel**: serverless functions in `api/fees.js`, `api/wilayas.js` and `api/desks.js`
  (a static build has no Vite server, so the middlewares don't exist there).

## Deploy (Vercel)

Push the repo and import it in Vercel (framework preset: Vite — build `npm run build`,
output `dist`). Then add the environment variables under
**Project → Settings → Environment Variables** and redeploy:

```
ECOTRACK_TOKEN=<your token>
ECOTRACK_BASE_URL=<ecotrack base url>
```

`.env` is gitignored, so Vercel does **not** get these values automatically — without
them `/api/fees` and `/api/wilayas` return 500 and the app shows "تعذّر تحميل الأسعار"
(`/api/desks` failing only hides the stop-desk list, prices still load).

## Build

```bash
npm run build
npm run preview
```
