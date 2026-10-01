---
name: Scoot SoCal
description: Pride mobility scooters delivered to Anaheim and Hollywood hotels.
colors:
  navy: "#0b1f3a"
  navy-ink: "#071526"
  citrus: "#e85d04"
  citrus-ink: "#9a3c02"
  sand: "#f6f1e8"
  paper: "#fffdf8"
  line: "rgba(11, 31, 58, 0.16)"
  white: "#fff"
typography:
  display:
    fontFamily: "Source Sans 3, Source Sans Pro, Segoe UI, sans-serif"
    fontSize: "clamp(2.05rem, 7vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Source Sans 3, Source Sans Pro, Segoe UI, sans-serif"
    fontSize: "clamp(1.7rem, 4vw, 2.4rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Source Sans 3, Source Sans Pro, Segoe UI, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Source Sans 3, Source Sans Pro, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Source Sans 3, Source Sans Pro, Segoe UI, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  price:
    fontFamily: "Source Sans 3, Source Sans Pro, Segoe UI, sans-serif"
    fontSize: "clamp(1.55rem, 6.5vw, 2.45rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.04em"
    fontFeature: "tabular-nums"
rounded:
  pill: "999px"
  lg: "18px"
  md: "16px"
  default: "14px"
  sm: "12px"
  input: "10px"
  full: "50%"
spacing:
  xs: "0.55rem"
  sm: "0.85rem"
  md: "1.25rem"
  lg: "1.75rem"
  section: "3.25rem"
  gutter: "2rem"
  header: "4.25rem"
  sticky-bar: "4.5rem"
components:
  button-citrus:
    backgroundColor: "{colors.citrus}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.15rem"
    height: "48px"
    typography: "{typography.label}"
  button-citrus-hover:
    backgroundColor: "{colors.citrus}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
  button-navy:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.sand}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.15rem"
    height: "48px"
    typography: "{typography.label}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.sand}"
    rounded: "{rounded.pill}"
    padding: "0.45rem 0.9rem"
    height: "42px"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: "{rounded.input}"
    padding: "0.7rem 0.75rem"
    height: "48px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.lg}"
    padding: "1.1rem 1.15rem 1.25rem"
  price-strip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.default}"
    padding: "0.85rem 0.3rem 0.95rem"
  header:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.sand}"
    height: "4.25rem"
    typography: "{typography.title}"
  form-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.lg}"
    padding: "1.2rem"
  faq:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.sm}"
    padding: "0.85rem 1rem"
  mobile-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    padding: "0.55rem 0.6rem"
    height: "4.5rem"
---

# Design System: Scoot SoCal

## Overview

**Creative North Star: "The Hotel-Curb Operator"**

Scoot SoCal looks like a local mobility-rental shop that already knows the Anaheim and Hollywood hotel corridors — category-standard, played straight. Navy chrome, warm sand page, photoreal four-wheel Pride-style scooters at a hotel curb. Type is large, prices are tabular, and the two actions are always Call and Request dates. Friendly and no-nonsense; not cutesy, not hospital-clinical, not a VC mobility startup.

The page is sand. Surfaces that hold offers (price strip, fleet cards, form, FAQ, tables) lift to warm paper with a navy hairline. Citrus is the signal for money and action, not a wash. Imagery is photoreal four-wheel travel scooters; captions may admit a placeholder, but the silhouette is never a kick scooter.

This world refuses motel-neon, valet-ticket chrome, and a photo-only hero that hides the packages. Direction reserved citrus for Call/Request; the shipped CSS also spends it on the SoCal wordmark, the price-strip border, class titles, analog labels, links, focus, and map pins. The build wins: citrus is the action-and-price accent, not a CTA-only swatch.

**Key Characteristics:**
- Sticky navy header; sand canvas; paper cards
- Source Sans 3 at 400 / 600 / 700 / 800 — one family
- Pill CTAs: Request dates always citrus; Call navy on sand, ghost on navy
- Citrus-bordered three-class price strip
- Photoreal 4-wheel Pride-style scooters, never kick scooters
- Soft navy-tinted lift, never hard offset shadows

## Colors

Navy field, sand ground, citrus signal. High contrast is the point.

