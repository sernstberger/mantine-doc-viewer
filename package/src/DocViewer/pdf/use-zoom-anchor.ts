import { useLayoutEffect, useRef } from 'react';

/** Scroll offset that keeps the same point of the document in the middle of the view after a zoom */
export function getAnchoredScroll(scroll: number, viewSize: number, ratio: number) {
  return Math.max(0, (scroll + viewSize / 2) * ratio - viewSize / 2);
}

/**
 * Keeps the middle of the view on the same part of the document when the pages are scaled:
 * without it the scroll offset stays put while every page grows or shrinks, so zooming jumps
 * to another page
 */
export function useZoomAnchor(scrollRoot: HTMLElement | null, scale: number, enabled: boolean) {
  const previousScale = useRef(scale);

  useLayoutEffect(() => {
    const previous = previousScale.current;
    previousScale.current = scale;
    if (!scrollRoot || !enabled || previous === scale || previous <= 0) {
      return;
    }

    const ratio = scale / previous;
    scrollRoot.scrollTop = getAnchoredScroll(scrollRoot.scrollTop, scrollRoot.clientHeight, ratio);
    scrollRoot.scrollLeft = getAnchoredScroll(scrollRoot.scrollLeft, scrollRoot.clientWidth, ratio);
  }, [scrollRoot, scale, enabled]);
}
