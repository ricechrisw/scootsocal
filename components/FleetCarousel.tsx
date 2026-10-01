"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SLIDES = [
  {
    slug: "light",
    name: "Light Duty",
    rate: 49,
    src: "/images/pride-gogo-light-duty.jpg",
    alt: "Pride Go-Go travel mobility scooter, light class.",
  },
  {
    slug: "standard",
    name: "Standard Duty",
    rate: 59,
    src: "/images/pride-victory-standard.jpg",
    alt: "Pride Victory 4-wheel mobility scooter, standard class.",
  },
  {
    slug: "heavy",
    name: "Heavy Duty",
    rate: 79,
    src: "/images/pride-maxima-hd.jpg",
    alt: "Pride Maxima 4-wheel mobility scooter, heavy-duty class.",
  },
];

export function FleetCarousel() {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 15000);
    return () => window.clearInterval(id);
  }, [index]);

  function go(i: number) {
    setIndex(i);
  }

  return (
    <>
      <div className="price-strip" aria-label="Published package prices">
        <div className="price-cols">
          {SLIDES.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              className={i === index ? "is-active" : undefined}
              aria-pressed={i === index}
              onClick={() => go(i)}
            >
              <span className="price-name">{s.name}</span>
              <span className="price-rate">
                Starting at <strong>${s.rate}</strong>/day
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="hero-photo hero-photo--product" role="region" aria-roledescription="carousel" aria-label="Scooter types">
        <div className="carousel" id="fleet-carousel">
          <div className="carousel-viewport">
            {SLIDES.map((s, i) => (
              <figure key={s.slug} className={i === index ? "carousel-slide is-active" : "carousel-slide"}>
                <img src={s.src} alt={s.alt} width={515} height={576} />
                <figcaption>{s.name}</figcaption>
              </figure>
            ))}
          </div>
          <button className="carousel-btn carousel-prev" type="button" aria-label="Previous scooter" onClick={() => go((index + 2) % 3)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="carousel-btn carousel-next" type="button" aria-label="Next scooter" onClick={() => go((index + 1) % 3)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="carousel-dots" role="tablist" aria-label="Choose a scooter">
            {SLIDES.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                className={i === index ? "is-active" : undefined}
                aria-label={s.name}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="hero-actions">
        <button className="btn btn-citrus" type="button" onClick={() => router.push(`/reserve?class=${SLIDES[index].slug}`)}>
          Reserve {SLIDES[index].name}
        </button>
      </div>
    </>
  );
}
