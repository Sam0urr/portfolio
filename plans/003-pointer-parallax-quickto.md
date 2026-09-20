# 003 — Pointer parallax without a tween per frame

Commit: 7fb8b0f · Severity: MEDIUM · Category: performance · Status: DONE
(also folds in the LOW finding: permanent `will-change` on stage layers)

## Problem

`src/scripts/stages.ts`, both `pointermove` handlers (project stage and depth stage) call
`gsap.to(img, { x, y, duration, ease, overwrite: 'auto' })` inside `requestAnimationFrame`
on every pointer move. On the six-scene stage that allocates up to three tweens per frame
plus overwrite bookkeeping at 60 fps. GSAP's `quickTo` exists for exactly this case.

`src/components/ProjectStage.astro`, live `.layer` rule: `will-change: transform, filter;`
promotes all 14 layers for the page's life, including scenes that are `visibility: hidden`.
GSAP already promotes an element with `translate3d` while it animates.

## Change

1. Project stage: after `wrap.classList.add('is-live')` and before the pointer listener,
   build the setters once:

   ```ts
   const followers = Array.from(wrap.querySelectorAll<HTMLElement>('.layer')).flatMap((layer) => {
     const img = layer.firstElementChild as HTMLElement | null;
     if (!img) return [];
     const d = Number(layer.dataset.depth) || 0.5;
     return [{
       d,
       x: gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power2.out' }),
       y: gsap.quickTo(img, 'y', { duration: 0.8, ease: 'power2.out' }),
     }];
   });
   ```
   and in the rAF callback replace the `gsap.to` loop with
   `for (const f of followers) { f.x(-dx * 18 * f.d); f.y(-dy * 12 * f.d); }`.

2. Depth stage (`setupDepthStage`): create
   `const toX = gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power2.out' });`
   `const toY = gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power2.out' });`
   once, and call `toX(-dx * 14); toY(-dy * 10);` in the rAF callback.

3. Delete `will-change: transform, filter;` from the live `.layer` rule in
   `ProjectStage.astro`.

Values (18/12 px, 14/10 px, 0.8 s / 0.9 s, `power2.out`) are unchanged; only the mechanism.

## Verify

- `npx astro check` → 0 errors; build passes.
- Move the pointer over the stage and the home portrait: the drift feels identical.
- Performance panel while moving the pointer over the stage: no per-frame GC churn from
  tween creation; layer count in the Layers panel drops once the stage is not animating.
