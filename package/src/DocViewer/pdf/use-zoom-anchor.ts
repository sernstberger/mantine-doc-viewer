import { useLayoutEffect, useRef } from 'react';

/** The page under the middle of the view, and where in it the middle falls (0 is its top or left edge, 1 the other) */
export interface ZoomAnchor {
  page: string;
  x: number;
  y: number;

  /** The view shows the start of the first page: zooming keeps it there */
  atStart?: boolean;
}

function getPages(scrollRoot: HTMLElement) {
  return Array.from(scrollRoot.querySelectorAll<HTMLElement>('[data-page-number]'));
}

/** Distance from a point to a page box, 0 inside it */
function distanceTo(node: HTMLElement, x: number, y: number) {
  const dx = Math.max(node.offsetLeft - x, 0, x - (node.offsetLeft + node.offsetWidth));
  const dy = Math.max(node.offsetTop - y, 0, y - (node.offsetTop + node.offsetHeight));
  return Math.hypot(dx, dy);
}

/** Finds the page under the middle of the view, or the nearest one when the middle is in a gap */
export function getZoomAnchor(scrollRoot: HTMLElement): ZoomAnchor | null {
  const first = getPages(scrollRoot).find((node) => node.offsetHeight > 0);
  if (
    first &&
    scrollRoot.scrollTop <= first.offsetTop &&
    scrollRoot.scrollLeft <= first.offsetLeft
  ) {
    return { page: first.dataset.pageNumber!, x: 0, y: 0, atStart: true };
  }
  const x = scrollRoot.scrollLeft + scrollRoot.clientWidth / 2;
  const y = scrollRoot.scrollTop + scrollRoot.clientHeight / 2;
  let best: HTMLElement | null = null;
  let bestDistance = Infinity;
  getPages(scrollRoot).forEach((node) => {
    const distance = distanceTo(node, x, y);
    if (node.offsetHeight > 0 && distance < bestDistance) {
      best = node;
      bestDistance = distance;
    }
  });
  const page = best as HTMLElement | null;
  return page
    ? {
        page: page.dataset.pageNumber!,
        x: (x - page.offsetLeft) / page.offsetWidth,
        y: (y - page.offsetTop) / page.offsetHeight,
      }
    : null;
}

const noScroll = () => false;

/**
 * Keeps the middle of the view on the same spot of the same page when the pages are scaled:
 * without it the scroll offset stays put while every page grows or shrinks, so zooming jumps to
 * another page. Anchoring to a page rather than scaling the offset keeps working when the gaps
 * between pages (`pageGap`, the padding of `pages`, an app's own styles) do not scale
 */
export function useZoomAnchor(
  scrollRoot: HTMLElement | null,
  scale: number,
  enabled: boolean,
  /** Restarts a scroll to a page that is under way, true when there was one */
  resumeScroll: () => boolean = noScroll
) {
  const previousScale = useRef(scale);
  const anchor = useRef<ZoomAnchor | null>(null);

  // Read while rendering, before React puts the new page sizes into the DOM
  if (scrollRoot && enabled && scale !== previousScale.current) {
    anchor.current = getZoomAnchor(scrollRoot);
  }

  useLayoutEffect(() => {
    const previous = previousScale.current;
    previousScale.current = scale;
    const target = anchor.current;
    anchor.current = null;
    if (!scrollRoot || !enabled || previous === scale || resumeScroll()) {
      return;
    }

    const page =
      target && scrollRoot.querySelector<HTMLElement>(`[data-page-number="${target.page}"]`);
    // No page to keep in view (none laid out yet, as when a document first fits), or the start in
    // view: the padding before the first page does not scale, so leaving the offset is right
    if (!page || target.atStart) {
      return;
    }
    scrollRoot.scrollTop = Math.max(
      0,
      page.offsetTop + target.y * page.offsetHeight - scrollRoot.clientHeight / 2
    );
    scrollRoot.scrollLeft = Math.max(
      0,
      page.offsetLeft + target.x * page.offsetWidth - scrollRoot.clientWidth / 2
    );
  }, [scrollRoot, scale, enabled, resumeScroll]);
}
