/**
 * Microsoft Clarity, loaded off the critical path: the tag is injected after the
 * `load` event, in an idle slot (at most 4 s later). Calls to `clarity()` made before
 * the tag arrives are queued the way the official snippet queues them.
 */
const PROJECT_ID = 'y81eujutav';

type ClarityQueue = { (...args: unknown[]): void; q?: unknown[][] };
type ClarityWindow = Window & { clarity?: ClarityQueue };

function inject(): void {
  const w = window as ClarityWindow;
  if (!w.clarity) {
    const queued: ClarityQueue = (...args: unknown[]) => {
      (queued.q = queued.q ?? []).push(args);
    };
    w.clarity = queued;
  }
  if (document.querySelector('script[data-clarity]')) return;
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;
  tag.dataset.clarity = '';
  document.head.appendChild(tag);
}

function whenIdle(fn: () => void): void {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 4000 });
  else window.setTimeout(fn, 1);
}

export function loadClarityWhenIdle(): void {
  if (document.readyState === 'complete') whenIdle(inject);
  else window.addEventListener('load', () => whenIdle(inject), { once: true });
}
