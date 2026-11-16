import { useEffect, useRef } from 'react';
import { getScrollStart, isRightToLeft } from '../../utils/scroll-left';
import type { DocViewerPagesEvents } from '../use-controller-registry';
import type { Box, VisibleBox } from '../../utils/geometry';
import {
  getReadingPosition,
  getSeenSummary,
  getVisibleRange,
  mergeRange,
  SeenRange,
} from '../../utils/reading-progress';

/** How far the window has scrolled through a viewer that grows with its pages */
function getWindowPosition(scrollRoot: HTMLElement) {
  const rect = scrollRoot.getBoundingClientRect();
  return getReadingPosition(-rect.top, rect.height, window.innerHeight);
}

interface ReadingProgressInput {
  scrollRoot: HTMLElement | null;
  document: unknown;
  numPages: number;
  horizontal: boolean;
  /** The window scrolls instead of `scrollRoot` (`autosize`) */
  viewport: boolean;
  events: Required<DocViewerPagesEvents>;
}

/**
 * Remembers how much of each page has been on screen and calls `onReadingProgress` when that
 * changes, and `onReachEnd` once the end of the last page is seen. Starts over for a new document
 */
export function useReadingProgress({
  scrollRoot,
  document,
  numPages,
  horizontal,
  viewport,
  events,
}: ReadingProgressInput) {
  const ranges = useRef(new Map<number, SeenRange>());
  const reported = useRef('');
  const endReported = useRef(false);

  const report = () => {
    if (!scrollRoot) {
      return;
    }
    const { seen, reachedEnd } = getSeenSummary(ranges.current, numPages);
    const position = horizontal
      ? getReadingPosition(
          getScrollStart(scrollRoot),
          scrollRoot.scrollWidth,
          scrollRoot.clientWidth
        )
      : viewport
        ? getWindowPosition(scrollRoot)
        : getReadingPosition(
            scrollRoot.scrollTop,
            scrollRoot.scrollHeight,
            scrollRoot.clientHeight
          );

    const key = JSON.stringify([seen, position, reachedEnd]);
    if (key !== reported.current) {
      reported.current = key;
      events.onReadingProgress({ seen, position, reachedEnd });
    }
    if (reachedEnd && !endReported.current) {
      endReported.current = true;
      events.onReachEnd();
    }
  };

  /** Takes in the pages that are on screen */
  const sample = (boxes: VisibleBox[], view: Box) => {
    boxes.forEach((box) => {
      const range = getVisibleRange(
        box,
        view,
        horizontal,
        !!scrollRoot && isRightToLeft(scrollRoot)
      );
      range && ranges.current.set(box.page, mergeRange(ranges.current.get(box.page), range));
    });
    report();
  };

  /** Forgets what has been seen, for the next reader */
  const reset = () => {
    ranges.current.clear();
    endReported.current = false;
    report();
  };

  useEffect(() => {
    ranges.current.clear();
    reported.current = '';
    endReported.current = false;
  }, [document]);

  return { sample, reset };
}
