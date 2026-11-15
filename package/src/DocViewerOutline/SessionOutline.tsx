import type { PDFDocumentProxy } from 'pdfjs-dist';
import React from 'react';
import { PdfOutline, usePdfOutline } from './PdfOutline';

type OutlineProps = Omit<React.ComponentProps<typeof PdfOutline>, 'items'>;

/** The outline of a document, nothing while it loads or when the document has none */
function SessionOutlineView({ document, ...props }: OutlineProps & { document: PDFDocumentProxy }) {
  const outline = usePdfOutline(document);
  if (!outline || outline.length === 0) {
    return null;
  }
  return <PdfOutline document={document} items={outline} {...props} />;
}

/** Memoised: it only renders again for another document, handler or styles, not for each session render */
export const SessionOutline = React.memo(SessionOutlineView);
