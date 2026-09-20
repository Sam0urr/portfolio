/**
 * Client-router lifecycle (Astro's view-transition router). Turning a page, not reloading
 * it: the masthead stays put (transition:name + animate="none" in Nav.astro) while the
 * content cross-fades.
 *
 * The router is Astro's <ClientRouter /> (Base.astro); it is in place before the first
 * paint, so `astro:page-load` fires for the first document as well as after every
 * client navigation.
 *
 * What the swap breaks, and what is restored here:
 *   - <html> attributes and classes are replaced by the new document's, and the pre-paint
 *     inline script does not re-run in it. The theme (`data-theme`) and the capability
 *     classes (`js`, `theme-ready`, `reduced-motion`) are stamped on the incoming
 *     document before the swap and re-checked after it, so no frame paints the wrong theme.
 *   - Module scripts run once per document load, so motion is torn down on
 *     `astro:before-swap` and re-initialised on `astro:page-load` (idempotent: a second
 *     call while a motion session exists is a no-op).
 *   - [data-load-reveal] / .rule-draw keyframes are for the first paint; on a client
 *     navigation they would double up with the cross-fade. `html.client-nav` (set on the
 *     incoming document) turns them off; the class stays for the document's life because
 *     removing it would start those keyframes late.
 */
import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';
import { initMotion, teardownMotion } from './motion';

const STORAGE_KEY = 'theme';
const CLIENT_NAV_CLASS = 'client-nav';

type Theme = 'light' | 'dark';

/** The theme the pre-paint script would choose now: stored choice, else the system. */
export function resolveTheme(): Theme {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Stamps the theme and capability classes the site relies on (see Base.astro's pre-paint script). */
function stampRoot(root: HTMLElement, theme: Theme): void {
  root.setAttribute('data-theme', theme);
  root.classList.add('js', 'theme-ready', CLIENT_NAV_CLASS);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('reduced-motion');
  else root.classList.remove('reduced-motion');
}

let wired = false;

/** Registers the router hooks once per document load; safe to call again. */
export function initTransitions(): void {
  if (wired) return;
  wired = true;

  document.addEventListener('astro:before-swap', (event) => {
    const { newDocument } = event as TransitionBeforeSwapEvent;
    // Order matters: motion must release Lenis/GSAP before the old DOM is replaced.
    teardownMotion();
    // The incoming <html> carries no theme or classes (its inline script never ran).
    // Set them on it so the swap copies them across, and no frame shows the wrong theme.
    stampRoot(newDocument.documentElement, resolveTheme());
  });

  document.addEventListener('astro:after-swap', () => {
    // Belt and braces: the swap has replaced <html>'s attributes; make sure the theme and
    // the capability classes are exactly what the pre-paint script would have produced.
    stampRoot(document.documentElement, resolveTheme());
  });

  // On the first load and after every client navigation, once the new document's
  // scripts have run. initMotion gates itself behind load, first paint and idle.
  document.addEventListener('astro:page-load', () => {
    initMotion();
  });
}
