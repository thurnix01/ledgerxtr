# LedgerXtR

Modern, single-page informational website for **LedgerXtR** (bookkeeping and financial support for growing businesses).

## Tech

- React + Vite + TypeScript
- No backend (booking form logs to console for now)
- Deployable to GitHub Pages (with custom domain support)

## Run locally

```bash
npm install
npm run dev
```

## Build / lint

```bash
npm run lint
npm run build
```

## Book a Call

- **Microsoft Bookings button**: update `BOOKING_URL` in `src/App.tsx`
- **Fallback form**: validates required fields, prevents refresh, shows inline errors + success, and sends submissions to a Make webhook (see below)

### Make webhook (email delivery)

Create a `.env` file (do not commit it) and set:

```bash
VITE_MAKE_WEBHOOK_URL="REPLACE_WITH_YOUR_MAKE_CUSTOM_WEBHOOK_URL"
```

You can copy `.env.example` as a starting point.

## Deploy to GitHub Pages

This repo includes `public/CNAME` for the custom domain `ledgerxtr.com`.

```bash
npm run deploy
```
