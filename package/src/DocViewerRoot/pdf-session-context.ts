import { createContext, use } from 'react';
import type { getLoaded, PdfDocumentState } from '../hooks/pdf/use-pdf-document';
import type { PdfModes } from '../hooks/pdf/use-pdf-modes';
import type { PdfPageContent } from '../hooks/pdf/use-pdf-page-content';
import type { PdfPageTurns } from '../hooks/pdf/use-pdf-page-turns';
import type { PdfReadingPosition } from '../hooks/pdf/use-pdf-reading-position';
import type { PdfViewActions } from '../hooks/pdf/use-pdf-view-actions';
import type { PdfViewGeometry } from '../hooks/pdf/use-pdf-view-geometry';

/** The PDF session the PDF parts are views on */
export interface PdfSession {
  state: PdfDocumentState;
  loaded: ReturnType<typeof getLoaded>;
  view: PdfViewGeometry;
  position: PdfReadingPosition;
  content: PdfPageContent;
  turns: PdfPageTurns;
  actions: PdfViewActions;
  modes: PdfModes;
}

export const PdfSessionContext = createContext<PdfSession | null>(null);

/** The PDF session, null outside a PDF */
export function usePdfSession() {
  return use(PdfSessionContext);
}

/** The PDF session once the document is loaded, null before and outside a PDF */
export function useReadyPdfSession() {
  const session = use(PdfSessionContext);
  return session?.loaded.ready ? session : null;
}
