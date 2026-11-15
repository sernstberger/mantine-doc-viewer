import React from 'react';
import type { DocViewerPageLayout } from '../DocViewerRoot/DocViewerRoot';
import { useDocViewerContext } from '../doc-viewer.context';
import type { DocViewerMark } from '../utils/markup';
import { NO_MARKS } from '../utils/marks-by-page';
import type { DocViewerPageRect } from '../utils/page-points';
import { PdfPage } from './PdfPage';
import type { PdfLayerMarkup } from '../hooks/pdf/use-markup';

type PageProps = Omit<
  React.ComponentProps<typeof PdfPage>,
  'pageNumber' | 'highlightRects' | 'marks' | 'markupTabStop' | 'markup'
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
  /** The tool to draw new marks with */
  markup: PdfLayerMarkup;
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
  markup,
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
          markup={markup}
          marks={marksByPage.get(pageNumber) ?? NO_MARKS}
          // Only while a tool is picked, so turning pages without one renders no page
          markupTabStop={markup.tool !== null && pageNumber === currentPage}
        />
      ))}
    </div>
  );
}
