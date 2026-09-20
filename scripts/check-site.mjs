#!/usr/bin/env node
/**
 * check-site.mjs — verifies a finished `astro build` in dist/. Node only, no dependencies.
 *
 *   a. URL contract: every page and file the migration promised exists in dist/.
 *   b. Live parity: every <loc> in the live site's sitemap exists in dist/, except the
 *      dropped sections (/analysis/, /categories/, /tags/, /page/) and the one redirect
 *      (/notes/brexit-lobbying-transparency/). A sitemap index is followed one level down.
 *      Set SKIP_LIVE=1 to skip this when offline; LIVE_SITEMAP=<url> overrides the address.
 *   c. Internal links: every href/src in dist/**\/*.html that starts with "/" (not "//")
 *      resolves to a file in dist/ ("/x/" → /x/index.html; fragments and queries ignored).
 *   d. Placeholders: no template leftovers ({{, }}, example.com, Atkinson, blog-placeholder,
 *      Lorem) in the built HTML outside <script> and <style> blocks.
 *
 * Exits 1 with a list of every failure, 0 when everything passes.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import process from 'node:process';

const DIST = resolve(process.cwd(), 'dist');
const LIVE_SITEMAP = process.env.LIVE_SITEMAP ?? 'https://samlamrabte.com/sitemap-index.xml';

const CONTRACT_PAGES = [
  '/',
  '/about/',
  '/projects/',
  '/projects/amsterdam-climate-adaptation/',
  '/notes/',
  '/notes/ai-electricity-or-threat/',
  '/notes/ai-mutual-assured-destruction/',
  '/notes/digital-euro/',
  '/notes/lobbying-after-brexit/',
  '/notes/regulatory-whiplash/',
  '/notes/tech-sovereignty/',
  '/references/',
  '/cv/',
  '/contact/',
  '/publications/',
];
const CONTRACT_FILES = [
  'rss.xml',
  'sitemap-index.xml',
  'robots.txt',
  'CNAME',
  'cv.pdf',
  'reference-1.pdf',
  'reference-2.pdf',
  'un-certificate-appreciation.pdf',
  'favicon.svg',
];
const LIVE_EXCLUDED_PREFIXES = ['/analysis/', '/categories/', '/tags/', '/page/'];
const LIVE_EXCLUDED_PATHS = new Set(['/notes/brexit-lobbying-transparency/']);
const PLACEHOLDERS = ['{{', '}}', 'example.com', 'Atkinson', 'blog-placeholder', 'Lorem'];

const failures = [];
function fail(section, message) {
  failures.push(`${section}: ${message}`);
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function stripQueryAndHash(urlPath) {
  return urlPath.replace(/[?#].*$/, '');
}

function relativeToDist(file) {
  return `dist${file.slice(DIST.length)}`;
}

/** The dist/ file that serves a site path ("/x/", "/x", "/file.pdf"), or null. */
async function resolveInDist(urlPath) {
  let path = stripQueryAndHash(urlPath);
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }
  const candidates = path.endsWith('/') ? [join(path, 'index.html')] : [path, join(path, 'index.html'), `${path}.html`];
  for (const candidate of candidates) {
    const full = resolve(DIST, `.${candidate}`);
    if (full !== DIST && !full.startsWith(DIST + sep)) continue; // never leave dist/
    if (await isFile(full)) return full;
  }
  return null;
}

