import { useEffect, useRef } from 'react';

/** How long after a presentation the page it ended on is kept in view while the layout settles, in ms */
const RESTORE_SETTLE_TIME = 600;

/**
 * After a presentation, stays on the page it ended on instead of the top of the document. The
 * toolbar and thumbnails come back and the fitted scale changes a moment later, so the page is
 * scrolled to again whenever the scale changes until things settle
 */
export function usePresentationRestore(
  presenting: boolean,
  currentPage: number,
  scale: number,
  scrollToPage: (page: number) => void
) {
  const presentedPage = useRef(0);
  const restorePage = useRef(0);
  if (presenting) {
    presentedPage.current = currentPage;
  }

  useEffect(() => {
    if (presenting || !presentedPage.current) {
      return undefined;
    }
    restorePage.current = presentedPage.current;
    presentedPage.current = 0;
    const timeout = window.setTimeout(() => {
      restorePage.current = 0;
    }, RESTORE_SETTLE_TIME);
    return () => window.clearTimeout(timeout);
  }, [presenting]);

  useEffect(() => {
    const page = restorePage.current;
    if (page && !presenting) {
      const frame = requestAnimationFrame(() => scrollToPage(page));
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [presenting, scale, scrollToPage]);
}
