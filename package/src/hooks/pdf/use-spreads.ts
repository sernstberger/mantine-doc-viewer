import { useMemo } from 'react';
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
}

/**
 * The pages shown side by side (pairs in two-page layouts, single pages in the others), turning by
 * spread, and the spread in view (counted from 1) once the document is ready
 */
export function useSpreads({ layout, numPages, currentPage, ready, goToPage }: SpreadsInput) {
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

  const spread = ready ? { index: spreadIndex + 1, pages: spreads[spreadIndex] } : null;

  return { turn, goToSpread, spread };
}
