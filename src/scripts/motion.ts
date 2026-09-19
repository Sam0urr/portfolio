/**
 * Motion — a page being read, nothing more.
 *
 * Attributes the script understands (placed by pages/layouts):
 *   data-reading-progress   element scaled X 0→1 by reading progress (runs in every mode;
 *                           progress is measured over [data-reading-target] if present,
 *                           else the whole document)
 *   data-reveal             fade/rise once when it enters (start "top 88%", 500 ms)
 *   data-reveal-delay="ms"  extra delay for that element (or for every child of a group)
 *   data-reveal-group       direct children are revealed with a 60 ms sibling stagger, capped at 6
 *   data-parallax           subtle scrub parallax, y −24 → +24 px (data-parallax="16" to change)
 *
 * Reduced motion, or no IntersectionObserver: only reading progress runs; nothing is
 * hidden, nothing is imported. Otherwise <html> gains .motion-ok and Lenis + GSAP
 * ScrollTrigger load on demand. If anything throws, every element is made visible again.
 */

type GsapModule = typeof import('gsap');
type ScrollTriggerModule = typeof import('gsap/ScrollTrigger');
type Gsap = GsapModule['gsap'];
type ScrollTriggerStatic = ScrollTriggerModule['ScrollTrigger'];

const EASE_NAME = 'broadsheet';
const REVEAL_START = 'top 88%';
const STAGGER_MS = 60;
const STAGGER_CAP = 6;

let started = false;

export function initMotion(): void {
  if (started) return;
  started = true;

  initReadingProgress();

  const root = document.documentElement;
  if (root.classList.contains('reduced-motion') || !('IntersectionObserver' in window)) return;

  void start(root);
}

/* ---------------------------------------------------------------------------
   Reading progress — plain scroll listener + rAF, no easing, every mode.
   --------------------------------------------------------------------------- */
function initReadingProgress(): void {
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
    const progress = Math.min(1, Math.max(0, measure()));
    for (const bar of bars) bar.style.transform = `scaleX(${progress})`;
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}

/* ---------------------------------------------------------------------------
   Smooth scroll + scroll-driven reveals (motion-ok only).
   --------------------------------------------------------------------------- */
async function start(root: HTMLElement): Promise<void> {
  try {
    const [{ default: Lenis }, { gsap }, { ScrollTrigger }, { CustomEase }] = await Promise.all([
      import('lenis'),
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/CustomEase'),
    ]);

    gsap.registerPlugin(ScrollTrigger, CustomEase);
    CustomEase.create(EASE_NAME, '0.22, 1, 0.36, 1');

    // Lenis drives native scroll; GSAP's ticker drives Lenis.
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      anchors: true,
    });
    lenis.on('scroll', () => ScrollTrigger.update());
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    root.classList.add('motion-ok');
    setupReveals(gsap, ScrollTrigger);
    setupParallax(gsap, ScrollTrigger);

    // Late layout shifts (fonts, images) move trigger positions.
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});

    // Back/forward cache restores mid-page: make sure nothing stays hidden.
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) revealEverything();
    });
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

function setupReveals(gsap: Gsap, ScrollTrigger: ScrollTriggerStatic): void {
  const threshold = window.innerHeight * 0.88;

  for (const { el, delay } of collectRevealTargets()) {
    const rect = el.getBoundingClientRect();
    // Already on screen (or above it): show it, never blink it out first.
    if (rect.top < threshold) {
      el.classList.add('is-revealed');
      continue;
    }

    gsap.set(el, { opacity: 0, y: 10 });
    ScrollTrigger.create({
      trigger: el,
      start: REVEAL_START,
      once: true,
      onEnter: () => {
        el.classList.add('is-revealed');
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: delay / 1000,
          ease: EASE_NAME,
          clearProps: 'opacity,transform',
        });
      },
    });
  }
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
