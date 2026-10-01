# Scoot SoCal — Grok Build Brief

**Product:** scootsocal.com  
**Business:** Scoot SoCal — Pride mobility scooter rentals delivered to Southern California hotels, resorts, Airbnbs, and residences  
**Phone / SMS:** 951-902-9375  
**Current state:** Marketing landing page only. “Reserve now” anchors to `#contact`. No real booking, inventory, payments, or admin.  
**Goal:** Ship a production-ready rental platform: customer books a scooter class on a calendar, pays through Stripe, and an admin can manage reservations, customers, and payments.

Use this brief as the source of truth. Prefer shipping a complete, boring, reliable system over extra features.

---

## 1. What to build

A two-sided web app on the existing brand:

1. **Public site** — keep the current marketing story (fleet, how it works, service area, FAQ, about) and add a real checkout flow.
2. **Booking engine** — choose scooter class → pick dates → enter delivery details → pay with Stripe → get a confirmation.
3. **Admin console** — authenticated staff view of reservations, customers, calendar/inventory, payment status, and the ability to create / edit / cancel / reschedule bookings.

The site must work on mobile first. Theme-park visitors will book from a phone.

---

## 2. Brand and copy to preserve

Keep the existing voice. Do not turn this into a generic SaaS rental template.

- Name: **Scoot SoCal**
- Headline: Mobility Scooters. Delivered to your SoCal Hotel.
- Sub: Show up. Scoot. We’ll handle the rest.
- Fleet framing: Three classes. Tell us the trip — we’ll match the ride.
- Flow: You Book. We Deliver. You Ride. We Pick Up.
- Service areas called out on the site: Disneyland Resort / Anaheim, Universal / Hollywood, Downtown LA hotels, Palm Springs resorts. Delivery also allowed to Airbnbs and private residences in those zones.
- Contact always visible: call or text **951-902-9375**
- FAQ answers already on the live site stay as written unless a flow change requires a small edit (especially cancelation: full refund if canceled 48+ hours before scheduled delivery; within 48 hours non-refundable; reschedule when possible).

Visual direction: clean, high-contrast, travel / resort feel. Large type, obvious prices, obvious “Reserve” button. Do not hide booking behind a contact form.

---

## 3. Fleet and pricing (v1)

Treat classes as bookable SKUs. Exact Pride model assigned at fulfillment can differ; the customer books a **class**.

| Class | Starting daily rate | Intended use | Default weight cap (editable in admin) |
|---|---|---|---|
| Light Duty | $49 / day | Compact / travel, theme parks, hotels | 300 lb |
| Standard Duty | $59 / day | Everyday comfort and range | 350 lb |
| Heavy Duty | $79 / day | Higher capacity, longer days | 400–500 lb |

**Pricing rules for v1**

- Charge **per calendar day** of the rental window, inclusive of delivery day and pickup day.
- Delivery and pickup are included in the daily rate inside the standard service area. No separate delivery SKU in v1.
- No multi-day discount table yet. Use flat daily rate × nights/days. Expose rates as admin-editable so they can change without a deploy.
- California sales tax: calculate and collect. Default tax rate should be an admin setting (start with a single statewide/configurable rate; do not hardcode 0).
- Optional refundable damage hold via Stripe is **out of scope for v1** unless it is cheap to add as a separate authorized hold. Do not block launch on it.
- Promo codes are out of scope for v1.

**Inventory model**

Admin sets how many units exist per class (e.g. Light 4, Standard 6, Heavy 2). A date is bookable for a class only if `units_in_class − overlapping_confirmed_rentals > 0` for every day in the requested range. Pending unpaid checkouts expire and release hold after 15 minutes.

Same-day delivery is allowed if inventory exists and the request is before an admin-configurable cutoff (default 11:00 AM America/Los_Angeles). After cutoff, first available delivery is next day.

---

## 4. Customer booking flow

Single linear flow. Do not require a customer account in v1.

### Step 1 — Choose class
From the fleet cards or a `/reserve` page. Show daily price, short description, and remaining availability for the currently selected dates (or “Select dates to see availability”).

### Step 2 — Dates
Calendar UI:

- Select delivery date and pickup date.
- Block dates that are fully booked for that class.
- Minimum rental: 24 hours (pickup cannot be the same calendar day as delivery).
- Maximum rental: 30 days.
- Timezone: America/Los_Angeles.
- After dates are chosen, show line items: class, number of days, daily rate, subtotal, tax, total.

