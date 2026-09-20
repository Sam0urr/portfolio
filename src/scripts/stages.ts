/**
 * Scroll-driven scenes on top of the motion runtime (motion.ts owns Lenis, GSAP and
 * ScrollTrigger; every trigger created here dies in its teardown, listeners die with
 * the abort signal).
 *
 *   [data-stage]       case-study opening: sticky stage, one scene per viewport, layers
 *                      enter → hold → exit, scrubbed and fully reversible
 *   [data-hero-stage]  home hero: plate, tint plane and headline drift apart in depth
 *                      as the hero scrolls away
 *
 * Both add a light pointer parallax on fine-pointer devices only.
 */
import type { gsap as GsapType } from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

type Gsap = typeof GsapType;
type ScrollTriggerStatic = typeof ScrollTriggerType;

const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function setupStages(gsap: Gsap, ScrollTrigger: ScrollTriggerStatic, signal: AbortSignal): void {
  for (const wrap of document.querySelectorAll<HTMLElement>('[data-stage]')) setupProjectStage(wrap, gsap, signal);
  const hero = document.querySelector<HTMLElement>('[data-hero-stage]');
  if (hero) setupHeroStage(hero, gsap, signal);
  ScrollTrigger.refresh();
}

function setupProjectStage(wrap: HTMLElement, gsap: Gsap, signal: AbortSignal): void {
  const stage = wrap.querySelector<HTMLElement>('.stage');
  const scenes = Array.from(wrap.querySelectorAll<HTMLElement>('.scene'));
  const progress = wrap.querySelector<HTMLElement>('.stage-progress span');
  if (!stage || scenes.length === 0) return;

  wrap.classList.add('is-live');

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: wrap,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        if (progress) progress.style.width = `${(self.progress * 100).toFixed(2)}%`;
      },
    },
  });

  scenes.forEach((scene, i) => {
    const layers = Array.from(scene.querySelectorAll<HTMLElement>('.layer'));
    const caption = scene.querySelector<HTMLElement>('.scene-caption');
    const depth = (el: HTMLElement) => Number(el.dataset.depth) || 0.5;
    const last = i === scenes.length - 1;

    // Enter: far layers barely move, near layers rise further and settle later.
    tl.fromTo(scene, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, i);
    for (const layer of layers) {
      const d = depth(layer);
      tl.fromTo(
        layer,
        { y: 40 + 80 * d, scale: 1.04 + 0.06 * d, filter: 'blur(6px)' },
        { y: 0, scale: 1, filter: 'blur(0px)', duration: 0.35 + 0.1 * d, ease: 'power2.out' },
        i,
      );
    }
    if (caption) tl.fromTo(caption, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3 }, i + 0.12);

    // Hold until 0.62, then exit upwards with the same depth ordering; the last scene stays.
    if (!last) {
      for (const layer of layers) {
        const d = depth(layer);
        tl.to(layer, { y: -(30 + 70 * d), filter: 'blur(4px)', duration: 0.3, ease: 'power2.in' }, i + 0.62);
      }
      if (caption) tl.to(caption, { y: -16, autoAlpha: 0, duration: 0.2 }, i + 0.62);
      tl.to(scene, { autoAlpha: 0, duration: 0.2 }, i + 0.74);
    }
  });

  if (!finePointer()) return;
  // Pointer parallax on the images themselves so it never fights the scroll transforms.
  let frame = 0;
  stage.addEventListener(
    'pointermove',
    (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = stage.getBoundingClientRect();
        const dx = (event.clientX - rect.left) / rect.width - 0.5;
        const dy = (event.clientY - rect.top) / rect.height - 0.5;
        for (const layer of wrap.querySelectorAll<HTMLElement>('.layer')) {
          const d = Number(layer.dataset.depth) || 0.5;
          const img = layer.firstElementChild as HTMLElement | null;
          if (img) gsap.to(img, { x: -dx * 18 * d, y: -dy * 12 * d, duration: 0.8, ease: 'power2.out', overwrite: 'auto' });
        }
      });
    },
    { passive: true, signal },
  );
}

function setupHeroStage(hero: HTMLElement, gsap: Gsap, signal: AbortSignal): void {
  const plate = hero.querySelector<HTMLElement>('.hero-plate');
  const tint = hero.querySelector<HTMLElement>('.hero-tint');
  // The text block, not the headline: the headline's load-reveal animation owns its transform.
  const text = hero.querySelector<HTMLElement>('.hero-text');
  if (!plate || !text) return;

  // As the hero leaves: the tint plane lags (deep), the plate recedes, the text lifts (near).
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 },
  });
  if (tint) tl.to(tint, { y: 96, duration: 1 }, 0);
  tl.to(plate, { y: 48, scale: 0.94, autoAlpha: 0.55, filter: 'blur(4px)', duration: 1 }, 0);
  tl.to(text, { y: -40, autoAlpha: 0.6, duration: 1 }, 0);

  if (!finePointer()) return;
  const img = plate.querySelector<HTMLElement>('img');
  let frame = 0;
  hero.addEventListener(
    'pointermove',
    (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const dx = event.clientX / window.innerWidth - 0.5;
        const dy = event.clientY / window.innerHeight - 0.5;
        if (img) gsap.to(img, { x: -dx * 14, y: -dy * 10, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
        if (tint) gsap.to(tint, { x: dx * 10, duration: 1.1, ease: 'power2.out', overwrite: 'auto' });
      });
    },
    { passive: true, signal },
  );
}
