# samlamrabte.com

The personal site of Sam Lamrabte, political economist and analyst in Amsterdam: an introduction, a CV, project case studies and a running set of notes on EU digital and sustainability regulation, AI governance and political economy.

Built with [Astro 7](https://astro.build). Every page ships as static HTML; the only JavaScript that hydrates is the Notes search and tag filter (a React island) and the scroll motion, which stays off for visitors who prefer reduced motion. Deployed to GitHub Pages from `main` by `.github/workflows/deploy.yml`.

## Run and build

Node 22.12 or newer.

```sh
npm install
npx astro dev --background   # http://localhost:4321 — stop with: npx astro dev stop
npx astro check              # type-checks .astro, .ts and .tsx
npx astro build              # writes the site to dist/
npm run check:site           # after a build: URL contract, live-sitemap parity, internal links, placeholders (SKIP_LIVE=1 when offline)
npx astro preview            # serves dist/ locally
```

## Add a note

Create `src/content/notes/<slug>.md`. The filename is the URL: `/notes/<slug>/`.

```md
---
title: "The title"
date: 2026-05-14          # YYYY-MM-DD
updated: 2026-05-15       # optional
summary: "One or two sentences; shown in lists, as the standfirst, and in the RSS feed."
tags: ["Political Economy", "Governance"]
keywords: ["optional", "search terms"]
draft: false              # optional; true hides the note from every list, the feed and the build
---

Body in Markdown. Use `## Headings` for sections — they are numbered "§ n" automatically.
```

Notes appear newest first on `/notes/` and the four most recent on the home page. Reading time is computed from the body. Prev / next links follow the date order.

To add a project, create `src/content/projects/<slug>.mdx` with `title`, `summary` and an optional `year`; MDX can import `Img` and `Download` (see below). To change a static page, edit the matching file in `src/content/pages/`. The "Coming soon" list on the Notes index lives in `src/content/upcoming.json`.

## Where things live

```
src/
  content/
    notes/<slug>.md          notes (Markdown)
    projects/<slug>.mdx      case studies (MDX)
    pages/<slug>.mdx         about, cv, contact, references, publications, projects
    upcoming.json            "Coming soon" entries for the Notes index
  content.config.ts          collection schemas (zod)
  layouts/                   Base (html shell), Page, Note, Project
  pages/                     one file per route, plus rss.xml.ts and 404.astro
  components/                Nav, Footer, ThemeToggle, Img, Download, NoteCardStatic, Prose, PageHeader
  components/islands/        NotesExplorer.tsx (React, hydrated on the Notes index)
  scripts/                   motion.ts (Lenis + GSAP), format.ts (dates, reading time)
  styles/global.css          Tailwind v4 tokens and the site's component styles
  consts.ts                  site name, description, nav, contact links
public/
  images/profile.jpg         home portrait
  images/about.jpg           About photo
  images/notes/              images used by notes
  images/projects/<slug>/    images used by a project
  cv.pdf, reference-*.pdf, un-certificate-appreciation.pdf
  favicon.svg, robots.txt, CNAME
```

Images live under `src/assets/images/` and go through `astro:assets` (WebP srcset, width/height); content keeps referencing them by the same `/images/...` path, for example `/images/notes/edison-lightbulb.png`, which `<Img>` resolves. Only `public/images/profile.jpg` stays in `public/` (the Open Graph image). In MDX use the components:

```mdx
import Img from '../../components/Img.astro'
import Download from '../../components/Download.astro'

<Img src="/images/notes/x.png" alt="Describe the image" caption="Optional caption" />
<Download href="/cv.pdf" label="CV (PDF)" />
```

In plain Markdown notes, `![alt](/images/notes/x.png)` works too.

## Deploy

Pushing to `main` builds the site with `withastro/action` and publishes it with `actions/deploy-pages`. The custom domain comes from `public/CNAME`; the sitemap is at `/sitemap-index.xml` and the feed at `/rss.xml`.