### Step 3 — Delivery details
Required:

- First name, last name
- Email
- Mobile phone
- Delivery address (street, city, state, ZIP)
- Stay Type: hotel / resort / Airbnb / home / other
- Property / hotel name (optional but encouraged)
- Guest name on reservation if different
- Delivery window preference: morning / afternoon / flexible
- Pickup window preference: morning / afternoon / flexible
- Rider weight (number) so staff can sanity-check class
- Special notes (gate code, front desk, mobility constraints)

Validate phone and email. Soft-warn if ZIP is clearly outside SoCal; do not hard-block — staff will confirm. Show the existing note: guest must arrange hotel / property acceptance of delivery.

### Step 4 — Review + rental terms
Checkbox required: agree to rental terms (cancelation policy, damage responsibility, theme-park rules are the rider’s, scooter stays with the booked guest, must be reachable by phone).

### Step 5 — Pay with Stripe
Create a reservation in status `pending_payment` and start Stripe Checkout (or Payment Element + PaymentIntent). Collect card payment for the full rental total (subtotal + tax).

On successful webhook `checkout.session.completed` / `payment_intent.succeeded`:

- Mark reservation `confirmed`
- Persist Stripe payment id, amount, currency, receipt URL, last4, brand
- Decrement / lock inventory for those dates
- Email and SMS-ready confirmation to the customer (email required in v1; SMS can be a logged “send later” stub if no SMS provider is configured)
- Email admin/notify address

On failure, expire, or user abandon: release inventory hold. Do not leave ghost bookings.

### Step 6 — Confirmation page
Show reservation code, class, dates, address, total paid, “we will text/call to confirm the delivery window,” and the phone number. This page must work after Stripe redirect.

Customer can later look up a booking with reservation code + email (no full account required).

---

## 5. Admin console

Protected route `/admin`. Email + password login for staff. At least one seed admin created from env vars. Simple role is fine in v1: any logged-in admin can do everything below.

### Dashboard
Today and upcoming deliveries / pickups. Counts: confirmed, pending payment, canceled. Inventory remaining this week by class.

### Reservations
Table + calendar views.

Each reservation shows:

- Reservation code
- Status: `pending_payment` | `confirmed` | `out_for_delivery` | `out` | `returned` | `canceled` | `refunded`
- Class booked
- Unit assigned (optional free-text or unit id)
- Delivery date / pickup date and windows
- Customer name, email, phone
- Full delivery address + notes
- Rider weight
- Money: subtotal, tax, total, Stripe payment status, Stripe ids, receipt link
- Internal notes
- Created / updated timestamps

Admin actions:

- Create a booking manually (walk-in / phone order), then send a Stripe payment link **or** mark as paid offline
- Change dates, class, address, windows, notes
- Reassign class only if inventory allows
- Change status along the ops path: confirmed → out_for_delivery → out → returned
- Cancel
- Issue a Stripe refund (full or partial) on a paid reservation; write the refund id and amount back onto the reservation
- Reschedule: treat as inventory check + date update; honor the public 48-hour cancelation policy as a default, but allow admin override with a reason note

Never delete payment history. Canceled paid bookings stay in the list.

### Customers
Auto-created from bookings. One customer record per email. Show contact info and all of that person’s reservations.

### Fleet / inventory settings
- Units available per class
- Daily rate per class
- Tax rate
- Same-day cutoff
- Service-area blurb
- Notify email for new bookings

### Payments view
Filterable list of Stripe-backed charges: reservation code, customer, amount, status, date, Stripe dashboard link. This can be a view over reservation payment fields; a full Stripe accounting suite is not required.

---

## 6. Payments — Stripe

Insert Stripe as the only payment processor.

**Required env / secrets (never commit):**

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Success and cancel URLs on the real domain

**Implementation rules**

- Server creates the Checkout Session or PaymentIntent. The browser never sees the secret key.
- Amounts are calculated server-side from stored rates. Do not trust client-submitted totals.
- Use webhooks as the source of truth for “paid,” not only the success redirect.
- Idempotent webhook handler.
- Store `stripe_customer_id`, `stripe_checkout_session_id` / `payment_intent_id`, `charge_id`, amount received, currency `usd`.
- Test mode first. Document the exact webhook events to enable.
- Receipts: use Stripe’s receipt plus the in-app confirmation page.

Placeholder in code where the API keys go: `.env.example` with empty values and a short README section “How to add Stripe.”

---

