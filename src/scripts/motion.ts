/**
 * Motion — a page being read, nothing more.
 *
 * Attributes the script understands (placed by pages/layouts):
 *   data-reading-progress   element scaled X 0→1 by reading progress (runs in every mode;
 *                           progress is measured over [data-reading-target] if present,
 *                           else the whole document)
 *   data-reveal             fade/rise once when it enters (top 88% of the viewport, 500 ms)
 *   data-reveal-delay="ms"  extra delay for that element (or for every child of a group)
 *   data-reveal-group       direct children are revealed with a 60 ms sibling stagger, capped at 6
 *   data-parallax           subtle scrub parallax, y −24 → +24 px (data-parallax="16" to change)
 *
 * Reduced motion, or no IntersectionObserver: only reading progress runs; nothing is
 * hidden, nothing is imported. Otherwise, once the page has loaded, its first frame has
 * been painted and the main thread is idle (scripts/settled.ts), Lenis + GSAP load on
 * demand and <html> gains .motion-ok (the imports never precede the first paint, so they
 * stay off the LCP path even when the network is instant). Reveals are driven
 * by one IntersectionObserver; ScrollTrigger is imported only for pages with a
 * [data-parallax] element (the home plate). If anything throws, every element is made
 * visible again.
 *
 * Lifecycle with the view-transition router (scripts/transitions.ts): `initMotion()` runs
 * for the first document and on every `astro:page-load`, `teardownMotion()` on every
 * `astro:before-swap`, so each document
 * owns exactly one Lenis, one ticker callback and one set of listeners. On a client
 * navigation the first-paint gate is skipped (the paint entry is the initial load's, the
 * modules are already cached) and Lenis is created after the router has restored scroll,
 * so a back navigation lands where the reader left.
 */

type GsapModule = typeof import('gsap');
type ScrollTriggerModule = typeof import('gsap/ScrollTrigger');
type Gsap = GsapModule['gsap'];
type ScrollTriggerStatic = ScrollTriggerModule['ScrollTrigger'];
type LenisInstance = InstanceType<typeof import('lenis').default>;

import { afterSettled } from './settled';

const EASE_NAME = 'broadsheet';
/** "top 88%": an element counts as entered once its top crosses 88% of the viewport height. */
const REVEAL_ROOT_MARGIN = '0px 0px -12% 0px';
const REVEAL_VIEWPORT_FRACTION = 0.88;
const STAGGER_MS = 60;
const STAGGER_CAP = 6;

/** Debug/diagnostic counters (read by the smoke test as `window.__motion`). */
type MotionDebug = {
  /** The live Lenis instance, or null between teardown and the next start. */
  lenis: LenisInstance | null;
  /** Lenis instances alive right now (must be 0 or 1). */
  lenisAlive: number;
  /** Lenis instances created since the document loaded. */
  lenisCreated: number;
  /** gsap.ticker callbacks alive right now (must be 0 or 1). */
  tickers: number;
  /** Times initMotion() ran for a document. */
  inits: number;
};
declare global {
  interface Window {
    __motion?: MotionDebug;
  }
}
const debug: MotionDebug = { lenis: null, lenisAlive: 0, lenisCreated: 0, tickers: 0, inits: 0 };
if (typeof window !== 'undefined') window.__motion = debug;

/** Everything one document's motion owns; `teardownMotion()` releases it all. */
type Session = {
  /** Every DOM/window listener registers with this signal. */
  controller: AbortController;
  /** Bumped by teardown so late async work (imports, fonts.ready) finds it stale. */
  generation: number;
  lenis: LenisInstance | null;
  ticker: ((time: number) => void) | null;
  gsap: Gsap | null;
  scrollTrigger: ScrollTriggerStatic | null;
  observers: IntersectionObserver[];
  /** Cancels the load → first paint → idle gate of a first-load boot still waiting. */
  cancelBoot: (() => void) | null;
};

let generation = 0;
let session: Session | null = null;
/** True once a document has finished its first paint and load — later inits are client navigations. */
let firstInitDone = false;

