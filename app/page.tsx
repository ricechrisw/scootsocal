import Link from "next/link";
import { FleetCarousel } from "@/components/FleetCarousel";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const classes = await prisma.scooterClass.findMany({
    where: { active: true },
    orderBy: { dailyRateCents: "asc" },
  });

  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Scoot SoCal",
            url: "https://scootsocal.com/",
            email: "info@scootsocal.com",
            description: "Pride mobility scooter rentals delivered to Anaheim Resort and Hollywood hotels.",
            areaServed: ["Anaheim", "Hollywood", "Universal City", "San Diego", "Palm Springs"],
            priceRange: "$$",
          }),
        }}
      />
      <section className="hero" id="top">
        <div className="wrap hero-grid">
          <h1>Mobility Scooters. Delivered to your SoCal Hotel.</h1>
          <FleetCarousel />
          <div className="hero-taglines">
            <p className="fine">Mobility scooters delivered right to your hotel.</p>
            <p className="lede">Show up. Scoot. We’ll handle the rest.</p>
          </div>
        </div>
      </section>

      <section className="trust" aria-label="How a rental works">
        <div className="wrap">
          <ul>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="11" width="15" height="6" rx="1.5" />
                <circle cx="8" cy="18" r="2" />
                <circle cx="16" cy="18" r="2" />
                <path d="M9 11V8h6l2 3" />
              </svg>
              <span>Pick a scooter</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 14h11l4-4h3v7H3z" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="17" cy="18" r="2" />
                <path d="M3 14V9h8" />
              </svg>
              <span>We Deliver</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="5" r="2.2" />
                <path d="M12 8v4M9 21l3-9 3 9" />
                <path d="M8 13h8" />
              </svg>
              <span>You Ride</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section" id="scooters">
        <div className="wrap">
          <h2>The Fleet</h2>
          <p className="section-intro">Three classes. Tell us the trip — we’ll match the ride.</p>
          <div className="fleet">
            {classes.map((c) => (
              <article className="card" key={c.id}>
                <img className="card-photo--product" src={c.photoPath} alt={c.name} width={515} height={576} />
                <div className="card-body">
                  <h3>{c.name}</h3>
                  <p className="rates">Starting at {money(c.dailyRateCents)} per day</p>
                  <p>{c.description}</p>
                  <Link className="btn btn-citrus card-reserve" href={`/reserve?class=${c.slug}`}>
                    Reserve now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <h2>How It Works</h2>
          <p className="section-intro how-lead">You Book. We Deliver. You Ride. We Pick Up.</p>
          <ol className="how-steps">
            <li>
              <h3>You Book</h3>
              <p>
                Choose your dates, scooter size, and tell us where you’re staying — hotel, Airbnb, home, or vacation
                rental anywhere in our Southern California Delivery Zone.
              </p>
            </li>
            <li>
              <h3>We Deliver</h3>
              <p>A clean, fully charged mobility scooter right to your door. Quick walkthrough on the controls and you’re set.</p>
            </li>
            <li>
              <h3>You Ride</h3>
              <p>Theme parks, beaches, conventions, or just a week of getting around. The scooter is yours for the whole rental period.</p>
            </li>
            <li>
              <h3>We Pick Up</h3>
              <p>When you’re done, we come back and collect it. You don’t haul anything.</p>
            </li>
          </ol>
          <p className="how-call">
            Questions? <Link href="/contact">Contact us</Link> or email{" "}
            <a href="mailto:info@scootsocal.com">info@scootsocal.com</a>.
          </p>
        </div>
      </section>

      <section className="section" id="areas">
        <div className="wrap">
          <h2>Where We Serve</h2>
          <div className="areas">
            <div className="map">
              <img
                src="/images/service-area-map.jpg"
                alt="Map of Southern California service area, including Los Angeles, Anaheim, and Palm Springs."
                width={1768}
                height={816}
              />
            </div>
            <p className="area-note">
              Same-Day delivery available to Disneyland Resort area, Universal Studios, Downtown LA hotels, Hollywood
              and Palm Springs Resorts
            </p>
            <Link className="btn btn-citrus card-reserve areas-reserve" href="/reserve">
              Reserve now
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="wrap">
          <h2>Book Your Ride</h2>
          <p className="section-intro">
            Pick a class, choose open dates, and pay online.
          </p>
          <p>
            <Link className="btn btn-citrus" href="/reserve">
              Reserve a scooter
            </Link>
          </p>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap faq">
          <h2>FAQ</h2>
          <details open>
            <summary>How far in advance should I book?</summary>
            <p>
              We recommend booking at least 24–48 hours in advance, especially during peak seasons (summer, holidays,
              and Disneyland busy periods). Same-day delivery is often available depending on location and inventory —
              just reach out and we’ll do our best to accommodate you.
            </p>
          </details>
          <details>
            <summary>Do you deliver to hotels and resorts?</summary>
            <p>
              Yes. We deliver directly to hotels, resorts, Airbnbs, and private residences throughout the L.A.,
              Hollywood, Anaheim, and Palm Springs areas. Just provide your address at checkout and we’ll coordinate a
              convenient delivery window.
            </p>
            <p>
              While we can deliver just about anywhere, please make sure you make the proper arrangements with the
              hotel, resort, or vacation rental you are staying at to ensure there are no delays or interruptions in
              your service during your stay.
            </p>
          </details>
          <details>
            <summary>Is delivery and pickup included in the price?</summary>
            <p>Yes — delivery and pickup are included in the daily rate within our standard service area. No hidden fees.</p>
          </details>
          <details>
            <summary>Is there a minimum rental?</summary>
            <p>
              Yes. Rentals are at least 24 hours. We deliver one day and pick up on a later day — not drop-off and
              pickup on the same day.
            </p>
          </details>
          <details>
            <summary>What is your cancelation policy?</summary>
            <p>
              Cancellations made 48 hours or more before your scheduled delivery receive a full refund. Cancellations
              within 48 hours are non-refundable. We’re happy to reschedule when possible.
            </p>
          </details>
          <details>
            <summary>What if the scooter stops working while I’m using it?</summary>
            <p>
              Contact us immediately. We’ll arrange a quick swap or repair at no extra charge. We keep backup units
              ready so your day isn’t interrupted.
            </p>
          </details>
          <p>
            <Link href="/faq">All FAQ</Link>
          </p>
        </div>
      </section>

      <section className="section" id="about">
        <div className="wrap about-block">
          <div>
            <h2>About</h2>
            <p>
              Scoot SoCal rents mobility scooters to visitors in the Southern California area. We deliver to your hotel
              or resort and pick up when you are done, keeping the process simple — dates, hotel, done.
            </p>
            <p>
              <Link className="btn btn-citrus" href="/reserve">
                Reserve now
              </Link>
            </p>
          </div>
          <figure>
            <img
              src="/images/scooter-riding.jpg"
              alt="A visitor riding a red four-wheel mobility scooter with family walking alongside."
              width={1672}
              height={941}
            />
          </figure>
        </div>
      </section>
    </main>
  );
}
