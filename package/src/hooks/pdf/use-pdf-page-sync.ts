import type { DocViewerContextValue } from '../../doc-viewer.context';
import { useKeepScroll } from '../keep-scroll';
import { isLaidOut } from '../../utils/geometry';
import { useAutoAdvance } from './use-auto-advance';
import type { PdfDocumentState } from './use-pdf-document';
import { usePageSync, usePdfEvents } from './use-pdf-events';
import type { PdfReadingPosition } from './use-pdf-reading-position';
import type { PdfLoaded, PdfViewGeometry } from './use-pdf-view-geometry';

interface PdfPageSyncInput {
  context: DocViewerContextValue;
  state: PdfDocumentState;
  loaded: PdfLoaded;
  view: PdfViewGeometry;
  position: PdfReadingPosition;
  /** The page editor is open */
  editing: boolean;
}

/**
 * Keeps the page in step with the app: reports page changes, goes to the page the app
 * asks for, keeps the scroll position across reloads, and moves on by itself (`autoAdvance`)
 */
export function usePdfPageSync({
  context,
  state,
  loaded,
  view,
  position,
  editing,
}: PdfPageSyncInput) {
  const { numPages } = loaded;
  const { currentPage, scrollToPage, goToPage } = position;
  const pageReported = usePdfEvents({
    state,
    events: context.events,
    currentPage,
    mimeType: context.mimeType,
  });
  // The document's pages are in place in the scroll area
  const laidOut = isLaidOut(loaded.ready, view.scrollRoot, view.pagesNode);
  usePageSync({
    numPages,
    laidOut,
    page: context.page,
    defaultPage: context.defaultPage,
    pageReported,
    scrollToPage,
  });

  useKeepScroll(view.scrollRoot, laidOut, context.src, context.keepView);

  useAutoAdvance({
    autoAdvance: view.reading && !editing ? context.autoAdvance : undefined,
    currentPage,
    numPages,
    layout: view.layout,
    goToPage: (page) => goToPage(page, false),
  });
}
