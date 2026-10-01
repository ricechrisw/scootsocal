import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scoot SoCal | Pride Mobility Scooter Rentals — Anaheim & Hollywood",
  description:
    "Rent Pride mobility scooters delivered to Anaheim Resort and Hollywood hotels. Light, standard, and heavy-duty.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Scoot SoCal | Pride Mobility Scooter Rentals — Anaheim & Hollywood",
    description:
      "Rent Pride mobility scooters delivered to Anaheim Resort and Hollywood hotels. Light, standard, and heavy-duty.",
    url: "https://scootsocal.com/",
    images: ["/images/og.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://scootsocal.com/" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/images/apple-touch.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
