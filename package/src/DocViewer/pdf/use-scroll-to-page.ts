import { type MutableRefObject, useCallback } from 'react';
import { getScrollBehavior } from '../scroll';
import { getScrollTarget, getWindowScrollView, resolveOffset } from './current-page';

/** Longest a programmatic scroll is expected to take, used when `scrollend` is not supported */
const SCROLL_SETTLE_TIMEOUT = 1000;

type PageOffset = number | ((pageHeight: number) => number);

type ScrollToPageOptions = {
  scrollRoot: HTMLElement | null;
  horizontal: boolean;
  viewport: boolean;
  pages: MutableRefObject<Map<number, HTMLDivElement>>;
  /** The page being scrolled to: the pages passed on the way are ignored meanwhile */
  scrollTarget: MutableRefObject<number | null>;
  settleScroll: MutableRefObject<(() => void) | null>;
  /** The offset and instant flag of the scroll in progress, to restart it when pages are scaled */
  pendingOffset: MutableRefObject<PageOffset>;
  pendingInstant: MutableRefObject<boolean>;
  onCurrent: (page: number) => void;
};

/**
 * Marks a scroll to a page as under way until the scroller reports `scrollend`, or a timeout
 * passes where that is not supported
 */
function trackScroll(
  scroller: HTMLElement | Window,
  scrollTarget: MutableRefObject<number | null>,
  settleScroll: MutableRefObject<(() => void) | null>
) {
  const settle = () => {
    window.clearTimeout(timeout);
    scroller.removeEventListener('scrollend', settle);
    scrollTarget.current = null;
    settleScroll.current = null;
  };
  const timeout = window.setTimeout(settle, SCROLL_SETTLE_TIMEOUT);
  scroller.addEventListener('scrollend', settle);
  settleScroll.current = settle;
}

/** Scrolls to a page: only the viewer scrolls, scrollIntoView() would also scroll the page around it */
export function useScrollToPage({
  scrollRoot,
  horizontal,
  viewport,
  pages,
  scrollTarget,
  settleScroll,
  pendingOffset,
  pendingInstant,
  onCurrent,
}: ScrollToPageOptions) {
  return useCallback(
    /**
     * `offset` is the distance from the top of the page to scroll to, in px, or a function of the
     * page's height in px that gives it. `instant` jumps there without scrolling smoothly
     */
    (page: number, offset: PageOffset = 0, instant = false) => {
      const node = pages.current.get(page);
      onCurrent(page);

      if (!node || !scrollRoot) {
        return;
      }

      // Finish any scroll still in progress, so its listener cannot end this one early
      settleScroll.current?.();
      scrollTarget.current = page;
      pendingOffset.current = offset;
      pendingInstant.current = instant;

      const scroller: HTMLElement | Window = viewport ? window : scrollRoot;
      trackScroll(scroller, scrollTarget, settleScroll);

      // Long jumps are instant: scrolling smoothly past hundreds of pages would draw each one
      const target = getScrollTarget({
        pageTop: viewport ? node.getBoundingClientRect().top + window.scrollY : node.offsetTop,
        pageLeft: node.offsetLeft,
        distance: resolveOffset(offset, node.offsetHeight),
        horizontal,
        viewport,
        view: viewport ? getWindowScrollView() : scrollRoot,
      });
      const { top, left, pageLeft, far } = target;
      const behavior: ScrollBehavior = instant ? 'instant' : far ? 'auto' : getScrollBehavior();
      scroller.scrollTo({ top, left, behavior });
      // A row of pages is scrolled sideways inside the viewer, even when the window scrolls
      viewport && horizontal && scrollRoot.scrollTo({ left: pageLeft, behavior });
    },
    [scrollRoot, horizontal, viewport]
  );
}
