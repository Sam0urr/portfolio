/**
 * Scroll-driven scenes on top of the motion runtime (motion.ts owns Lenis, GSAP and
 * ScrollTrigger; every trigger created here dies in its teardown, listeners die with
 * the abort signal).
 *
 *   [data-stage]       case-study opening: sticky stage, one scene per viewport, layers
 *                      enter → hold → exit, scrubbed and fully reversible
 *   depth stages       home hero and About portrait: the plate recedes (sinks, shrinks,
 *                      softens) while the text lifts as they scroll away
 *
 * All add a light pointer parallax on fine-pointer devices only.
 */
import type { gsap as GsapType } from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

type Gsap = typeof GsapType;
type ScrollTriggerStatic = typeof ScrollTriggerType;

const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function setupStages(gsap: Gsap, ScrollTrigger: ScrollTriggerStatic, signal: AbortSignal): void {
  for (const wrap of document.querySelectorAll<HTMLElement>('[data-stage]')) setupProjectStage(wrap, gsap, signal);
  const hero = document.querySelector<HTMLElement>('[data-hero-stage]');
  if (hero) setupDepthStage(gsap, signal, { area: hero, plate: '.hero-plate', text: '.hero-text', trigger: hero });
  const about = document.querySelector<HTMLElement>('.about-photo');
  if (about) {
    const main = about.closest<HTMLElement>('main') ?? document.body;
    // The portrait floats beside the opening paragraphs: it only starts to recede once
    // the reader has scrolled it a quarter of the way up, so it never blurs mid-read.
    setupDepthStage(gsap, signal, { area: main, plate: '.about-photo', text: '.page-header', trigger: about, start: 'top 25%' });
  }
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
    // Each scene starts rising 0.12 before the previous one has finished fading, so the
    // stage is never empty between scenes; the exit blur masks the double exposure.
    const at = i === 0 ? 0 : i - 0.12;

    if (i === 0) {
      // The stage pins with its first scene already composed: the reader arrives on the
      // picture, not on an empty frame that fills after a quarter-screen of scroll.
      gsap.set(scene, { autoAlpha: 1 });
      if (caption) gsap.set(caption, { autoAlpha: 1 });
    } else {
      // Enter: far layers barely move, near layers rise further and settle later.
      tl.fromTo(scene, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, at);
      for (const layer of layers) {
        const d = depth(layer);
        tl.fromTo(
          layer,
          { y: 40 + 80 * d, scale: 1.04 + 0.06 * d, filter: 'blur(6px)' },
          { y: 0, scale: 1, filter: 'blur(0px)', duration: 0.35 + 0.1 * d, ease: 'power2.out' },
          at,
        );
      }
      if (caption) tl.fromTo(caption, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3 }, at + 0.12);
    }

    // Hold until 0.62, then exit upwards with the same depth ordering; the last scene stays.
    if (!last) {
      for (const layer of layers) {
        const d = depth(layer);
        tl.to(layer, { y: -(30 + 70 * d), filter: 'blur(4px)', duration: 0.3, ease: 'power2.in' }, i + 0.62);
      }
      if (caption) tl.to(caption, { y: -16, autoAlpha: 0, duration: 0.2 }, i + 0.62);
      tl.to(scene, { autoAlpha: 0, duration: 0.22 }, i + 0.78);
    }
  });

  if (!finePointer()) return;
  // Pointer parallax on the images themselves so it never fights the scroll transforms;
  // quickTo setters are built once so a pointer move never allocates a tween.
  const followers = Array.from(wrap.querySelectorAll<HTMLElement>('.layer')).flatMap((layer) => {
    const img = layer.firstElementChild as HTMLElement | null;
    if (!img) return [];
    const d = Number(layer.dataset.depth) || 0.5;
    return [
      {
        d,
        x: gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power2.out' }),
        y: gsap.quickTo(img, 'y', { duration: 0.8, ease: 'power2.out' }),
      },
    ];
  });
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
        for (const f of followers) {
          f.x(-dx * 18 * f.d);
          f.y(-dy * 12 * f.d);
        }
      });
    },
    { passive: true, signal },
  );
}

interface DepthStage {
  /** Element that listens for pointer movement. */
  area: HTMLElement;
  /** The portrait plate: recedes as the trigger scrolls away. */
  plate: string;
  /** A text block that lifts away faster (the block, not a load-revealed child, whose
      CSS animation owns its own transform). */
  text: string;
  trigger: HTMLElement;
  start?: string;
}

function setupDepthStage(gsap: Gsap, signal: AbortSignal, stage: DepthStage): void {
  const plate = stage.area.querySelector<HTMLElement>(stage.plate);
  const text = stage.area.querySelector<HTMLElement>(stage.text);
  if (!plate) return;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: stage.trigger, start: stage.start ?? 'top top', end: 'bottom top', scrub: 0.4 },
  });
  tl.to(plate, { y: 48, scale: 0.94, autoAlpha: 0.55, filter: 'blur(4px)', duration: 1 }, 0);
  if (text) tl.to(text, { y: -40, autoAlpha: 0.6, duration: 1 }, 0);

  if (!finePointer()) return;
  const img = plate.querySelector<HTMLElement>('img');
  if (!img) return;
  const toX = gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power2.out' });
  const toY = gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power2.out' });
  let frame = 0;
  stage.area.addEventListener(
    'pointermove',
    (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const dx = event.clientX / window.innerWidth - 0.5;
        const dy = event.clientY / window.innerHeight - 0.5;
        toX(-dx * 14);
        toY(-dy * 10);
      });
    },
    { passive: true, signal },
  );
}
