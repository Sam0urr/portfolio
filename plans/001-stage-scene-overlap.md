# 001 — Crossfade the Venserpolder scenes instead of leaving a gap

Commit: 7fb8b0f · Severity: MEDIUM · Category: cohesion / interruptibility · Status: DONE

## Problem

`src/scripts/stages.ts`, `setupProjectStage`. Each scene fades out at `i + 0.74` for `0.2`
(ends `i + 0.94`) while the next scene fades in from `i + 1.0`. For 6 % of every scene
(~50 px of scroll at an 800 px viewport) nothing is on the stage; scrolling slowly you see
it flash bare between every pair of scenes.

## Change

In the `scenes.forEach((scene, i) => …)` block:

1. Every entrance (scene fade, layer rise, caption) is positioned at
   `const at = i === 0 ? 0 : i - 0.12;` instead of `i` (caption at `at + 0.12`).
2. The exit fade becomes `tl.to(scene, { autoAlpha: 0, duration: 0.22 }, i + 0.78);`
   so it ends exactly at `i + 1.0`, inside the next scene's entrance window.
3. Layer and caption exits stay at `i + 0.62`; the blur on the exiting layers masks the
   double exposure during the 0.12 overlap (AUDIT §7).

Nothing else in the timeline changes. The track height in `ProjectStage.astro` stays.

## Verify

- `npx astro check` → 0 errors; `npx astro build` → success.
- In the browser at `/projects/amsterdam-climate-adaptation/`, scroll slowly through the
  stage: at every scene boundary two scenes are briefly visible together (one blurred,
  leaving; one rising), never none. Check with
  `[...document.querySelectorAll('.scene')].map(s => getComputedStyle(s).visibility)` at a
  boundary — expect two `visible`.
- Scroll back up: the sequence reverses cleanly.
- Feel-check: the `power2.in` on the layer exit is a progress curve under scrub; if the
  leave still reads as a late jump, change it to `power1.inOut` — judge by eye, not by code.
