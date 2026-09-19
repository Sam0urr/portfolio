# Design brief — as judged and implemented (Phase 1)

Date: 2026-09-19. Synthesised by a judge from three independent proposals; scores below.

# Final design brief — "The Edition"

Winner: P1, with two grafts from P3 that sharpen rather than muddy it: Source Serif 4 as the body face (Newsreader stays display-only) and the mono as the whole UI voice (IBM Plex Sans dropped, one family fewer).

**Point of view.** samlamrabte.com is set like a serious weekly: warm paper, one serif voice for what Sam says, one monospace voice for what the site says (dates, numbers, labels, nav), hairlines instead of cards, one oxblood accent used like a printer's second ink. The reader remembers a front page: masthead under a double rule, a headline that owns the grid, a portrait plate in the margin, a numbered ledger of writing. Motion only says where you are.

## 1. Typefaces

| Role | Family | Weights / styles | Fallbacks |
|---|---|---|---|
| Display: wordmark, headings, ledes, quotes | Newsreader (variable, opsz 6–72) | 400–500 roman, 400 italic | "Iowan Old Style", Palatino, Georgia, serif |
| Body: all prose | Source Serif 4 (variable, opsz 8–60) | 400–600 roman (600 = `<strong>`), 400 italic | Charter, "Iowan Old Style", Georgia, serif |
| UI/meta: nav, kickers, dates, bylines, chips, captions, tables, code, footer | IBM Plex Mono | 400, 500 (labels, active states) | "SF Mono", Menlo, Consolas, monospace |

No sans-serif anywhere (set the About journey-arc SVG labels in the mono). Three families, five files, subsets latin + latin-ext.

**Loading: Astro Fonts API, Google provider** (verified against installed astro 7.3.3 / unifont 0.7.5; confirm in the docs). `astro.config.mjs`: `import { fontProviders } from 'astro/config'`; `fonts: [...]` with one entry per family (a second Source Serif 4 entry for the italic shares its `cssVariable`), each `{ provider: fontProviders.google(), cssVariable, weights: ['400 500'] | ['400 600'] | [400, 500], styles, subsets, fallbacks, optimizedFallbacks: true }`; the serifs add `options: { experimental: { variableAxis: { opsz: [['6', '72']] } } }` (Source Serif `[['8', '60']]`) so the opsz axis is served. `Base.astro`: `<Font cssVariable="--font-display" preload={[{ subset: 'latin', style: 'normal' }]} />`, same for `--font-body`; mono unpreloaded. `html`: `font-optical-sizing: auto; font-synthesis: none`. Features: serifs `"kern", "liga", "onum"`; mono `"lnum", "tnum"`. Fallback: one `<link>` to fonts.googleapis.com with the same axes, `display=swap`.

## 2. Colour tokens

Tailwind v4 `@theme`; reset `--color-*`, `--shadow-*`, `--radius-*` to `initial`.

| Token | Light `:root` | Dark |
|---|---|---|
| paper | #F7F3EC | #14120F |
| ink | #1C1915 | #ECE5D8 |
| muted | #5F584E | #A59C8E |
| line | #D8D0C2 | #2F2A23 |
| accent | #8F2B1C | #E2846C |
| accent-soft | #F2E0D8 | #3A2119 |
| surface | #EFE9DF | #1C1915 |

Dark applies on `:root[data-theme="dark"]` and on `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`; an inline pre-paint script stamps `data-theme` from localStorage, else system.

Contrast (WCAG, computed): ink/paper **15.83** light / **14.93** dark · muted/paper **6.34** / **6.90** · accent/paper 7.50 / 6.90 · ink/surface 14.50 / 13.98 · muted/surface 5.81 / 6.46 · accent/surface 6.87 / 6.46 · accent on accent-soft 6.49 / 5.49 · paper on accent (active chip) 7.50 / 6.90 · line/paper 1.38 / 1.31 (decorative only). All text pairs clear AA; primary pairs AAA.

