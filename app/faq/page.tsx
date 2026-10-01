import Link from "next/link";
import { EMAIL } from "@/lib/constants";

export default function FaqPage() {
  return (
    <main id="main" className="section">
      <div className="wrap faq">
        <h1>FAQ</h1>
        <details open>
          <summary>How far in advance should I book?</summary>
          <p>
            We recommend booking at least 24–48 hours in advance, especially during peak seasons (summer, holidays, and
            Disneyland busy periods). Same-day delivery is often available depending on location and inventory — just
            reach out and we’ll do our best to accommodate you.
          </p>
        </details>
        <details>
          <summary>Do you deliver to hotels and resorts?</summary>
          <p>
            Yes. We deliver directly to hotels, resorts, Airbnbs, and private residences throughout the L.A., Hollywood,
            Anaheim, and Palm Springs areas. Just provide your address at checkout and we’ll coordinate a convenient
            delivery window.
          </p>
          <p>
            While we can deliver just about anywhere, please make sure you make the proper arrangements with the hotel,
            resort, or vacation rental you are staying at to ensure there are no delays or interruptions in your service
            during your stay.
          </p>
        </details>
        <details>
          <summary>Is delivery and pickup included in the price?</summary>
          <p>Yes — delivery and pickup are included in the daily rate within our standard service area. No hidden fees.</p>
        </details>
        <details>
          <summary>Is there a minimum rental?</summary>
          <p>
            Yes. Rentals are at least 24 hours. We deliver one day and pick up on a later day — not drop-off and pickup
            on the same day.
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
            Contact us immediately. We’ll arrange a quick swap or repair at no extra charge. We keep backup units ready
            so your day isn’t interrupted.
          </p>
        </details>
        <p>
          Still stuck? <Link href="/contact">Contact us</Link> or email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
      </div>
    </main>
  );
}
