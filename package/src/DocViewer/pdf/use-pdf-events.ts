import { useEffect, useRef } from 'react';
import type { DocViewerEvents } from '../controller';
import { clampPage } from './geometry';
import type { PdfDocumentState } from './use-pdf-document';

interface PdfEventsInput {
  state: PdfDocumentState;
  events: Required<DocViewerEvents>;
  currentPage: number;
  scale: number;
  fitted: boolean;
}

/** Calls the load, error, page and zoom events. Returns the page last reported */
export function usePdfEvents({ state, events, currentPage, scale, fitted }: PdfEventsInput) {
  const ready = state.status === 'ready';
  const pageReported = useRef(0);

  useEffect(() => {
    if (state.status === 'ready') {
      events.onDocumentLoad({ type: 'pdf', numPages: state.document.numPages });
    } else if (state.status === 'error') {
      events.onDocumentError(state.error);
    }
  }, [state, events]);

  useEffect(() => {
    if (ready && currentPage !== pageReported.current) {
      pageReported.current = currentPage;
      events.onPageChange(currentPage);
    }
  }, [ready, currentPage, events]);

  useEffect(() => {
    ready && events.onZoomChange(scale, fitted);
  }, [ready, scale, fitted, events]);

  return pageReported;
}

interface PageSyncInput {
  numPages: number;

  /** True once the pages are laid out and can be scrolled to */
  laidOut: boolean;
  page: number | undefined;
  defaultPage: number | undefined;
  pageReported: React.RefObject<number>;
  scrollToPage: (page: number) => void;
}

/** Scrolls to `defaultPage` once the pages are laid out, then to `page` whenever it changes */
export function usePageSync({
  numPages,
  laidOut,
  page,
  defaultPage,
  pageReported,
  scrollToPage,
}: PageSyncInput) {
  const initialPage = page ?? defaultPage;

  useEffect(() => {
    if (laidOut && initialPage && initialPage > 1) {
      scrollToPage(clampPage(initialPage, numPages));
    }
    // Only when the pages are first laid out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laidOut]);

  useEffect(() => {
    if (laidOut && page && page !== pageReported.current) {
      scrollToPage(clampPage(page, numPages));
    }
    // Only when the page prop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
}
