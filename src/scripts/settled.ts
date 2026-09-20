/**
 * Runs `fn` once the document has loaded, its first contentful paint has been presented
 * (Paint Timing, buffered) and the main thread is idle. Everything that is not needed for
 * the first paint boots through this gate so that no script fetch precedes the largest
 * contentful paint, even on an instant network (Lighthouse's LCP simulation counts every
 * request that finishes before the observed LCP).
 *
 * Returns a cancel function; after it runs, `fn` is never called.
 */
const IDLE_TIMEOUT_MS = 1500;
const FIRST_PAINT_TIMEOUT_MS = 2000;

export function afterSettled(fn: () => void): () => void {
  let cancelled = false;
  let done = false;
  const timers: number[] = [];
  let idle: number | null = null;
  let paintObserver: PerformanceObserver | null = null;

  const run = () => {
    if (cancelled || done) return;
    done = true;
    fn();
  };

  let queued = false;
  const whenIdle = () => {
    if (cancelled || queued) return;
    queued = true;
    if (typeof window.requestIdleCallback === 'function') {
      idle = window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    } else timers.push(window.setTimeout(run, 1));
  };

  const afterFirstPaint = () => {
    if (cancelled) return;
    try {
      if (PerformanceObserver.supportedEntryTypes.includes('paint')) {
        const observer = new PerformanceObserver((list) => {
          if (list.getEntriesByName('first-contentful-paint').length === 0) return;
          observer.disconnect();
          whenIdle();
        });
        observer.observe({ type: 'paint', buffered: true });
        paintObserver = observer;
        // No paint entry (headless, hidden tab): go anyway after a bounded wait.
        timers.push(window.setTimeout(whenIdle, FIRST_PAINT_TIMEOUT_MS));
        return;
      }
    } catch {
      // No Paint Timing: use the next frame.
    }
    requestAnimationFrame(() => timers.push(window.setTimeout(whenIdle, 0)));
  };

  const onLoad = () => afterFirstPaint();
  if (document.readyState === 'complete') afterFirstPaint();
  else window.addEventListener('load', onLoad, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener('load', onLoad);
    paintObserver?.disconnect();
    for (const id of timers) window.clearTimeout(id);
    if (idle !== null && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle);
  };
}
