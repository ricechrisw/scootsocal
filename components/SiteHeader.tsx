import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link className="wordmark" href="/">
          <img src="/images/scoot-socal-logo.png" alt="Scoot SoCal" width={1536} height={1024} />
        </Link>
        <nav className="nav" aria-label="Primary">
          <a href="/#scooters">Scooters</a>
          <a href="/#how">How it works</a>
          <a href="/#areas">Areas</a>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="header-actions">
          <Link className="btn btn-citrus" href="/reserve">
            Reserve now
          </Link>
        </div>
      </div>
    </header>
  );
}
