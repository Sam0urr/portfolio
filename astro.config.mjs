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

  integrations: [mdx(), react(), sitemap()],

  redirects: {
    '/notes/brexit-lobbying-transparency/': '/notes/lobbying-after-brexit/',
    '/analysis/': '/notes/',
  },

  // Fonts API. Google serves variable fonts with only the requested axes, so the
  // optical-size axis is requested explicitly (unifont's experimental `variableAxis`);
  // the served files keep `opsz` and `font-optical-sizing: auto` does the rest.
  fonts: [
    {
      // Display — wordmark (500), headings, pull quotes.
      name: 'Newsreader',
      cssVariable: '--font-display',
      provider: fontProviders.google(),
      weights: ['400 500'],
      styles: ['normal'],
      subsets,
      fallbacks: ['Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
      optimizedFallbacks: true,
      options: { experimental: { variableAxis: { opsz: [['6', '72']] } } },
    },
    {
      // Display italic — ledes, blockquotes, the headline's italic phrase.
      name: 'Newsreader',
      cssVariable: '--font-display',
      provider: fontProviders.google(),
      weights: [400],
      styles: ['italic'],
      subsets,
      fallbacks: ['Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
      optimizedFallbacks: true,
      options: { experimental: { variableAxis: { opsz: [['6', '72']] } } },
    },
    {
      // Body — all prose; the 400–600 range covers <strong> (600).
      name: 'Source Serif 4',
      cssVariable: '--font-body',
      provider: fontProviders.google(),
      weights: ['400 600'],
      styles: ['normal'],
      subsets,
      fallbacks: ['Charter', 'Iowan Old Style', 'Georgia', 'serif'],
      optimizedFallbacks: true,
      options: { experimental: { variableAxis: { opsz: [['8', '60']] } } },
    },
    {
      // Body italic — 400 only.
      name: 'Source Serif 4',
      cssVariable: '--font-body',
      provider: fontProviders.google(),
      weights: [400],
      styles: ['italic'],
      subsets,
      fallbacks: ['Charter', 'Iowan Old Style', 'Georgia', 'serif'],
      optimizedFallbacks: true,
      options: { experimental: { variableAxis: { opsz: [['8', '60']] } } },
    },
    {
      // Meta — nav, kickers, dates, bylines, chips, captions, footer (500 = uppercase labels).
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      provider: fontProviders.google(),
      weights: [400, 500],
      styles: ['normal'],
      subsets,
      fallbacks: ['SF Mono', 'Menlo', 'Consolas', 'monospace'],
      optimizedFallbacks: true,
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
