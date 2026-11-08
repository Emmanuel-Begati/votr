# Votr: paid voting for comedians

Fans open a comedian's link, choose how many votes to buy, and pay with Paystack (card, transfer or USSD). Votes are counted **only** after Paystack confirms the payment.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind v4 · Prisma · Paystack · deploy on Vercel.

> **Database:** local development currently uses **SQLite** (`prisma/dev.db`). Before deploying, switch to Supabase Postgres: set `provider = "postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL` to the Supabase URL, then run `npx prisma db push`.

## How payments are counted

1. `POST /api/votes/initiate`: the server prices the votes (`votes × pricePerVote`), stores a `PENDING` transaction and returns the Paystack checkout URL.
2. The fan pays on Paystack and is sent back to `/vote/callback?reference=…`.
3. `POST /api/paystack/webhook` checks the HMAC signature, then calls `applyVerifiedPayment()` (`src/lib/votes.ts`). That function re-verifies with Paystack, checks the amount and currency, checks the contest is still open, and credits votes **exactly once** using a conditional `PENDING → SUCCESS` update.
4. The callback page, the cron job (`/api/cron/reconcile`) and the admin "Re-verify" button all use the same function. Duplicate calls are harmless.
5. Payments that arrive after a contest closes, or with the wrong amount, are marked `FLAGGED` for manual refund and not counted.

## Local setup

1. Get Paystack **test** keys from Dashboard → Settings → API Keys & Webhooks.
2. Fill in `.env` (copy `.env.example`): `DATABASE_URL` (`file:./dev.db` for SQLite), `PAYSTACK_SECRET_KEY`, `SESSION_SECRET` (long random string), `CRON_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Run:
   ```bash
   npm install
   npm run db:push        # create tables
   npm run db:seed:demo   # admin account + demo contest (use db:seed for admin only)
   npm run dev
   ```
4. Open http://localhost:3000. The admin area is at `/admin`.

### Testing payments locally

- Paystack test card: `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.
- Without a webhook, votes are still credited when Paystack redirects back to `/vote/callback`.
- To test the webhook, expose your dev server (`npx cloudflared tunnel --url http://localhost:3000` or ngrok). Then set the webhook URL in Paystack to `https://<tunnel>/api/paystack/webhook`.

## Deploying (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add the env vars. Set `APP_URL` to your real domain and use your **live** Paystack secret key once your business is verified.
3. In Paystack, set the webhook URL to `https://yourdomain.com/api/paystack/webhook`.
4. Run `npx prisma db push` against the production DB once, then `npm run db:seed`.
5. `vercel.json` runs the reconcile cron daily (the Hobby plan limit). On Pro, change it to `*/15 * * * *`.

## Admin features

- Create contests: price per vote, min/max votes per payment, open/close times (Lagos time), and whether live results are shown.
- Add comedians. Each gets a shareable link `/c/<contest>/<comedian>` with an auto-generated social preview image.
- Dashboard with revenue and vote totals, a transactions list with search and filter, CSV export, "Re-verify" for stuck payments, and "Recount votes" to rebuild totals from successful payments.

## Not done yet / next steps

- Photo **upload** (for now you paste an image URL; Cloudinary or Supabase Storage can be added).
- The rate limiter is in-memory per server instance. Use Upstash Redis for strict limits on Vercel.
- Email receipts (Paystack already emails the payer a receipt).
