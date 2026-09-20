# 002 — Reduced motion keeps colour and opacity feedback

Commit: 7fb8b0f · Severity: MEDIUM · Category: accessibility · Status: DONE

## Problem

`src/styles/global.css:238–244`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

`transition-duration: 0.01ms` on everything also kills the 200 ms theme crossfade
(`html.theme-ready`) and the 150 ms link/chip colour fades. Reduced motion means fewer and
gentler animations, not zero: keep opacity and colour, drop movement (AUDIT §6).

## Change

Replace the `transition-duration` line with a `transition-property` override, so any
declared transition keeps its duration but may only affect colour or opacity:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-property: color, background-color, border-color, text-decoration-color, opacity !important;
    scroll-behavior: auto !important;
  }
}
```

Effects: theme switch still crossfades 200 ms; link and chip hovers still fade 150 ms;
press feedback (`transform 100ms`) snaps instead of easing — correct under reduced motion.
Elements with no transition declared are unaffected (duration stays 0).

## Verify

- Build passes. In the browser with reduced motion emulated (DevTools → Rendering →
  Emulate CSS media feature prefers-reduced-motion), toggle Day/Night: colours fade over
  200 ms; hover a nav link: colour fades. Scroll reveals, load reveals and the stages stay
  off (unchanged: they are gated on `html.reduced-motion` in JS and on the media query in CSS).