export function initMotion(): void {
  if (session) return;
  session = {
    controller: new AbortController(),
    generation: ++generation,
    lenis: null,
    ticker: null,
    gsap: null,
    scrollTrigger: null,
    observers: [],
    cancelBoot: null,
  };
  debug.inits += 1;
  const current = session;
  const clientNavigation = firstInitDone;
  firstInitDone = true;

  initReadingProgress(current);

  const root = document.documentElement;
  if (root.classList.contains('reduced-motion') || !('IntersectionObserver' in window)) return;

  if (clientNavigation) {
    // The document was reached by the client router: it is loaded and painted, the
    // modules are cached, and the router has already restored scroll. Start on the next
    // frame so the swap has been presented.
    requestAnimationFrame(() => {
      if (session === current) void start(root, current);
    });
    return;
  }

  // Off the critical path: nothing below the fold needs motion before the page has loaded
  // and painted (scripts/settled.ts).
  current.cancelBoot = afterSettled(() => {
    if (session === current) void start(root, current);
  });
}

/**
 * Releases everything `initMotion()` set up for the current document: ScrollTriggers,
 * the ticker callback, Lenis, listeners, observers, timers and the <html> classes.
 * Safe to call when nothing is running.
 */
export function teardownMotion(): void {
  const current = session;
  if (!current) return;
  session = null;
  generation += 1;

  current.controller.abort();
  current.cancelBoot?.();
  for (const observer of current.observers) observer.disconnect();

  try {
    current.scrollTrigger?.getAll().forEach((trigger) => trigger.kill());
    if (current.ticker && current.gsap) {
      current.gsap.ticker.remove(current.ticker);
      debug.tickers -= 1;
    }
    if (current.lenis) {
      current.lenis.destroy();
      debug.lenisAlive -= 1;
    }
  } catch (error) {
    console.warn('[motion] teardown:', error);
  }
  debug.lenis = null;

  const root = document.documentElement;
  root.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped', 'motion-ok');
}

/* ---------------------------------------------------------------------------
   Reading progress — plain scroll listener + rAF, no easing, every mode.
   --------------------------------------------------------------------------- */
function initReadingProgress(current: Session): void {
  const bars = Array.from(document.querySelectorAll<HTMLElement>('[data-reading-progress]'));
  if (bars.length === 0) return;

  const target = document.querySelector<HTMLElement>('[data-reading-target]');
  let queued = false;

  const measure = (): number => {
    const viewport = window.innerHeight;
    if (target) {
      const rect = target.getBoundingClientRect();
      const start = window.scrollY + rect.top;
      const end = start + rect.height - viewport;
      return end > start ? (window.scrollY - start) / (end - start) : 1;
    }
    const max = document.documentElement.scrollHeight - viewport;
    return max > 0 ? window.scrollY / max : 0;
  };

  const update = () => {
    queued = false;
    if (session !== current) return;
    const progress = Math.min(1, Math.max(0, measure()));
    for (const bar of bars) bar.style.transform = `scaleX(${progress})`;
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  const { signal } = current.controller;
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', schedule, { passive: true, signal });
  update();
}

/* ---------------------------------------------------------------------------
   Smooth scroll + scroll-driven reveals (motion-ok only).
   --------------------------------------------------------------------------- */
async function start(root: HTMLElement, current: Session): Promise<void> {
  try {
    // The reader may have switched reduced motion on while we waited for idle.
    if (root.classList.contains('reduced-motion')) return;

    const wantsParallax = document.querySelector('[data-parallax]') !== null;
    const [{ default: Lenis }, { gsap }, { CustomEase }, scrollTriggerModule] = await Promise.all([
      import('lenis'),
      import('gsap'),
      import('gsap/CustomEase'),
      wantsParallax ? import('gsap/ScrollTrigger') : Promise.resolve(null),
    ]);
    // Torn down while the modules loaded (a navigation mid-import): leave nothing behind.
    if (session !== current) return;
    const ScrollTrigger = scrollTriggerModule?.ScrollTrigger ?? null;

    gsap.registerPlugin(CustomEase);
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    CustomEase.create(EASE_NAME, '0.22, 1, 0.36, 1');
    current.gsap = gsap;
    current.scrollTrigger = ScrollTrigger;

    // Lenis drives native scroll; GSAP's ticker drives Lenis.
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      anchors: true,
    });
    current.lenis = lenis;
    debug.lenis = lenis;
    debug.lenisAlive += 1;
    debug.lenisCreated += 1;
    if (ScrollTrigger) lenis.on('scroll', () => ScrollTrigger.update());
    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    current.ticker = ticker;
    debug.tickers += 1;
    gsap.ticker.lagSmoothing(0);

    root.classList.add('motion-ok');
    setupReveals(gsap, current);

    const { signal } = current.controller;
    if (ScrollTrigger) {
      setupParallax(gsap, ScrollTrigger);
      // Late layout shifts (fonts, images) move trigger positions.
      window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true, signal });
      document.fonts?.ready
        .then(() => {
          if (session === current) ScrollTrigger.refresh();
        })
        .catch(() => {});
    }

    // Back/forward cache restores mid-page: make sure nothing stays hidden.
    window.addEventListener(
      'pageshow',
      (event) => {
        if (event.persisted) revealEverything();
      },
      { signal },
    );
    // Reduced motion switched on mid-visit: show everything, stop hiding.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduce.addEventListener?.(
      'change',
      (event) => {
        if (!event.matches) return;
        root.classList.add('reduced-motion');
        root.classList.remove('motion-ok');
        revealEverything();
      },
      { signal },
    );
  } catch (error) {
    root.classList.remove('motion-ok');
    revealEverything();
    console.warn('[motion] disabled:', error);
  }
}

