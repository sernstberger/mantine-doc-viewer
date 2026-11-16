import React from 'react';
import type { DocViewerPageLayout } from '../doc-viewer.types';
import { useDocViewerContext } from '../doc-viewer.context';
import type { DocViewerPageRect } from '../utils/page-points';
import { usePageScaleStore } from '../hooks/pdf/use-page-scale';
import { PdfPage } from './PdfPage';

type PageProps = Omit<
  React.ComponentProps<typeof PdfPage>,
  'pageNumber' | 'highlightRects' | 'scaleStore'
>;

interface PdfPageListProps extends PageProps {
  pagesRef: (node: HTMLDivElement | null) => void;
  layout: DocViewerPageLayout;
  /** A presentation shows only the current page */
  presenting: boolean;
  currentPage: number;
  scale: number;
  /** The window scrolls (height="auto"): pages watch the window instead of the scroll area */
  viewport: boolean;
  /** Boxes a passage highlight marks, on its page */
  highlight: { page: number; rects: DocViewerPageRect[] } | null | undefined;
}

/**
 * The PDF's pages in the scroll area: every page, or the current one in a presentation. Memoised:
 * the session renders for each keystroke in the search box and each page change, and a list that
 * is the same would otherwise build one element per page again
 */
export const PdfPageList = React.memo(function PdfPageList({
  pagesRef,
  layout,
  presenting,
  currentPage,
  highlight,
  viewport,
  scrollRoot,
  scale,
  ...page
}: PdfPageListProps) {
  const { getStyles } = useDocViewerContext();
  const scaleStore = usePageScaleStore(scale);
  const numbers = presenting
    ? [currentPage]
    : Array.from({ length: page.numPages }, (_, index) => index + 1);

  return (
    <div
      ref={pagesRef}
      {...getStyles('pages', { style: { '--total-scale-factor': scale } as React.CSSProperties })}
      data-layout={presenting ? 'presentation' : layout}
    >
      {numbers.map((pageNumber) => (
        <PdfPage
          key={pageNumber}
          {...page}
          scaleStore={scaleStore}
          scrollRoot={viewport ? null : scrollRoot}
          pageNumber={pageNumber}
          highlightRects={highlight?.page === pageNumber ? highlight.rects : undefined}
        />
      ))}
    </div>
  );
});