Usage: paper is the page; surface only for the focused search field, code blocks and the Forthcoming box-out; accent-soft only for `::selection` and `<mark>`; accent for link underlines, hover, active chip fill, current-nav underline, focus ring (2px, offset 3px), section numerals and the progress rule, never a filled button. Dark is a night edition: never #000/#fff; content photos get `filter: brightness(.92)`, the hero plate does not.

## 3. Type scale, measure, rhythm

Base 16px. Sizes (rem): xs .75 · sm .875 · base `clamp(1.0625rem, 1rem + .25vw, 1.125rem)` (prose) · md 1.1875 (lede) · lg `clamp(1.375rem, 1.2rem + .8vw, 1.75rem)` (h3, row titles) · xl `clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem)` (h2, page h1) · 2xl `clamp(2.25rem, 1.6rem + 3vw, 3.5rem)` (note h1, −.015em) · 3xl `clamp(2.75rem, 1.6rem + 4.5vw, 5.5rem)` (home headline, −.015em). Leading: 3xl 1.05 · 2xl 1.1 · xl 1.2 · lg 1.3 · lede 1.5 · body 1.6 · mono 1.5. Mono labels uppercase, tracking .12em at xs, .08em at sm; running mono (dates, bylines) not uppercase.

Measures: prose 36rem (≈66ch) · wide 48rem (ledes, CV, rows) · hero headline 18ch · frame 72rem · gutter `clamp(1rem, 4vw, 3rem)`. Spacing (rem): .25 · .5 · .75 · 1 · 1.5 · 2 · 3 · 4 · 6 · 8. Section gap 6rem (4rem under 768px); hero to first section 8rem.

Prose: `text-wrap: pretty`, `hyphens: auto`, never justified; paragraph gap 1.25em on pages. Essays: print paragraphing, no gap, 1.2em first-line indent after a paragraph. h2: hairline above, 3rem margin-top, `§ n` mono numeral. Blockquote: Newsreader italic at md, 1px accent left rule. Rules: hairline `1px solid line`; strong `2px solid ink`; double = strong over hairline, 3px apart. Radius 0 except chips (2px). No shadows.

## 4. Page concepts

**Masthead, every page.** Double rule, then a band: wordmark "Sam Lamrabte" (Newsreader 500, md) left; the six items in mono sm uppercase right, current page underlined 1px accent offset 6px; theme toggle is the word "Night"/"Day" in mono muted. Sticky only on note pages, where its lower hairline becomes the progress rule. Under 768px the menu row scrolls horizontally behind a right-edge fade mask. No hamburger, no overlay.

**Footer.** Double rule; three mono xs columns (one under 640px): colophon line; the six routes; LinkedIn · Email · RSS · CV (PDF). Last line: "Set in Newsreader, Source Serif and IBM Plex Mono · © 2026 · Built with Astro".

**Home.** Mono dateline row between hairlines: "Political economy · Amsterdam" left, "Updated {build date}" right. Hero on 12 columns: 1–8 carry the kicker "Sam Lamrabte · Political economist & analyst" and the headline at 3xl, Newsreader 400, "regulation, technology, and markets" in italic, max 18ch; 9–12 carry `profile.jpg` as a plate (4:5, 1px line frame, `object-fit: cover`) pulled up 2rem to overlap the dateline rule, the site's one grid break, and parallaxed. Below: the existing intro at the prose measure, first paragraph as a Newsreader italic lede, then a mono "→ Read the CV". Then "§ 01 · Recent writing" as a mono section head over a hairline, four ledger rows (mono date | Newsreader title at lg | muted summary | mono xs uppercase tags), "All notes →". Stacks under 1024px.

**Notes index.** "Notes" at xl with a mono count "06 entries", hairline under. `NotesExplorer` island (`client:visible`, list server-rendered first): search is a bare input, bottom hairline only, body face at md, mono placeholder "Search notes…", surface fill and accent hairline on focus; chips are mono xs uppercase, hairline border, 2px radius, multi-select, active = accent fill with paper text; results reuse the ledger rows, hits in `<mark>`. Empty state: one Newsreader italic line, "Nothing matches that yet." Then "§ 02 · Forthcoming" from `upcoming.json`: rows on surface, 1.5rem padding, muted titles, status word in mono accent, teaser at sm, no links.

