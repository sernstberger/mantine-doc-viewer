import { useMergedRef } from '@mantine/hooks';
import { getBodyAttributes } from '../../utils/body-attributes';
import { fitsAcross, resolvePageTurning } from '../../utils/spreads';
import { usePageTurning } from './use-page-turning';
import type { PdfPagesContextValue } from './use-pages-config';
import type { PdfReadingPosition } from './use-pdf-reading-position';
import type { PdfLoaded, PdfViewGeometry } from './use-pdf-view-geometry';
import { useSpreads } from './use-spreads';

/** Turning pages and spreads: by swipe, by a click on an edge, by key; and the body's attributes for it */
export function usePdfPageTurns(
  context: PdfPagesContextValue,
  { ready, numPages }: PdfLoaded,
  view: PdfViewGeometry,
  { currentPage, goToPage }: PdfReadingPosition
) {
  const { layout, scale, columnGap, bodyWidth } = view;
  const { turn, goToSpread, spread } = useSpreads({
    layout,
    numPages,
    currentPage,
    ready: !!ready,
    goToPage,
  });
  const turning = resolvePageTurning(context.withPageTurning);
  const swipeable =
    turning.swipe &&
    fitsAcross({ layout, scale, pageWidth: view.pageSize.width, columnGap, bodyWidth });
  const pageTurning = usePageTurning({
    options: turning,
    active: view.reading,
    swipeable,
    turn,
  });
  const setBodyNode = useMergedRef(view.setBodyRef, pageTurning.ref);
  const { keyShortcuts, ...bodyAttributes } = getBodyAttributes({
    presenting: view.presenting,
    layout,
    scrollSnap: context.withScrollSnap,
    scroll: context.withScroll,
    swipeable,
    turningKeys: turning.keys,
  });

  return {
    turn,
    goToSpread,
    spread,
    onEdgeClick: pageTurning.onClick,
    setBodyNode,
    keyShortcuts,
    bodyAttributes,
  };
}

export type PdfPageTurns = ReturnType<typeof usePdfPageTurns>;
