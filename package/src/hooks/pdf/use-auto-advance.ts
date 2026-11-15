import { useInterval } from '@mantine/hooks';
import { useEffect, useRef } from 'react';
import type { DocViewerPageLayout } from '../../DocViewerRoot/DocViewerRoot';
import { DocViewerAutoAdvance, getNextPage } from '../../utils/kiosk';

interface AutoAdvanceInput {
  /** What to play, or undefined to stand still */
  autoAdvance: DocViewerAutoAdvance | undefined;
  currentPage: number;
  numPages: number;
  layout: DocViewerPageLayout;
  goToPage: (page: number) => void;
}

/** Shows the next page every `interval` ms while `autoAdvance` is set */
export function useAutoAdvance({
  autoAdvance,
  currentPage,
  numPages,
  layout,
  goToPage,
}: AutoAdvanceInput) {
  // useInterval restarts itself when its interval changes, so it is never told 0 or a new value
  // while stopping: that would start a timer that runs without pause
  const lastInterval = useRef(0);
  if (autoAdvance) {
    lastInterval.current = autoAdvance.interval;
  }

  const interval = useInterval(() => {
    const next = getNextPage(currentPage, numPages, layout, autoAdvance?.loop ?? true);
    next && goToPage(next);
  }, lastInterval.current);

  const playing = !!autoAdvance;
  const ms = autoAdvance?.interval;
  const { start, stop } = interval;
  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    start();
    return stop;
  }, [playing, ms, start, stop]);
}
