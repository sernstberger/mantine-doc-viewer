import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerLoading, DocViewerMessage } from '../DocViewerMessage/MessageView';
import { PdfPassword } from './PdfPassword';
import type { PdfDocumentState } from '../hooks/pdf/use-pdf-document';

/** What the body shows before the PDF is ready: loading, a password form or an error */
export function PdfStatus({ state }: { state: PdfDocumentState }) {
  const { labels } = useDocViewerContext();

  switch (state.status) {
    case 'loading':
      return <DocViewerLoading />;
    case 'password':
      return <PdfPassword incorrect={state.incorrect} onSubmit={state.submit} />;
    case 'error':
      return (
        <DocViewerMessage withDownload error>
          {state.reason === 'worker' ? labels.pdfWorkerMissing : labels.pdfError}
        </DocViewerMessage>
      );
    default:
      return null;
  }
}
