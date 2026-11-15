import React from 'react';
import type { DocViewerPageLayout } from '../DocViewer';
import { useDocViewerContext } from '../DocViewer.context';
import type { DocViewerMark } from './markup';
import { NO_MARKS } from './marks-by-page';
import type { DocViewerPageRect } from './page-points';
import { PdfPage } from './PdfPage';

type PageProps = Omit<
  React.ComponentProps<typeof PdfPage>,
  'pageNumber' | 'highlightRects' | 'marks'
>;

interface PdfPageListProps extends PageProps {
  pagesRef: (node: HTMLDivElement | null) => void;
  layout: DocViewerPageLayout;
  /** A presentation shows only the current page */
  presenting: boolean;
  currentPage: number;
  /** The window scrolls (height="auto"): pages watch the window instead of the scroll area */
  viewport: boolean;
  /** Boxes a passage highlight marks, on its page */
  highlight: { page: number; rects: DocViewerPageRect[] } | null | undefined;
  /** The marks of each page */
  marksByPage: ReadonlyMap<number, DocViewerMark[]>;
}

/** The PDF's pages in the scroll area: every page, or the current one in a presentation */
export function PdfPageList({
  pagesRef,
  layout,
  presenting,
  currentPage,
  highlight,
  viewport,
  scrollRoot,
  marksByPage,
  ...page
}: PdfPageListProps) {
  const { getStyles } = useDocViewerContext();
  const numbers = presenting
    ? [currentPage]
    : Array.from({ length: page.numPages }, (_, index) => index + 1);

  return (
    <div ref={pagesRef} {...getStyles('pages')} data-layout={presenting ? 'presentation' : layout}>
      {numbers.map((pageNumber) => (
        <PdfPage
          key={pageNumber}
          {...page}
          scrollRoot={viewport ? null : scrollRoot}
          pageNumber={pageNumber}
          highlightRects={highlight?.page === pageNumber ? highlight.rects : undefined}
          marks={marksByPage.get(pageNumber) ?? NO_MARKS}
        />
      ))}
    </div>
  );
}
