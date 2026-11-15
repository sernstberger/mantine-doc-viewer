import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerLoading } from '../DocViewerLoading/DocViewerLoading';
import { DocViewerMessage } from '../DocViewerMessage/DocViewerMessage';
import { PdfPassword } from './PdfPassword';
import type { DocViewerPasswordInputProps } from '../doc-viewer.types';
import type { PdfDocumentState } from '../hooks/pdf/use-pdf-document';

/** What the body shows before the PDF is ready: loading, a password form or an error */
export function PdfStatus({
  state,
  passwordInputProps,
}: {
  state: PdfDocumentState;
  passwordInputProps?: DocViewerPasswordInputProps;
}) {
  const { labels } = useDocViewerContext();

  switch (state.status) {
    case 'loading':
      return <DocViewerLoading />;
    case 'password':
      return (
        <PdfPassword
          incorrect={state.incorrect}
          onSubmit={state.submit}
          inputProps={passwordInputProps}
        />
      );
    case 'error':
      return (
        <DocViewerMessage withDownload error>
          {state.reason === 'worker' ? labels.pdfWorkerMissingLabel : labels.pdfErrorLabel}
        </DocViewerMessage>
      );
    default:
      return null;
  }
}