type RevealTarget = { el: HTMLElement; delay: number };

function parseDelay(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function collectRevealTargets(): RevealTarget[] {
  const targets: RevealTarget[] = [];
  const seen = new Set<HTMLElement>();

  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    targets.push({ el, delay: parseDelay(el.dataset.revealDelay) });
    seen.add(el);
  }
  for (const group of document.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    const base = parseDelay(group.dataset.revealDelay);
    Array.from(group.children).forEach((child, index) => {
      if (!(child instanceof HTMLElement) || seen.has(child)) return;
      targets.push({ el: child, delay: base + Math.min(index, STAGGER_CAP) * STAGGER_MS });
      seen.add(child);
    });
  }
  return targets;
}

function setupReveals(gsap: Gsap, current: Session): void {
  const targets = collectRevealTargets();
  if (targets.length === 0) return;

  // Read every position first, then write: one layout pass instead of one per element.
  const threshold = window.innerHeight * REVEAL_VIEWPORT_FRACTION;
  const tops = targets.map(({ el }) => el.getBoundingClientRect().top);

  const pending = new Map<Element, RevealTarget>();
  targets.forEach((target, index) => {
    // Already on screen (or above it): show it, never blink it out first.
    if (tops[index] < threshold) target.el.classList.add('is-revealed');
    else pending.set(target.el, target);
  });
  if (pending.size === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = pending.get(entry.target);
        observer.unobserve(entry.target);
        pending.delete(entry.target);
        if (!target) continue;
        target.el.classList.add('is-revealed');
        gsap.to(target.el, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: target.delay / 1000,
          ease: EASE_NAME,
          clearProps: 'opacity,transform',
        });
      }
    },
    { rootMargin: REVEAL_ROOT_MARGIN },
  );
  current.observers.push(observer);

  for (const { el } of pending.values()) gsap.set(el, { opacity: 0, y: 10 });
  for (const el of pending.keys()) observer.observe(el);
}

function setupParallax(gsap: Gsap, ScrollTrigger: ScrollTriggerStatic): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-parallax]')) {
    const amount = Number(el.dataset.parallax) || 24;
    gsap.fromTo(
      el,
      { y: -amount },
      {
        y: amount,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      },
    );
  }
  void ScrollTrigger;
}

function revealEverything(): void {
  const selector = '[data-reveal], [data-reveal-group] > *';
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    el.classList.add('is-revealed');
    el.style.opacity = '';
    el.style.transform = '';
  }
}
