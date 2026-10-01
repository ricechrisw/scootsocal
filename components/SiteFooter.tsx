import Link from "next/link";
import { EMAIL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <>
      <footer className="site-footer">
        <div className="wrap">
          <p>
            <strong>Scoot SoCal</strong> · scootsocal.com · <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
          <p>Anaheim Resorts Area · Hollywood/LA Area · San Diego · Palm Springs Area</p>
          <p>
            <Link href="/terms">Rental terms</Link> · <Link href="/faq">FAQ</Link> ·{" "}
            <Link href="/booking/lookup">Look up a booking</Link> · <Link href="/admin/login">Staff</Link>
          </p>
        </div>
      </footer>
      <div className="mobile-bar" aria-label="Quick actions">
        <Link className="btn btn-citrus" href="/reserve">
          Reserve now
        </Link>
      </div>
    </>
  );
}
