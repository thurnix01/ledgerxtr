# LedgerXtR

Modern, single-page informational website for **LedgerXtR** (bookkeeping and financial support for growing businesses).

## Tech

- React + Vite + TypeScript
- Contact form → n8n webhook → Google Sheets + Microsoft Outlook
- Deployable to GitHub Pages (custom domain: `ledgerxtr.com`)

## Run locally

```bash
npm install
npm run dev
```

## Build / lint / test

```bash
npm run lint
npm run test:form
npm run build
```

## Contact form (n8n + Google Sheets + Microsoft)

Form submissions are posted to an n8n webhook. n8n appends the lead to Google Sheets and emails you via Microsoft Outlook.

Create a `.env` file (do not commit it):

```bash
VITE_N8N_WEBHOOK_URL="https://YOUR-N8N-HOST/webhook/ledgerxtr-contact"
```

Full setup (free self-hosted n8n, Sheet headers, Outlook, retiring Make/Supabase):

→ [`docs/N8N_MIGRATION_SETUP.md`](docs/N8N_MIGRATION_SETUP.md)

Importable workflow: `n8n/ledgerxtr-contact-form.workflow.json`

## Deploy to GitHub Pages

This repo includes `public/CNAME` for the custom domain `ledgerxtr.com`.

```bash
npm run deploy
```

`VITE_N8N_WEBHOOK_URL` is baked in at build time — set `.env` before deploying.
