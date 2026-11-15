import { type MutableRefObject, useEffect, useRef } from 'react';
import { collectVisibleBoxes, getViewBox } from './current-page';
import { Box, getMostVisiblePage, VisibleBox } from './geometry';

type PageObserverOptions = {
  scrollRoot: HTMLElement | null;
  viewport: boolean;
  pages: MutableRefObject<Map<number, HTMLDivElement>>;
  visible: MutableRefObject<Set<number>>;
  observer: MutableRefObject<IntersectionObserver | null>;
  /** Set while a scroll to a page is under way: the current page is left alone then */
  scrollTarget: MutableRefObject<number | null>;
  onView?: (boxes: VisibleBox[], view: Box) => void;
  onCurrent: (page: number) => void;
};

/**
 * Watches which pages are in view (an IntersectionObserver, plus scroll events measured in
 * pixels) and reports the pages in view and the most visible one
 */
export function usePageObserver({
  scrollRoot,
  viewport,
  pages,
  visible,
  observer,
  scrollTarget,
  onView,
  onCurrent,
}: PageObserverOptions) {
  const handleView = useRef(onView);
  handleView.current = onView;

  useEffect(() => {
    if (!scrollRoot || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const scroller: HTMLElement | Window = viewport ? window : scrollRoot;

    // Measured in pixels, not intersection ratios: a page zoomed to several times the
    // height of the viewer never reaches a ratio threshold, yet fills the whole view
    const update = () => {
      const boxes = collectVisibleBoxes(visible.current, pages.current);
      const view = getViewBox(viewport, scrollRoot);
      handleView.current?.(boxes, view);
      if (scrollTarget.current !== null) {
        return;
      }

      const best = getMostVisiblePage(boxes, view);
      best && onCurrent(best);
    };

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const page = Number((entry.target as HTMLElement).dataset.pageNumber);
          entry.isIntersecting ? visible.current.add(page) : visible.current.delete(page);
        });
        update();
      },
      { root: viewport ? null : scrollRoot }
    );
    pages.current.forEach((node) => observer.current?.observe(node));

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', onScroll);
      observer.current?.disconnect();
      observer.current = null;
    };
  }, [scrollRoot, viewport]);
}