async function walkHtml(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

// a. URL contract -------------------------------------------------------------
async function checkContract() {
  for (const page of CONTRACT_PAGES) {
    if (!(await resolveInDist(page))) fail('contract', `missing page ${page} (expected dist${page}index.html)`);
  }
  for (const file of CONTRACT_FILES) {
    if (!(await isFile(join(DIST, file)))) fail('contract', `missing file dist/${file}`);
  }
  console.log(`contract: ${CONTRACT_PAGES.length} pages and ${CONTRACT_FILES.length} files checked`);
}

// b. Live sitemap parity -------------------------------------------------------
async function fetchSitemapLocs(url, depth = 0) {
  const response = await fetch(url, { headers: { 'user-agent': 'check-site (samlamrabte.com build check)' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const xml = await response.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1]);
  if (/<sitemapindex[\s>]/i.test(xml)) {
    if (depth >= 2) return [];
    const nested = await Promise.all(locs.map((child) => fetchSitemapLocs(child, depth + 1)));
    return nested.flat();
  }
  return locs;
}

async function checkLiveParity() {
  if (process.env.SKIP_LIVE) {
    console.log('live: skipped (SKIP_LIVE is set)');
    return;
  }
  let locs;
  try {
    locs = await fetchSitemapLocs(LIVE_SITEMAP);
  } catch (error) {
    fail('live', `could not fetch ${LIVE_SITEMAP}: ${error.message} (set SKIP_LIVE=1 to skip when offline)`);
    return;
  }
  if (locs.length === 0) {
    fail('live', `no <loc> entries found at ${LIVE_SITEMAP}`);
    return;
  }
  let checked = 0;
  for (const loc of locs) {
    let path;
    try {
      path = new URL(loc).pathname;
    } catch {
      fail('live', `unparseable <loc>: ${loc}`);
      continue;
    }
    if (LIVE_EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) continue;
    if (LIVE_EXCLUDED_PATHS.has(path)) continue;
    checked += 1;
    if (!(await resolveInDist(path))) fail('live', `${path} is in the live sitemap but missing from dist/`);
  }
  console.log(`live: ${locs.length} URLs in ${LIVE_SITEMAP}, ${checked} checked against dist/`);
}

// c. Internal links ------------------------------------------------------------
const BLOCK_RE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const ATTR_RE = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

async function checkInternalLinks(htmlFiles) {
  let refs = 0;
  const resolved = new Map(); // path → boolean
  for (const file of htmlFiles) {
    const html = (await readFile(file, 'utf8')).replace(BLOCK_RE, '');
    for (const match of html.matchAll(ATTR_RE)) {
      const value = (match[1] ?? match[2] ?? '').trim();
      if (!value.startsWith('/') || value.startsWith('//')) continue;
      refs += 1;
      const key = stripQueryAndHash(value);
      if (!resolved.has(key)) resolved.set(key, (await resolveInDist(key)) !== null);
      if (!resolved.get(key)) fail('links', `${relativeToDist(file)} → ${value} does not resolve in dist/`);
    }
  }
  console.log(`links: ${refs} internal references in ${htmlFiles.length} HTML files (${resolved.size} distinct)`);
}

// d. Placeholders --------------------------------------------------------------
async function checkPlaceholders(htmlFiles) {
  for (const file of htmlFiles) {
    const html = (await readFile(file, 'utf8')).replace(BLOCK_RE, '');
    for (const needle of PLACEHOLDERS) {
      const index = html.indexOf(needle);
      if (index === -1) continue;
      const snippet = html.slice(Math.max(0, index - 40), index + needle.length + 40).replace(/\s+/g, ' ');
      fail('placeholders', `${relativeToDist(file)} contains "${needle}": …${snippet}…`);
    }
  }
  console.log(`placeholders: ${PLACEHOLDERS.length} patterns checked in ${htmlFiles.length} HTML files`);
}

// ------------------------------------------------------------------------------
async function main() {
  if (!(await isFile(join(DIST, 'index.html')))) {
    console.error('dist/index.html not found — run `npx astro build` first.');
    process.exit(1);
  }
  const htmlFiles = await walkHtml(DIST);
  await checkContract();
  await checkLiveParity();
  await checkInternalLinks(htmlFiles);
  await checkPlaceholders(htmlFiles);

  if (failures.length > 0) {
    console.error(`\n${failures.length} problem${failures.length === 1 ? '' : 's'}:`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log('\ncheck:site passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
