# LedgerXtR form migration: Make/Supabase → n8n + Google Sheets + Microsoft

This guide replaces the previous Make webhook → Supabase → Microsoft Outlook flow with a **free** stack:

1. Website form posts to an **n8n webhook**
2. n8n appends a row to **Google Sheets**
3. n8n sends a notification via **Microsoft Outlook**

The site code expects one env var:

```bash
VITE_N8N_WEBHOOK_URL="https://YOUR-N8N-HOST/webhook/ledgerxtr-contact"
```

---

## Cost note (important)

| Piece | Cost |
| --- | --- |
| Google Sheets | Free |
| Microsoft Outlook / Microsoft 365 email | Free with your existing Microsoft account |
| n8n software | Free (Community Edition) |
| n8n hosting | Free only if you self-host on a free tier or your own machine/VPS |

n8n Cloud is **not** free long-term. For $0 ongoing cost, self-host Community Edition (Docker) on a free-tier host or a machine that stays online.

Recommended free self-host options:

1. **Railway / Render / Fly.io free tier** (may sleep when idle — first form submit after sleep can be slow)
2. **Oracle Cloud Always Free** VM + Docker (most reliable free option)
3. A home/always-on mini PC with Docker + a free tunnel (Cloudflare Tunnel)

---

## Step-by-step (you need to do these)

### 1) Create the Google Sheet

1. Open [Google Sheets](https://sheets.google.com) and create a spreadsheet named **LedgerXtR Leads**.
2. Rename the first tab to **Leads**.
3. Paste the header row from `n8n/google-sheet-headers.csv` into row 1.
4. Copy the Sheet ID from the URL:
   - `https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit`

### 2) Install / start free n8n (self-hosted)

**Option A — Docker (recommended):**

```bash
docker volume create n8n_data

docker run -d --name n8n \
  -p 5678:5678 \
  -e N8N_HOST=YOUR_PUBLIC_HOSTNAME \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=https \
  -e WEBHOOK_URL=https://YOUR_PUBLIC_HOSTNAME/ \
  -e N8N_CORS_ALLOW_ORIGIN="https://ledgerxtr.com,https://www.ledgerxtr.com,http://localhost:5173" \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Open the n8n editor (usually `https://YOUR_PUBLIC_HOSTNAME` or `http://localhost:5678`).

### 3) Import the workflow

1. In n8n: **Workflows → Import from File**
2. Import `n8n/ledgerxtr-contact-form.workflow.json`
3. Open the **Append to Google Sheets** node and:
   - Connect your Google account (OAuth)
   - Replace `REPLACE_WITH_GOOGLE_SHEET_ID` with your Sheet ID
   - Confirm sheet/tab name is **Leads**
4. Open the **Send Outlook Email** node and:
   - Connect your Microsoft Outlook / Microsoft 365 account
   - Confirm recipient is `info@ledgerxtr.com` (or your preferred inbox)
5. Open the **Webhook** node and confirm:
   - Method: `POST`
   - Path: `ledgerxtr-contact`
   - Respond: **Immediately**
   - Allowed Origins includes `https://ledgerxtr.com` and localhost for testing
6. Click **Save**, then **Activate** the workflow.
7. Copy the **Production** webhook URL (looks like `https://…/webhook/ledgerxtr-contact`).

### 4) Point the website at the webhook

1. In this repo, create/update `.env` (never commit it):

```bash
VITE_N8N_WEBHOOK_URL="https://YOUR-N8N-HOST/webhook/ledgerxtr-contact"
```

2. Rebuild and redeploy:

```bash
npm run build
npm run deploy
```

Local test:

```bash
npm run dev
```

Submit the contact form, then confirm:

- a new row appears in Google Sheets
- an Outlook email arrives
- n8n shows a successful execution

### 5) Retire Make + Supabase

1. Turn off / delete the old Make scenario.
2. Optionally archive the Supabase `ledgerxtr_call_requests` table after exporting historical leads into the new Sheet.
3. Remove unused Supabase project keys from any password managers / dashboards.

---

## Payload contract (what the site sends)

The form posts JSON (as `text/plain` body) with:

- `full_name`, `email`, `organization_type`
- `business_name`, `industry`, `years_in_business`
- `accounting_software`, `books_status`, `start_timeline`, `transaction_volume`
- `services_needed` (array) + `services_needed_text` (comma-separated)
- `additional_notes`, `preferred_next_step`, `message`
- `source` (`ledgerxtr.com`), `status` (`new`), `submitted_at` (ISO timestamp)

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Browser CORS error | Self-host n8n and set Allowed Origins / `N8N_CORS_ALLOW_ORIGIN`. Prefer Production webhook URL. |
| Form says “not configured” | `VITE_N8N_WEBHOOK_URL` missing at build time — set `.env`, rebuild, redeploy. |
| Sheet row missing | Check Google credential + Sheet ID + tab name **Leads**. |
| No email | Reconnect Outlook credential; confirm mailbox can send mail. |
| 404 on webhook | Workflow inactive, wrong path, or using Test URL after editor closed. |

---

## Files in this repo

- `n8n/ledgerxtr-contact-form.workflow.json` — importable n8n workflow
- `n8n/google-sheet-headers.csv` — Sheet column headers
- `src/lib/submitContactForm.ts` — payload + webhook client used by the site
