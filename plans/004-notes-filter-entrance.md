# 004 — Notes rows enter instead of teleporting when filtering

Commit: 7fb8b0f · Severity: opportunity · Category: missed opportunity (AUDIT §8) · Status: DONE

## Problem

`src/components/islands/NotesExplorer.tsx:224–227` renders `filteredNotes.map(...)` into
`<ul className="rows">`. Typing or toggling a chip re-renders the list; rows appear and
vanish instantly, so the page jumps. It is the site's one interactive island.

## Change

1. `NotesExplorer.tsx` line 224: `<ul className="rows">` →
   `<ul className={ready ? 'rows rows-live' : 'rows'}>` (`ready` flips true after the
   URL state is read on mount, so server-rendered rows never animate on page load; only
   rows inserted by a later filter do).

2. `src/styles/global.css`, inside the existing
   `@media (prefers-reduced-motion: no-preference) { … }` block at the end of the file, add:

   ```css
   /* Notes filter: rows that (re)enter the list rise in; removed rows leave instantly. */
   .rows-live > .row {
     transition: opacity 150ms var(--ease), transform 150ms var(--ease);
   }
   @starting-style {
     .rows-live > .row {
       opacity: 0;
       transform: translateY(4px);
     }
   }
   ```

   `@starting-style` runs only when an element is inserted; React re-mounts a row when it
   comes back into the filtered set (keys are the note slugs) and leaves untouched rows
   alone. 150 ms with the site's ease-out token: entrance duration budget, no stagger
   (a filter result must never lag the keystroke).

## Verify

- Build passes. At `/notes/`, type a word: matching rows rise in over 150 ms; clear the
  field: rows come back the same way; nothing moves on initial page load.
- Reduced motion: no entrance (the rule sits inside the `no-preference` block).
- Keyboard: focus stays in the search field throughout.