### Primary
- **Deep Ocean Navy** (#0b1f3a): Identity, body text, sticky header, navy pills, step indices, table headers, trust band, footer, and success panel. The operator’s chrome.
- **Night Harbor** (#071526): Darker well behind the hero photograph and the service-area map field.

### Secondary
- **SoCal Citrus** (#e85d04): Request dates pills, price-strip border, class names in the strip, wordmark “SoCal”, focus rings, caret, selection, trust-stroke (where present), and free-delivery map pins. The action-and-price accent.
- **Burnt Citrus** (#9a3c02): Default links, fleet analog lines (“Pride Go-Go class”), and emphasized table class names. Readable citrus on paper.

### Neutral
- **Warm Sand** (#f6f1e8): Page background and header/footer type on navy.
- **Warm Paper** (#fffdf8): Price strip, cards, steps, table, form, FAQ, area cards, mobile bar.
- **Navy Hairline** (rgba(11, 31, 58, 0.16)): Default borders and row rules.
- **Flash White** (#fff): Citrus pill labels, selection text, and field fills.

### Named Rules
**The Citrus Signal Rule.** Citrus marks action and money — pills, the price-strip border, class titles, the SoCal wordmark, focus, and links. It is never a page wash and never a neon glow.

**The Contrast Field Rule.** Text is navy on sand or paper, sand on navy. Citrus pills use white labels, not navy.

## Typography

**Display Font:** Source Sans 3 (with Source Sans Pro, Segoe UI, sans-serif)
**Body Font:** Source Sans 3 (same stack)
**Label/Mono Font:** none — labels are the same family at 700

**Character:** One humanist sans, tight tracking on display, heavy weights for offers. Direct, local, large enough for a phone in a hotel lobby. No second family, no system display face.

### Hierarchy
- **Display** (800, clamp(2.05rem, 7vw, 3.6rem), 1.05, −0.035em): Page H1 only. Max width 18ch.
- **Headline** (800, clamp(1.7rem, 4vw, 2.4rem), −0.03em): Section H2.
- **Title** (800, 1.35rem, −0.03em): Wordmark and card titles. Wordmark is “Scoot” in navy or sand with “SoCal” in citrus.
- **Price** (800, clamp(1.55rem, 6.5vw, 2.45rem) in the strip / 1.35rem stacked, tabular-nums): Package dollars. Tracking −0.04em.
- **Body** (400, 1.125rem, 1.45): Page copy. Lede ~1.05rem / 42ch; section intros 52ch.
- **Label** (700, 0.95rem, −0.02em): Buttons, form labels, analog class lines, nav (600 / 0.92rem). Captions 0.82rem.

### Named Rules
**The One Voice Rule.** Source Sans 3 at 400, 600, 700, and 800 only. Do not add a display serif, a mono, or a system headline face.

**The Tabular Money Rule.** Package prices, rate lines, and the rates table use `tabular-nums`. Dollars never use a second typeface to look “premium.”

## Layout

Centered wrap `min(1120px, calc(100% - 2rem))`. Below 500px the wrap gutter tightens to 1.25rem. Body type sits on sand with `padding-bottom` equal to the mobile action bar (4.5rem) until the desktop breakpoint. Sections pad 3.25rem vertically. Hero is tighter (1.75rem / 2.5rem).

Breakpoints the CSS actually uses: **499px** (price strip) and **800px** (chrome, grids, mobile bar).

From **500px up** (including 720px and the approved price-forward comp) the package strip is three equal columns. **Below 500px** it stacks to three readable rows: class name in a 7.2rem column, rates on the right, hairline between rows, mid-dot separators (` · `) between day / 3-day / week. Heavy-duty must not clip.

From **800px**: header nav and header pills appear; the bottom action bar hides; hero becomes a two-column grid (copy stack | photo); trust is four columns; steps two; fleet three; areas two plus a full-bleed map; form rows two; about splits image and copy. Below 800px those grids stack, the rates table drops its header and prefixes each cell (“1 day ”, “3 days ”, “7 days ”, “Extra day ”), and the footer adds room above the sticky bar.

### Named Rules
**The Unclipped Strip Rule.** Below 500px the three classes stack as readable rows. From 500px up they are three columns. Never let Heavy-duty become an unread sliver.

## Elevation & Depth

Hybrid: tonal layering (sand → paper → navy) plus a small navy-tinted shadow vocabulary. Shadows are ambient, not structural, and never hard-offset.

### Shadow Vocabulary
- **Offer lift** (`box-shadow: 0 10px 28px rgba(11, 31, 58, 0.12)`): Price strip, hero figure, form panel.
- **Card lift** (`box-shadow: 0 8px 20px rgba(11, 31, 58, 0.06)`): Fleet cards.
- **Bar lift** (`box-shadow: 0 -8px 24px rgba(11, 31, 58, 0.12)`): Mobile action bar, upward.

### Named Rules
**The Soft Navy Shadow Rule.** Shadows are navy-tinted blurs. No black hard offsets, no neon glows, no hover-lift translates.

## Shapes

Pills for actions (999px). Offer surfaces sit between 14px and 18px: price strip 14px; cards, form, and hero photo 18px; tables, area cards, map, and success 16px; FAQ 12px; fields 10px. Step indices are circles. Fields and default cards use a 1px–1.5px navy hairline; the price strip is the exception — a 2px citrus border. Photographs clip to the surface radius at 4 / 3 (hero, fleet) or 16 / 10 (about).

### Named Rules
**The Pill Action Rule.** Buttons are capsules. Cards are rounded rectangles. Do not square off CTAs or stadium-round the cards.

## Components

### Buttons
Thumb-sized capsules. Weight 700, tracking −0.02em, no border on filled variants, `min-height` 48px (42px in the header).

- **Shape:** Pill (999px), padding 0.7rem 1.15rem (header 0.45rem 0.9rem)
- **Primary (Request dates / submit):** Citrus fill, white label. Hover: `filter: brightness(1.05)`, label stays white.
- **Call on sand:** Navy fill, sand label.
- **Call on navy:** Ghost — transparent, sand label, 1.5px sand border at 45% opacity; hover snaps border and label to white.
- **Focus:** 3px citrus outline, 3px offset, every interactive.
- **Pairing:** Request dates is always citrus. Call is navy on sand and ghost on the header. On the mobile bar, Call is navy and Request is citrus, equal width.

### Cards / Containers
- **Corner Style:** 18px fleet and form; 16px areas / table / success; 14px steps and price strip
- **Background:** Warm paper
- **Shadow Strategy:** Card lift on fleet; offer lift on form and price strip; steps are hairline-only
- **Border:** 1px navy hairline, except the price strip (2px citrus)
- **Internal Padding:** ~1.1–1.2rem. Fleet analog line is burnt citrus 700, then body, then an 800 weight rate line.

### Inputs / Fields
- **Style:** White fill, 10px corners, 1.5px hairline, navy text, citrus caret, `min-height` 48px. Labels are 700 / 0.95rem stacked above the control — never placeholder-only.
- **Focus:** Page-level 3px citrus ring (no extra inner glow).
- **Error / Disabled:** Native `required` / `reportValidity` only; no custom error chrome in the build.

### Navigation
Sticky navy header, min-height 4.25rem. Wordmark 800 / 1.35rem, “SoCal” in citrus. Below 800px: wordmark only; Call and Request live in the bottom paper bar. From 800px: 600 / 0.92rem in-page links (hover citrus), then ghost Call + citrus Request. Skip link is navy/sand and appears on focus.

### Price strip (signature)
Paper panel, 2px citrus border, 14px radius, offer-lift shadow. Three classes — Light, Standard, Heavy-duty — with citrus 800 titles and tabular package prices (day / 3-day / week). Columnar from 500px; three rows below 500px as in Layout. This is the offer object, not a toolbar.

### Steps
Numbered paper tiles, hairline, 14px radius, navy circular index with sand numerals.

### Table
Paper, 16px clip, navy header with sand labels. Body class names in burnt citrus. Below 800px, stacked labeled cells — do not shrink type to keep five columns.

### FAQ
Paper rows, 12px radius, hairline, 800-weight summaries. One item may ship open; the rest are closed.

### Mobile action bar
Fixed paper bar, hairline top, upward shadow, two pills. Present below 800px; hidden from 800px up. Body and footer pad so content is not trapped behind it.

## Do's and Don'ts

### Do:
- **Do** keep Request dates (and form submit) on citrus pills and Call as the paired navy or ghost pill.
- **Do** set the wordmark as Scoot + citrus SoCal, never a lockup in one color.
- **Do** show photoreal four-wheel Pride-style mobility scooters at hotel/park scale.
- **Do** stack the price strip to three readable rows below 500px; keep three columns from 500px up.
- **Do** use tabular-nums on every published rate.
- **Do** draw focus as a 3px citrus ring with 3px offset.
- **Do** keep form labels visible and controls at least 48px tall.

### Don't:
- **Don't** wash a screen in citrus or treat citrus as motel neon.
- **Don't** introduce a second type family or a system display face.
- **Don't** use hard-offset drop shadows or hover-lift motion.
- **Don't** depict kick scooters, Lime/Bird language, or startup micromobility chrome.
- **Don't** square the pills or stadium-round the cards.
- **Don't** clip Heavy-duty in the price strip to preserve a three-column look on a narrow phone.
- **Don't** replace visible labels with placeholder-only fields.
