/**
 * Site-wide constants. Import from anywhere: `import { SITE, NAV, BUILD_DATE } from '../consts'`.
 */
export const SITE = {
  name: 'Sam Lamrabte',
  /** Home page <title>; every other page renders "Title — Sam Lamrabte". */
  homeTitle: 'Sam Lamrabte — Political economist and analyst',
  description:
    'Sam Lamrabte: political economist and analyst working on EU digital & sustainability regulation, AI governance, and political economy.',
  url: 'https://samlamrabte.com',
  locale: 'en_GB',
  author: 'Sam Lamrabte',
  email: 'sabers.maps_2s@icloud.com',
  linkedin: 'https://www.linkedin.com/in/sam-lamrabte-571690122/',
  /** Default Open Graph image (public path). */
  ogImage: '/images/profile.jpg',
  /** Home masthead dateline, left side. */
  dateline: 'Political economy · Amsterdam',
} as const;

/** Primary navigation, in display order. */
export const NAV = [
  { label: 'About', href: '/about/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Notes', href: '/notes/' },
  { label: 'References', href: '/references/' },
  { label: 'CV', href: '/cv/' },
  { label: 'Contact', href: '/contact/' },
] as const;

/** Evaluated once per build — the honest "Updated {build date}" on the home dateline. */
export const BUILD_DATE = new Date();
