import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useMemo, useRef } from 'react';
import type { DocViewerEvents } from '../use-controller-registry';
import { createLinkService } from '../../utils/link-service';

interface LinkServiceInput {
  document: PDFDocumentProxy | null;
  currentPage: number;
  scale: number;
  scrollToPage: (page: number, offset?: number) => void;
  events: Required<DocViewerEvents>;
}

/** Link service for the document's link layers, made once per document and reading the latest state */
export function useLinkService({
  document,
  currentPage,
  scale,
  scrollToPage,
  events,
}: LinkServiceInput) {
  const latest = useRef({ currentPage, scale, scrollToPage });
  latest.current = { currentPage, scale, scrollToPage };

  return useMemo(
    () =>
      document
        ? createLinkService(document, {
            numPages: document.numPages,
            getCurrentPage: () => latest.current.currentPage,
            goToDestination: ({ page, top }) =>
              latest.current.scrollToPage(page, (top ?? 0) * latest.current.scale),
            onLinkClick: (url, event) => events.onLinkClick(url, event),
          })
        : undefined,
    [document, events]
  );
}
