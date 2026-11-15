import React from 'react';
import type { PdfSession } from '../DocViewerRoot/pdf-session-context';
import { PdfOutline, usePdfOutline } from './PdfOutline';

/** The outline of the session's document, nothing while it loads or when the document has none */
export function SessionOutline({ session }: { session: PdfSession }) {
  const document = session.loaded.ready!.document;
  const outline = usePdfOutline(document);
  if (!outline || outline.length === 0) {
    return null;
  }
  return <PdfOutline document={document} items={outline} onSelect={session.position.goToPage} />;
}
