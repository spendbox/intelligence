# Intelligence

Monthly business intelligence emails for small businesses.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase Postgres (data only — auth is custom)
- Resend (email)
- iron-session for cookies
- Vercel Cron for scheduled email dispatch
- Paystack (stubbed until paid plans go live)

---

## 1. Create a Supabase project

1. Go to https://supabase.com → **New project**. Pick any name + region, set a database password (you won't need it for the app).
2. In the project, open **Settings → API**. Copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key (under "Project API keys") → this is `SUPABASE_SERVICE_ROLE_KEY`
   - The `anon` key is NOT used by this app.
3. Open **SQL Editor → New query**. Paste the contents of `supabase/migrations/0001_init.sql` and click **Run**. You should see the new tables under **Table Editor**.

> The `service_role` key bypasses Row Level Security. It must NEVER be exposed to the browser. This app only uses it from server actions / route handlers.

## 2. Create a Resend account

1. Go to https://resend.com → sign up.
2. **Domains → Add domain**, add the domain you want to send from (e.g. `yourdomain.com`). Add the DNS records Resend shows you (SPF/DKIM). Wait until it shows "Verified".
   - For local testing, you can skip this and use Resend's `onboarding@resend.dev` sender — emails will only deliver to the email address you signed up with.
3. **API Keys → Create API Key** (full access). Copy it → this is `RESEND_API_KEY`.
4. Set `RESEND_FROM_EMAIL` to something like `Intelligence <hello@yourdomain.com>` (or `onboarding@resend.dev` for testing).
5. (Optional, after deploy) **Webhooks → Add Endpoint** pointing at `https://YOUR-VERCEL-URL/api/webhooks/resend` so delivery statuses appear in the admin "Deliveries" page.

## 3. Set environment variables

Copy `.env.example` → `.env.local` for local dev (and set the same values in **Vercel → Project → Settings → Environment Variables** for production).

| Variable | What to set |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API (service_role) |
| `RESEND_API_KEY` | From Resend → API Keys |
| `RESEND_FROM_EMAIL` | e.g. `Intelligence <hello@yourdomain.com>` |
| `SESSION_SECRET` | Any random string, **at least 32 characters**. Generate with: `openssl rand -hex 32` |
| `ADMIN_EMAIL` | The email you'll use to sign into `/admin` |
| `ADMIN_PASSWORD` | The plain password you'll use to sign into `/admin` |
| `CRON_SECRET` | Any random string. Generate with: `openssl rand -hex 32` |
| `APP_URL` | `http://localhost:3000` for dev, your Vercel URL in prod |
| `TRIAL_DAYS` | Optional, defaults to `30` |

## 4. Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## 5. Deploy to Vercel

1. Push the repo to GitHub.
2. https://vercel.com → **Add New → Project** → import the repo. Framework auto-detects as Next.js.
3. **Before clicking Deploy**, expand **Environment Variables** and paste every variable from the table above for the **Production** environment.
4. Deploy. Once live, set `APP_URL` to your production URL and redeploy.
5. The cron in `vercel.json` will start running automatically every 15 minutes against `/api/cron/send-insights` (Vercel handles the bearer token automatically; locally you can curl with `Authorization: Bearer $CRON_SECRET`).

> If your first Vercel deploy failed, the most common cause is missing env vars — the app throws on first use of Supabase/Resend without them. Add the variables above and redeploy.

---

## Using it

### Users
- `/` — landing page with email input for free-trial signup.
- `/login` → `/login/verify` — passwordless email + 4-digit PIN.
- `/dashboard` — trial status overview.
- `/categories` — pick which insight categories to receive.
- `/subscription` — shows the trial status and a "Coming soon" Paystack button.

### Admin
- `/admin/login` — sign in with `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
- `/admin/insights` — compose new insight (pick category, write Markdown), see recent drafts.
- `/admin/insights/[id]` — edit, preview, **Schedule** or **Send now**, see per-draft delivery stats.
- `/admin/users` — see every signup with their plan + category count.
- `/admin/deliveries` — recent 200 deliveries with status (from Resend webhook).

### How emails go out
- Admin schedules a draft for a date/time.
- Vercel Cron hits `/api/cron/send-insights` **once a day at 09:00 UTC** (Hobby-tier compatible — Hobby only allows daily crons). The route finds drafts whose `scheduled_for <= now()`, builds the recipient list (all `trialing`/`active` users subscribed to that draft's category), sends each via Resend, and inserts an `email_deliveries` row per recipient.
- Resend's webhook posts back delivery events → `email_deliveries.status` updates.
- **Need sub-daily granularity?** Two options without upgrading: (a) use the **Send now** button in `/admin/insights/[id]` for ad-hoc dispatches, or (b) add an external scheduler (GitHub Actions, cron-job.org, EasyCron) that hits `GET https://YOUR-URL/api/cron/send-insights` with header `Authorization: Bearer $CRON_SECRET` on whatever schedule you want. A ready-to-use GitHub Actions workflow:
  ```yaml
  # .github/workflows/cron-insights.yml
  name: cron-insights
  on:
    schedule:
      - cron: "*/15 * * * *"
    workflow_dispatch:
  jobs:
    ping:
      runs-on: ubuntu-latest
      steps:
        - run: |
            curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/send-insights"
          env:
            CRON_SECRET: ${{ secrets.CRON_SECRET }}
            APP_URL: ${{ secrets.APP_URL }}
  ```
  Add `CRON_SECRET` and `APP_URL` as repo secrets in **GitHub → Settings → Secrets and variables → Actions**.

## Payments

Paystack is stubbed in `lib/paystack/index.ts`. When you're ready to enable paid plans, implement the `PaystackClient` interface and wire it up to the `/subscription` page button. The `users` table already has a `provider_customer_id` column ready for the customer reference.