**Note article.** Header at the wide measure: mono kicker of tags (accent, dot-separated), title at 2xl Newsreader 400, italic lede, byline between hairlines "By Sam Lamrabte · 14 May 2026 · Updated 15 May · 9 min read" in mono sm. Body at the prose measure inside a margin/prose/margin grid so `§ n` numerals hang left and side figures float right at ≥1200px (in flow below). Links: ink, 1px accent underline offset .16em, accent on hover. Ends with a double rule and prev/next: two cells split by a vertical hairline, mono "← Previous"/"Next →" over Newsreader titles at lg.

**Prose pages** share `Page.astro` (kicker, h1 at xl, optional lede, prose). About: `about.jpg` as a floated plate (36%, max 280px, 4:5) at ≥768px, in flow below. CV: wide measure; numbered h2s sticky at `top: 0` on paper; entries as hairline rows; dates in mono tabular figures; "↓ CV (PDF, 180 KB)" as a mono download row between hairlines, not a button. Contact: the email address is the largest element (xl, Newsreader, underlined), LinkedIn beneath. References and Publications: hairline rows, issuer or venue in muted italic, mono "↓ PDF"; publications as hanging-indent entries numbered in mono.

**Project (Venserpolder).** Article header plus a mono fact row between hairlines (Location · Year · Role · Method as a `dl`; four columns, two under 768px). Text at the prose measure; figure grids break out to the 72rem frame on 12 columns, gap 1rem: one full-width lead, then 8/4 and 4/4/4 rows via `<Figure span>`; every image 1px line frame, no radius, explicit width/height, `loading="lazy"` after the first; mono sm captions auto-numbered "Fig. 3 — …" by CSS counter. One column under 768px. No lightbox (Phase 2).

## 5. Motion vocabulary

One easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Lenis (`lerp: 0.1`, `smoothWheel: true`, `syncTouch: false`, `anchors: true`) driven by GSAP's ticker; both loaded by dynamic `import()` in `scripts/motion.ts` only when `prefers-reduced-motion` is not `reduce`.

| What | Behaviour | Timing |
|---|---|---|
| Masthead double rule | draws in, `scaleX 0→1` from the left, on first paint | 700 ms |
| Home hero: kicker → headline → plate → lede | `opacity 0→1`, `y 12→0`; hidden state set by JS after fonts ready | 600 ms, stagger 70 ms |
| `[data-reveal]`, `[data-reveal-group]` children | once at `top 88%`: `opacity 0→1`, `y 10→0`; sibling stagger 60 ms, cap 6 | 500 ms |
| Hero plate `[data-parallax]` | `y −24px → +24px` across its scroll span | scrub 0.6, ease none |
| Reading progress `[data-reading-progress]` | `scaleX` from a rAF scroll listener over `[data-reading-target]` | no easing; every mode |
| Links, nav, chips | colour, underline, fill only | 150 ms |
| Theme toggle | `background-color, color` on `html`, enabled after first paint | 200 ms |
| CV and note h2s | CSS `position: sticky` only | — |

Reduced motion: Lenis and GSAP never imported; nothing is `opacity: 0` in shipped CSS (JS hides only what it will reveal, and reveals everything on error or bfcache restore); the rule does not draw; progress still tracks.

## 6. Do not

1. No cards, boxes, shadows, gradients, blur, grain or glass; rows and hairlines separate things.
2. No accent fill larger than a chip; no second hue; no #000/#fff; no cool greys.
3. No sans-serif; no serif in UI; no mono above sm; no display face below lg except the wordmark.
4. No icons or emoji: arrows `→ ← ↓ ↗` and words only; no hamburger or overlay menu; no sticky masthead outside note pages.
5. No justified text; no prose wider than 36rem; no body leading under 1.6; no radius above 2px, none on images.
6. No hover lifts, scales, image zooms, cursor effects, counters or text splitting; no motion that gates content; no motion JavaScript for reduced-motion visitors.
7. No mixed date formats: prose "14 May 2026", mono metadata `2026-05-14`.