## 7. Data model (minimum)

```
Customer        id, name, email, phone, created_at
ScooterClass    id, slug (light|standard|heavy), name, daily_rate_cents, unit_count, weight_cap, description, active
Reservation     id, code, customer_id, class_id, unit_label,
                start_date, end_date, status,
                address fields, place_type, windows, rider_weight, notes,
                subtotal_cents, tax_cents, total_cents,
                stripe_* payment fields, refund_cents,
                admin_notes, created_at, updated_at
AdminUser       id, email, password_hash
InventoryHold   reservation_id, class_id, date, expires_at
AppSetting      key, value
```

Reservation `code` should be short and human (e.g. `SSC-A7K2`).

---

## 8. Email / notifications (v1)

On confirmed payment and on admin cancel / reschedule:

- Customer email: reservation code, dates, class, address, total, phone
- Admin email: same plus link to `/admin/reservations/:id`

If transactional email is not configured, log the payload and show a clear setup note. Do not fake “email sent.”

---

## 9. Pages

**Public**

- `/` — existing landing content, working Reserve CTAs
- `/fleet` or in-page fleet — class details
- `/reserve` — booking wizard
- `/reserve/confirmation?code=` — post-pay
- `/booking/lookup` — code + email
- `/faq`, `/terms` — cancelation, liability, delivery expectations
- `/contact` — phone/text plus a simple message form that emails admin (not a substitute for booking)

**Admin**

- `/admin/login`
- `/admin` dashboard
- `/admin/reservations`
- `/admin/reservations/:id`
- `/admin/calendar`
- `/admin/customers`
- `/admin/payments`
- `/admin/settings`

SEO: title “Scoot SoCal | Pride Mobility Scooter Rentals — Anaheim & Hollywood”. Fast LCP. Schema LocalBusiness if easy.

---

## 10. Technical preferences for Grok Build

Choose a stack you can actually deploy:

- Next.js (App Router) + TypeScript
- Postgres (or SQLite only if a real hosted Postgres is not available; prefer Postgres)
- Prisma or Drizzle
- Stripe official SDK
- Auth for admin only (Auth.js / hardcoded credentials hashed with bcrypt is acceptable for a single-operator v1)
- America/Los_Angeles everywhere dates are shown or compared

Host-agnostic: Vercel / Fly / Railway-style is fine. Provide:

- `.env.example`
- `README.md` with local run, Stripe webhook forwarding (`stripe listen`), seed command, and deploy notes
- Seed: 3 classes at the prices above, 1 admin, a handful of sample reservations in test mode

Accessibility: keyboard-usable calendar, labeled inputs, visible focus, sufficient contrast.

Security: CSRF on mutations, rate-limit checkout creation, parameterized queries, no PII in client logs, never log raw card data.

---

## 11. Out of scope for this build

- Customer accounts / social login
- Native apps
- Live GPS of scooters
- Driver routing / dispatch map
- Multi-location warehouses
- Promo codes, gift cards, subscriptions
- Wheelchairs, strollers, or add-on accessories
- SMS provider integration (design the fields; wire later)
- Multi-staff permissions beyond a single admin role
- Custom domain DNS work (app should run on whatever host; existing domain is scootsocal.com)

---

## 12. Acceptance criteria

The build is done when all of the following are true:

1. A visitor can pick Light / Standard / Heavy, choose open dates, enter delivery info, and pay with Stripe test cards.
2. After pay, a confirmation page and a `confirmed` reservation exist with customer info and Stripe payment ids.
3. Double-booking a class on the same dates is impossible once a payment is confirmed (and while a fresh checkout hold is active).
4. Admin can log in, see that reservation, change dates or status, add notes, and refund via Stripe in test mode.
5. Abandoned checkouts do not permanently eat inventory.
6. Landing-page marketing content still matches Scoot SoCal, including phone number and published rates.
7. `.env.example` documents every Stripe and database key. No secrets in git.
8. README lets another person run the app locally and complete one test booking.

---

## 13. Open items (do not block)

Use these defaults if the operator has not answered yet:

- Exact unit counts: Light 3, Standard 4, Heavy 2
- Tax rate: 7.75% until settings are changed
- Notify email: use `ADMIN_EMAIL` env
- Damage waiver text: short standard rental language on `/terms`
- Assigned Pride model names on the public site: keep class names only; staff can note “Victory / Maxima / Go-Go” internally

When those are confirmed, they are settings changes, not a rebuild.
