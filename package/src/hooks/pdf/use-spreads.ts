import { useEffect, useMemo, useRef } from 'react';
import type { DocViewerPageLayout } from '../../doc-viewer.types';
import { clampPage } from '../../utils/geometry';
import {
  getSpreadIndex,
  getSpreads,
  getTurnTarget,
  type PageTurnDirection,
} from '../../utils/spreads';

interface SpreadsInput {
  layout: DocViewerPageLayout;
  numPages: number;
  currentPage: number;
  /** False while there is no document: nothing is reported */
  ready: boolean;
  goToPage: (page: number) => void;
  onSpreadChange: (spread: number, pages: number[]) => void;
}

/**
 * The pages shown side by side (pairs in two-page layouts, single pages in the others), turning by
 * spread, and `onSpreadChange` whenever the spread in view, or its pages, change
 */
export function useSpreads({
  layout,
  numPages,
  currentPage,
  ready,
  goToPage,
  onSpreadChange,
}: SpreadsInput) {
  const spreads = useMemo(() => getSpreads(layout, numPages), [layout, numPages]);
  const spreadIndex = getSpreadIndex(spreads, currentPage);

  const turn = (direction: PageTurnDirection) => {
    const target = getTurnTarget(spreads, currentPage, direction);
    target && goToPage(target);
  };
  const goToSpread = (spread: number) => {
    const pages = spreads[clampPage(spread, spreads.length) - 1];
    pages && goToPage(pages[0]);
  };

  const reported = useRef('');
  useEffect(() => {
    if (!ready) {
      return;
    }
    const pages = spreads[spreadIndex];
    if (pages.join() !== reported.current) {
      reported.current = pages.join();
      onSpreadChange(spreadIndex + 1, pages);
    }
  }, [ready, spreads, spreadIndex, onSpreadChange]);

  return { turn, goToSpread };
}