## 7. Signature details

1. The masthead double rule draws itself on load; on note pages its lower hairline fills with oxblood as you read: the progress bar is the rule.
2. `§ 01` mono numerals hang in the left margin beside essay h2s at ≥1024px.
3. Print paragraphing in essays: no gaps, first-line indents, old-style figures in text, tabular lining figures in mono.
4. The portrait is a framed plate that breaks the dateline rule by 2rem and drifts ±24px on scroll.
5. The theme toggle is a word, "Night" or "Day"; the home dateline carries the build date, so the front page is always dated.

Repo note: `/Users/samilamrabte/portfolio/astro.config.mjs` already carries this Fonts API config, `src/styles/global.css` these tokens and most components, and `src/scripts/motion.ts` the data attributes above. Extend them; do not restart.

---

## Judge scores

| Criterion | P1 The Edition | P2 Quiet portfolio | P3 Research Atlas |
|---|---|---|---|
| (a) Editorial/restrained fit, analyst voice | **9** — front-page metaphor, numbered sections and mono figures read as "serious weekly written by an analyst"; nothing decorative | **6** — calm, but the photo-led Framer register (12px radii, photo shadow, `<details>` hero, "Menu" overlay) reads designer portfolio, not editorial | **8** — "working notebook indexed like a dataset" nails the analyst; cool grey + signal blue drifts toward dashboard |
| (b) Distinctiveness | **8** — double-rule masthead, margin plates, numbered ledger, mono numerals; still inside the serif-on-cream genre it admits to | **5** — the most common designer-template register; the serif body is the only thing keeping it off-template | **8** — mono running header, ledger tables, ISO dates, no sans; adjacent to the dev-blog look |
| (c) Typography for 2,000-word essays | **8** — 17–18px/1.6 at ~66ch, old-style figures, italic-only emphasis; but Newsreader as body is lighter and lower-x-height than a text face, and `<strong>` at 500 is barely visible | **7** — Newsreader 19/1.65 at 66ch is comfortable; the scale table contradicts itself about the body face and a third family is loaded for UI only | **9** — Source Serif 4 (built for screen reading) under Newsreader display is the best long-form pairing offered; mono-only UI is the weak spot |
| (d) Accessibility (recomputed) | **8** — verified: ink/paper 15.71 L / 14.94 D, muted/paper 6.24 / 6.99, accent/soft 5.33 / 5.89; 11px mono kickers are the one small-text risk | **7** — verified: 16.12 / 15.20, 6.20 / 7.23; but "Coming soon" rows at 70% opacity drop muted to ≈3.5:1, and the JS-only Menu overlay has no no-JS path | **8** — verified: 15.73 / 15.17, 5.71 / 7.48 (light muted/surface 5.30 is the thinnest pass of any proposal); 14px tracked-uppercase mono nav is a cognitive cost |
| (e) Performance | **8** — 3 families / 5 files, one portrait, no shadows or filters, GSAP behind a dynamic import | **7** — 3 variable files but a 900px hero at 40% width (LCP), a second full-measure photo, and a large soft shadow to paint | **7** — 3 families / 6 files (two serif italics), ScrollTrigger marker on every article page |
| (f) One-pass implementability | **7** — many bespoke layouts (two-column CV, three-column article grid with margin floats, drop cap + fallback, counters) but every value is specified and it is all plain CSS | **7** — fewer layouts, but internal contradictions (rows vs "cards" with 8px radius; body face) must be resolved by the implementer; clip-path menu | **6** — sticky left-rail marker driven by ScrollTrigger, auto TOC with active state, live-count search and multi-select chips add JS coupling; the ≥1100px rail layout is fiddly |
| **Total** | **48** | **39** | **46** |

All 24 claimed text-contrast pairs were recomputed with the WCAG relative-luminance formula and match the proposals to two decimals.
