# Scoot SoCal

Production rental app for [scootsocal.com](https://scootsocal.com): marketing homepage, calendar booking, Stripe Checkout, and a staff admin.

Phone: **951-902-9375**

## Stack

Next.js App Router, TypeScript, Prisma, SQLite locally (swap `DATABASE_URL` to Postgres in production), Stripe official SDK.

Local SQLite is so `npm run setup` works without Docker. For production Postgres:

1. Create a Postgres database.
2. Set `DATABASE_URL` to `postgresql://user:pass@host:5432/scootsocal?sslmode=require`
3. In `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`
4. Run `npx prisma migrate dev --name postgres` (or `db push`) and `npm run db:seed`

## Setup

```bash
cp .env.example .env
# edit .env — at minimum AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## How to add Stripe

1. Create a [Stripe account](https://dashboard.stripe.com/register) and stay in **test mode**.
2. Copy the test secret and publishable keys from [API keys](https://dashboard.stripe.com/test/apikeys) into `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. Forward webhooks (required — webhooks are the source of truth for “paid”):

```bash
npm install -g stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Paste the `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET`.

Enable these events if you create an endpoint in the Dashboard instead of `stripe listen`:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`

`APP_URL` must match the origin you use in the browser (`http://localhost:3000` locally).

## Complete one test booking

1. `npm run setup && npm run dev`
2. In another terminal: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Visit `/reserve`, pick Light Duty, choose two open dates, fill delivery details, agree to terms.
4. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
5. You should land on `/reserve/confirmation` with a code like `SSC-A7K2`.
6. Log in at `/admin` and open that reservation. Stripe PaymentIntent / receipt fields should be filled after the webhook.

Abandoned checkouts release inventory after **15 minutes**. Stripe Checkout sessions must expire at least **30 minutes** out (Stripe’s minimum); if someone pays after the hold dropped, the webhook auto-refunds when the class is no longer free.

## Seed

`npm run db:seed` creates:

- Light / Standard / Heavy classes ($49 / $59 / $79 per calendar day)
- Unit counts: Light 3, Standard 4, Heavy 2
- Admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Sample reservations (`SSC-DEMO`, `SSC-STD1`, `SSC-CXL1`)

Pricing is **days × daily rate + tax**. Tax default is 7.75% (admin setting). Inclusive of delivery and pickup days. America/Los_Angeles.

## Deploy

Set the same env vars on Vercel / Fly / Railway. Point `APP_URL` at the public HTTPS origin. Create a live-mode Stripe webhook to `https://YOUR_DOMAIN/api/webhooks/stripe`. Use a hosted Postgres `DATABASE_URL` in production.
