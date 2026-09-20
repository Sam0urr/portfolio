# Animation plans

From the motion audit of 2026-09-21 (commit 7fb8b0f). Foundations were already right —
one strong ease-out token, colour transitions at 150–200 ms, asymmetric press feedback,
60 ms capped stagger, pointer effects gated to fine pointers, nothing hidden without JS.

| # | Plan | Severity | Depends on | Status |
|---|---|---|---|---|
| 001 | [Crossfade the Venserpolder scenes](001-stage-scene-overlap.md) | MEDIUM | — | DONE |
| 002 | [Reduced motion keeps colour/opacity feedback](002-reduced-motion-keep-feedback.md) | MEDIUM | — | DONE |
| 003 | [Pointer parallax via quickTo; drop will-change](003-pointer-parallax-quickto.md) | MEDIUM (+LOW) | — | DONE |
| 004 | [Notes rows enter when filtering](004-notes-filter-entrance.md) | opportunity | — | DONE |

Recommended order: 002 → 003 → 001 → 004 (independent; 001 needs a feel-check in the browser).

Noted, not planned (settled decisions): the 600 ms load-reveal chain and 500 ms scroll
reveals (the brief's entrance moment; the performance review measured no Speed Index
cost), Lenis at lerp 0.1, and `power2.in` on scene exits under scrub (a progress curve —
judged by eye inside plan 001). Remaining opportunity: add `filter 200ms var(--ease)` to
dark-mode-dimmed content photos so the dim crossfades with the theme colours.
