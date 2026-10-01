# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: static HTML/CSS/JS. Owner asked Grok Build to pick; a single-page marketing site with no checkout, no inventory, and a mailto-fallback lead form does not need a framework. Brand, phone, email, and prices live in one JS config object.

## Users

Primary: families booking a Pride mobility scooter for a parent at Disneyland (Anaheim Resort hotels) or Universal / Hollywood hotels. They want park days without the park's limited ECV line.

Secondary: travelers staying in Hollywood hotels who need a medical / travel mobility scooter for sightseeing.

Stretch: San Diego and Palm Springs / Coachella Valley hotel guests. Delivery is quoted, not free, and is not advertised as statewide.

## Product Purpose

Scoot SoCal rents Pride mobility scooters and delivers them charged to hotel lobbies in Southern California visitor corridors. Success is a phone call or a dated rental request — not a self-serve checkout.

## Positioning

Pride fleet, hotel-lobby delivery, free in the Anaheim Resort and Hollywood / Universal hotel corridor, with published light / standard / heavy-duty package prices that include that core-zone delivery. Private-pay rental only. Not Lime/Bird kick scooters. Not a Medicare billing site. Not a shop-pickup operation.

## Operating Context

Visitor is usually on a phone, often booking for someone else, comparing local Anaheim rental shops. Handoff is at the hotel lobby with charger and a short walkthrough. Pickup is at checkout. Deposit and ID at delivery. Quote is locked when booked. Stretch zones require a delivery quote before confirm.

## Capabilities and Constraints

Ships in v1:

- Single-page marketing site for scootsocal.com
- Sticky header + mobile sticky call/request bar
- Lead form (name, phone, email, hotel, city, dates, class, optional rider weight range, notes)
- Front-end submit + mailto fallback to info@scootsocal.com + success UI
- Tap-to-call 951-902-9375 everywhere
- English only

Must not ship:

- Checkout, payments, inventory calendar, accounts
- Medicare checker
- Kick-scooter aesthetic
- Invented reviews, licenses, or years in business
- Pickup-at-shop flow
- Fake live map API
- Statewide coverage claims
- Exact model SKUs, top speeds, or range numbers beyond typical class language
- Slang about body size (use “heavy-duty / higher weight capacity”)

Published rates (tax extra; refundable deposit at delivery):

| Class | Typical Pride analog | Capacity (typical) | 1 day | 3 days | 7 days | Extra day after 7 |
|---|---|---|---|---|---|---|
| Light | Go-Go / Go-Go Sport / folding travel | up to ~300–325 lb | $49 | $129 | $179 | $22 |
| Standard | Victory 9/10 or Revo 2.0 | up to ~400 lb | $59 | $149 | $209 | $26 |
| Heavy-duty | Maxima / similar HD | up to ~450–500 lb | $79 | $189 | $249 | $32 |

Delivery: free in Anaheim Resort and Hollywood / Universal corridor. San Diego and Palm Springs quoted before booking.

## Brand Commitments

- Name: Scoot SoCal
- Domain: scootsocal.com
- Phone: 951-902-9375
- Email: info@scootsocal.com
- Tagline: Pride scooters. Delivered to your hotel.
- Alt headline: Stay on the trip. We’ll bring the scooter.
- Tone: direct, local, no-nonsense. Family SoCal operator. Friendly, not cutesy, not hospital-clinical, not VC-startup.
- Colors (owner-pinned): deep ocean navy `#0B1F3A`, warm sand `#F6F1E8`, citrus accent `#E85D04`. High contrast. Large type.
- Wordmark: “Scoot” in bold navy + “SoCal” in the citrus accent.
- Favicon: simple side-view 4-wheel travel mobility-scooter silhouette, not a kick scooter.
- SEO title: Scoot SoCal | Pride Mobility Scooter Rentals — Anaheim & Hollywood
- Meta: Rent Pride mobility scooters delivered to Anaheim Resort and Hollywood hotels. Light, standard, and heavy-duty. Call 951-902-9375.
- Visual preference (owner-locked, 2026-09-10): category-standard mobility-rental landing, played straight. Craft bar: A Scooter 4 U (Anaheim) and Scootaround. No motel-neon or valet-ticket world.

## Evidence on Hand

- Owner brief: `scooter-rental-grok-build-brief.md` (pricing research, locked answers, full page copy).
- No real scooter photos yet. v1 uses generated photoreal placeholders, labeled as such, to be swapped later.
- No reviews, licenses, years in business, or customer quotes to publish. Do not invent them.

## Product Principles

- The headline price is the real price in core zones: delivery is included, not a surprise.
- Call is first-class, equal to the form. A real person answers 951-902-9375.
- Say Pride, say hotel delivery, say three classes, in five seconds.
- Never look like a kick-scooter startup or a Medicare mill.
- Match the rider to a class; do not oversell SKUs or invented specs.

## Accessibility & Inclusion

High contrast, visible labels, thumb-sized CTAs, tap-to-call. No autoplay video. Copy never uses slang about body size. Rider weight is optional and framed as class matching.
