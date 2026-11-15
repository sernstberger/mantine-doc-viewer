import type { DocViewerContextValue } from '../DocViewer.context';
import { getPointOffset } from './page-points';
import { useAnnouncement } from './use-announcement';
import { useCurrentPage } from './use-current-page';
import { useKeepPageOnLayout } from './use-page-layout';
import type { PdfLoaded, PdfViewGeometry } from './use-pdf-view-geometry';
import { useReadingProgress } from './use-reading-progress';

/** Where the reader is: reading progress, the current page, moving to a page, and reading it out */
export function usePdfReadingPosition(
  context: DocViewerContextValue,
  { document, numPages }: PdfLoaded,
  view: PdfViewGeometry
) {
  const { scrollRoot, horizontal, viewport, scale, rotation } = view;
  const progress = useReadingProgress({
    scrollRoot,
    document,
    numPages,
    horizontal,
    viewport,
    events: context.events,
  });
  const { currentPage, registerPage, scrollToPage, resumeScroll } = useCurrentPage(
    scrollRoot,
    horizontal,
    viewport,
    progress.sample
  );
  useKeepPageOnLayout(view.layout, currentPage, scrollToPage);
  const [pageAnnouncement, announce] = useAnnouncement();

  /** Moves to a page, and reads it out unless something else already does (the thumbnails) */
  const goToPage = (
    page: number,
    withAnnouncement = true,
    top?: number,
    behavior?: 'smooth' | 'instant'
  ) => {
    scrollToPage(
      page,
      top === undefined
        ? undefined
        : (pageHeight) => getPointOffset(Math.max(top, 0), scale, rotation, pageHeight),
      behavior === 'instant'
    );
    withAnnouncement && announce(context.labels.pageOf(page, numPages));
  };

  return {
    progress,
    currentPage,
    registerPage,
    scrollToPage,
    resumeScroll,
    pageAnnouncement,
    announce,
    goToPage,
  };
}

export type PdfReadingPosition = ReturnType<typeof usePdfReadingPosition>;
