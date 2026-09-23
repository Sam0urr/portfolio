// @ts-check
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

const subsets = /** @type {[string, ...string[]]} */ (['latin', 'latin-ext']);

// https://astro.build/config
export default defineConfig({
  site: 'https://samlamrabte.com',
  trailingSlash: 'always',
  // One stylesheet for the whole site (~8 KB gz): inlined so no render-blocking request precedes first paint.
  build: { format: 'directory', inlineStylesheets: 'always' },

  integrations: [
    mdx(),
    react(),
    // /publications/ stays reachable but unlisted (and noindex) until its entries are real.
    sitemap({ filter: (page) => !page.endsWith('/publications/') }),
  ],

  redirects: {
    '/notes/brexit-lobbying-transparency/': '/notes/lobbying-after-brexit/',
    '/analysis/': '/notes/',
  },

  // Fonts API. Google serves variable fonts with only the requested axes, so Inter's
  // optical-size axis is requested explicitly (unifont's experimental `variableAxis`).
  fonts: [
    {
      // Display — wordmark, page titles, headings, ledes and the home headline, whose
      // italic phrase is the real italic.
      name: 'Newsreader',
      cssVariable: '--font-headline',
      provider: fontProviders.google(),
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
      optimizedFallbacks: true,
      options: { experimental: { variableAxis: { opsz: [['6', '72']] } } },
    },
    {
      // Wordmark — Newsreader 500 as a ~4 KB static instance (opsz 19 = --text-md, the only
      // size it is set at) subset to the glyphs of "Sam Lamrabte", so the shared --font-headline
      // file (every heading/lede) doesn't have to carry weight 500 just for six words. Fetched
      // from Google Fonts (OFL) with `family=Newsreader:opsz,wght@19,500&text=Sam%20Lamrabte`;
      // regenerate it and the unicodeRange below if the wordmark text changes. Any character
      // outside the range falls through to --font-headline (Newsreader 400), never a system serif.
      name: 'Newsreader Wordmark',
      cssVariable: '--font-wordmark',
      provider: fontProviders.local(),
      options: {
        variants: [{ src: ['./src/assets/fonts/newsreader-wordmark-500.woff2'], weight: 500, style: 'normal' }],
      },
      unicodeRange: ['U+20', 'U+4C', 'U+53', 'U+61-62', 'U+65', 'U+6D', 'U+72', 'U+74'],
      fallbacks: [],
      optimizedFallbacks: false,
    },
    {
      // Body — all prose; the 400–600 range covers <strong> (600).
      name: 'Inter',
      cssVariable: '--font-body',
      provider: fontProviders.google(),
      weights: ['400 600'],
      styles: ['normal'],
      subsets,
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
      optimizedFallbacks: true,
      options: { experimental: { variableAxis: { opsz: [['14', '32']] } } },
    },
    {
      // Body italic — 400 only (blockquotes, <em>).
      name: 'Inter',
      cssVariable: '--font-body',
      provider: fontProviders.google(),
      weights: [400],
      styles: ['italic'],
      subsets,
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
      optimizedFallbacks: true,
      options: { experimental: { variableAxis: { opsz: [['14', '32']] } } },
    },
    {
      // Meta — nav, kickers, dates, bylines, chips, captions, footer (500 = uppercase labels).
      name: 'Inter',
      cssVariable: '--font-mono',
      provider: fontProviders.google(),
      weights: [400, 500],
      styles: ['normal'],
      subsets,
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
      optimizedFallbacks: true,
      options: { experimental: { variableAxis: { opsz: [['14', '32']] } } },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
