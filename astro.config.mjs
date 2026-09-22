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
