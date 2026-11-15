import { useCallback, useEffect, useRef, useState } from 'react';
import { getScrollBehavior } from '../scroll';
import { Box, getMostVisiblePage, VisibleBox } from './geometry';

/** Space left above a page when scrolling to it */
const PAGE_SCROLL_OFFSET = 12;

/** Jumps further than this many screens scroll instantly */
const LONG_JUMP_SCREENS = 3;

/** Longest a programmatic scroll is expected to take, used when `scrollend` is not supported */
const SCROLL_SETTLE_TIMEOUT = 1000;

/**
 * Tracks which page takes up most of the scroll container, and scrolls to pages. `onView` is
 * called with the pages in view and the view whenever either changes, also during a scroll to a page
 */
export function useCurrentPage(
  scrollRoot: HTMLElement | null,
  horizontal = false,
  onView?: (boxes: VisibleBox[], view: Box) => void
) {
  const handleView = useRef(onView);
  handleView.current = onView;

  const [currentPage, setCurrentPage] = useState(1);
  const pages = useRef(new Map<number, HTMLDivElement>());
  const visible = useRef(new Set<number>());
  const observer = useRef<IntersectionObserver | null>(null);

  // While scrolling to a page, the pages passed on the way are ignored so the counter
  // shows the target page instead of counting through every page in between
  const scrollTarget = useRef<number | null>(null);
  const settleScroll = useRef<(() => void) | null>(null);

  useEffect(() => () => settleScroll.current?.(), []);

  useEffect(() => {
    if (!scrollRoot || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    // Measured in pixels, not intersection ratios: a page zoomed to several times the
    // height of the viewer never reaches a ratio threshold, yet fills the whole view
    const update = () => {
      const boxes: VisibleBox[] = [];
      visible.current.forEach((page) => {
        const rect = pages.current.get(page)?.getBoundingClientRect();
        rect &&
          boxes.push({
            page,
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
          });
      });
      const view = scrollRoot.getBoundingClientRect();
      handleView.current?.(boxes, view);
      if (scrollTarget.current !== null) {
        return;
      }

      const best = getMostVisiblePage(boxes, view);
      best && setCurrentPage(best);
    };

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const page = Number((entry.target as HTMLElement).dataset.pageNumber);
          entry.isIntersecting ? visible.current.add(page) : visible.current.delete(page);
        });
        update();
      },
      { root: scrollRoot }
    );
    pages.current.forEach((node) => observer.current?.observe(node));

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      scrollRoot.removeEventListener('scroll', onScroll);
      observer.current?.disconnect();
      observer.current = null;
    };
  }, [scrollRoot]);

  const registerPage = useCallback((page: number, node: HTMLDivElement | null) => {
    const previous = pages.current.get(page);
    previous && observer.current?.unobserve(previous);

    if (node) {
      pages.current.set(page, node);
      observer.current?.observe(node);
    } else {
      pages.current.delete(page);
      visible.current.delete(page);
    }
  }, []);

  // Only the viewer scrolls: scrollIntoView() would also scroll the page around the viewer
  const scrollToPage = useCallback(
    /** `offset` is the distance from the top of the page to scroll to, in px */
    (page: number, offset = 0) => {
      const node = pages.current.get(page);
      setCurrentPage(page);

      if (!node || !scrollRoot) {
        return;
      }

      // Finish any scroll still in progress, so its listener cannot end this one early
      settleScroll.current?.();
      scrollTarget.current = page;

      const settle = () => {
        window.clearTimeout(timeout);
        scrollRoot.removeEventListener('scrollend', settle);
        scrollTarget.current = null;
        settleScroll.current = null;
      };
      const timeout = window.setTimeout(settle, SCROLL_SETTLE_TIMEOUT);
      scrollRoot.addEventListener('scrollend', settle);
      settleScroll.current = settle;

      // Long jumps are instant: scrolling smoothly past hundreds of pages would draw each one
      const top = node.offsetTop - PAGE_SCROLL_OFFSET + offset;
      const left = horizontal ? node.offsetLeft - PAGE_SCROLL_OFFSET : scrollRoot.scrollLeft;
      const far =
        Math.abs(top - scrollRoot.scrollTop) > scrollRoot.clientHeight * LONG_JUMP_SCREENS ||
        Math.abs(left - scrollRoot.scrollLeft) > scrollRoot.clientWidth * LONG_JUMP_SCREENS;
      scrollRoot.scrollTo({ top, left, behavior: far ? 'auto' : getScrollBehavior() });
    },
    [scrollRoot, horizontal]
  );

  return { currentPage, registerPage, scrollToPage };
}
