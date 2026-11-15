import { useEffect, useRef } from 'react';
import type { DocViewerEvents } from '../controller';
import type { Box, VisibleBox } from './geometry';
import {
  getReadingPosition,
  getSeenSummary,
  getVisibleRange,
  mergeRange,
  SeenRange,
} from './reading-progress';

interface ReadingProgressInput {
  scrollRoot: HTMLElement | null;
  document: unknown;
  numPages: number;
  horizontal: boolean;
  events: Required<DocViewerEvents>;
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
      ? getReadingPosition(scrollRoot.scrollLeft, scrollRoot.scrollWidth, scrollRoot.clientWidth)
      : getReadingPosition(scrollRoot.scrollTop, scrollRoot.scrollHeight, scrollRoot.clientHeight);

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
      const range = getVisibleRange(box, view, horizontal);
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
