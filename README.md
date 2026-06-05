# Intelligence

Monthly business intelligence emails for small businesses.

## Stack

- Next.js 14 (App Router) + TypeScript, deployed on Vercel
- Supabase Postgres (data only — auth is custom)
- Resend (transactional + bulk email)
- iron-session for session cookies
- Vercel Cron for scheduled email dispatch
- Paystack (stubbed until paid plans go live)

## Local setup

1. Copy `.env.example` → `.env.local` and fill values.
2. Apply the migration in `supabase/migrations/0001_init.sql` to your Supabase project (SQL editor or `supabase db push`).
3. Generate `ADMIN_PASSWORD_HASH` with:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" 'YourAdminPassword'
   ```
4. Generate a `SESSION_SECRET` (>= 32 chars) and a `CRON_SECRET`.
5. `npm install && npm run dev`.

## Auth model

- **Users**: email + 4-digit PIN via Resend. PIN is bcrypt-hashed in `login_pins`, expires in 10 min, max 5 attempts. Session stored in `intel_user_session` cookie (`iron-session`).
- **Admin**: `/admin/login` checks `ADMIN_EMAIL` and bcrypt-compares against `ADMIN_PASSWORD_HASH` from Vercel env. Sets `intel_admin_session` cookie.

## Sending insights

1. Admin signs into `/admin/login`.
2. `/admin/insights` — pick a category, write subject + Markdown body, save draft.
3. Open the draft → either **Schedule** (datetime-local) or **Send now**.
4. `vercel.json` registers a cron at `*/15 * * * *` that hits `/api/cron/send-insights` (Bearer `CRON_SECRET`); the route dispatches any drafts whose `scheduled_for <= now()`.
5. Resend webhook → `/api/webhooks/resend` updates `email_deliveries.status`.

## Payments

Paystack is stubbed (`lib/paystack/`). The subscription page shows a disabled "Subscribe — coming soon" button. When ready to go live, implement the `PaystackClient` interface and wire the subscription page button to it.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing + free-trial signup |
| `/login` | Request PIN |
| `/login/verify` | Enter PIN |
| `/dashboard` | Trial status + nav |
| `/categories` | Choose subscribed categories |
| `/subscription` | Trial status + Paystack placeholder |
| `/admin/login` | Admin sign-in |
| `/admin/insights` | List + compose drafts |
| `/admin/insights/[id]` | Edit, schedule, send, preview, delivery stats |
| `/admin/users` | User list |
| `/admin/deliveries` | Delivery monitoring |
| `/api/cron/send-insights` | Vercel Cron entrypoint |
| `/api/webhooks/resend` | Resend delivery status webhook |
