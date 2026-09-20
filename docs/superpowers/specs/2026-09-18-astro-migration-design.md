# Hugo → Astro migration — design

Date: 2026-09-18
Status: approved (Phase 1 scope)

## Goal

Move samlamrabte.com from Hugo + PaperMod to Astro with islands architecture, so interactive pieces (scroll motion, filterable lists, data viz, galleries) can be added where needed while the rest of the site ships as zero-JS static HTML. Same content, same public URLs, fresh design.

## Decisions taken

| Decision | Choice |
|---|---|
| Look | Fresh design, editorial and restrained; PaperMod and `custom.css` are not ported |
| Islands framework | React + Tailwind v4 |
| Motion | Lenis smooth scroll + GSAP ScrollTrigger in a vanilla `motion.ts`; Framer Motion only inside React islands if needed |
| Repo strategy | Same repo (`Sam0urr/portfolio`), branch `astro`, Hugo files removed on that branch; merge to `main` = go live |
| Hosting | GitHub Pages via Actions, custom domain `samlamrabte.com` (CNAME in `public/`) |
| `analysis/` section | Dropped — two template-sample posts, not in the menu |
| `Show*` / `Toc*` / `canonical:` frontmatter | Dropped — Astro derives canonical from `site`; the old values pointed at the stale `sam0urr.github.io/portfolio/` address |

## Phasing

- **Phase 1 (this spec):** Astro foundation, all content migrated with identical URLs, design system, scroll-driven motion, Notes search + tag filter as a React island (parity with today's client-side search), deploy to Pages. The Venserpolder project page renders its images statically.
- **Phase 2:** gallery/lightbox island for the Venserpolder page; Projects filter once there is more than one project.
- **Phase 3:** data-viz components for posts (React + a chart library, loaded only on pages that use them).

## Source inventory (Hugo, `main`)

- Config: `hugo.toml` — title "Sam Lamrabte", menu About / Projects / Notes / References / CV / Contact, social LinkedIn + email, home hero title + long intro paragraph with an inline `<img class="home-photo">`.
- Content: `_index.md`, `about.md`, `projects.md`, `cv.md`, `contact.md`, `references.md`, `publications.md`, `amsterdam-climate-adaptation.md` (frontmatter `url: /projects/amsterdam-climate-adaptation/`, body is raw HTML image grids), `notes/` (6 posts; one has `aliases: ["/notes/brexit-lobbying-transparency/"]`), `analysis/` (dropped).
- Shortcodes used in content: `{{< img src alt class >}}` (about, cv, projects, references), `{{< dl href label >}}` (cv, references).
- Custom layouts: `layouts/notes/list.html` (search box, filtered list, hard-coded "Coming soon" section with three entries), `layouts/partials/extend_footer.html` (reveal-on-scroll, note-page body class, reading-progress bar, nav overflow hint), `layouts/partials/extend_head.html` (Microsoft Clarity tag `y81eujutav`).
- Static: `profile.jpg`, `about.jpg`, `favicon.svg`, `cv.pdf`, `reference-1.pdf`, `reference-2.pdf`, `un-certificate-appreciation.pdf`, `notes/*.{png,jpg}`, `projects/venserpolder/*.jpg` (~5 MB total).
- Deploy: `.github/workflows/hugo.yml`.

## Target architecture

```
astro.config.mjs           site: https://samlamrabte.com, integrations, redirects
src/
  content.config.ts        zod schemas for notes, projects, pages
  content/
    notes/<slug>.md         frontmatter: title, date, updated?, summary, tags[], draft?
    projects/<slug>.mdx     frontmatter: title, summary, images? ; body uses <Img>/<Figure>
    pages/<slug>.mdx        about, cv, contact, references, publications
    upcoming.json           the "Coming soon" list (status, title, teaser)
  layouts/
    Base.astro              html shell, head, Nav, Footer, theme, motion init, Clarity
    Page.astro              prose page
    Note.astro              article: byline, tags, reading progress, prev/next
    Project.astro           project case study
  components/
    Nav.astro Footer.astro Hero.astro NoteCard.astro Prose.astro ThemeToggle.astro
    Img.astro Download.astro          replaces the two Hugo shortcodes
    islands/NotesExplorer.tsx         search + tag filter; client:visible
  pages/
    index.astro  about.astro  cv.astro  contact.astro  references.astro  publications.astro
    projects/index.astro  projects/[slug].astro
    notes/index.astro  notes/[slug].astro
    rss.xml.ts
  scripts/motion.ts        Lenis + GSAP ScrollTrigger: reveal, parallax hero, sticky headers
  styles/global.css        Tailwind v4 import + design tokens (light/dark)
public/
  CNAME favicon.svg robots.txt cv.pdf reference-*.pdf un-certificate-appreciation.pdf
  images/ (profile, about, notes/, projects/venserpolder/)
.github/workflows/deploy.yml   withastro/action → actions/deploy-pages
```

Integrations: `@astrojs/react`, `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`, Tailwind v4 via `@tailwindcss/vite`.

## URL contract (must hold after migration)

```
/                      /about/          /projects/       /projects/amsterdam-climate-adaptation/
/notes/                /notes/<slug>/ ×6                 /notes/brexit-lobbying-transparency/ → redirect
/references/           /cv/             /contact/        /publications/
/rss.xml               /sitemap-index.xml                /robots.txt
/cv.pdf  /reference-1.pdf  /reference-2.pdf  /un-certificate-appreciation.pdf
```

Image paths may change (they move under `/images/`) as long as every `<img>` in the built site resolves.

## Design direction

Editorial and restrained. Large serif display type, generous whitespace, a strong home hero with the photo, content-first article pages with a reading-progress bar. Motion is felt rather than seen: smooth scroll, staggered reveals, a subtle parallax hero, sticky section headers on long pages. All motion is gated behind `prefers-reduced-motion`. Light and dark themes with a toggle; theme colours defined once as tokens. Concrete typefaces and palette are decided during implementation with the frontend-design skill.

## Verification (gate to merge)

1. `astro check` and `astro build` succeed with no errors.
2. URL-parity script: every path in the live site's sitemap (and the contract above) exists in `dist/`; every `<img src>` and internal `<a href>` in `dist/` resolves.
3. Lighthouse ≥ 95 (performance, accessibility, best practices, SEO) on `/` and one note page.
4. Manual browser pass: desktop and 400 px, light and dark, reduced-motion on; nav, theme toggle, Notes search/filter, PDF downloads, RSS.
5. Deploy workflow green on the `astro` branch before merging to `main`.

## Out of scope for Phase 1

Gallery/lightbox, Projects filter, data-viz components, new content, redesign of the CV PDF, analytics changes beyond carrying the Clarity tag over.
