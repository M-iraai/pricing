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

The two API routes (`/api/fees`, `/api/wilayas`) are Vite middlewares defined in
`vite.config.js`, so they work in `npm run dev` and `npm run preview`.

## Build

```bash
npm run build
npm run preview
```
