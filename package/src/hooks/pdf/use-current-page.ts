import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, VisibleBox } from '../../utils/geometry';
import { usePageObserver } from './use-page-observer';
import { useScrollToPage } from './use-scroll-to-page';

/**
 * Tracks which page takes up most of the scroll container, and scrolls to pages. With `viewport`
 * the viewer has no scroll area of its own (`height="auto"`): the browser window scrolls, so the
 * window is the view and pages are scrolled into it. `onView` is called with the pages in view and
 * the view whenever either changes, also during a scroll to a page
 */
export function useCurrentPage(
  scrollRoot: HTMLElement | null,
  horizontal = false,
  viewport = false,
  onView?: (boxes: VisibleBox[], view: Box) => void
) {
  const [currentPage, setCurrentPage] = useState(1);
  const pages = useRef(new Map<number, HTMLDivElement>());
  const visible = useRef(new Set<number>());
  const observer = useRef<IntersectionObserver | null>(null);

  const scrollTarget = useRef<number | null>(null);
  const settleScroll = useRef<(() => void) | null>(null);
  const pendingOffset = useRef<number | ((pageHeight: number) => number)>(0);
  const pendingInstant = useRef(false);

  useEffect(() => () => settleScroll.current?.(), []);

  usePageObserver({
    scrollRoot,
    viewport,
    pages,
    visible,
    observer,
    scrollTarget,
    onView,
    onCurrent: setCurrentPage,
  });

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

  const scrollToPage = useScrollToPage({
    scrollRoot,
    horizontal,
    viewport,
    pages,
    scrollTarget,
    settleScroll,
    pendingOffset,
    pendingInstant,
    onCurrent: setCurrentPage,
  });

  /**
   * Starts the scroll to a page again, for when the pages were scaled while it was under way:
   * setting the scroll offset to keep the view in place would cancel it. False when no scroll
   * to a page is under way
   */
  const resumeScroll = useCallback(() => {
    const page = scrollTarget.current;
    page !== null && scrollToPage(page, pendingOffset.current, pendingInstant.current);
    return page !== null;
  }, [scrollToPage]);

  return { currentPage, registerPage, scrollToPage, resumeScroll };
}
