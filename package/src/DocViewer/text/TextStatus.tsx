import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerLoading, DocViewerMessage } from '../views/MessageView';
import { formatFileSize, TextDocumentState } from './use-text-document';

/** Loading, error and too-large messages shared by the text, code and markdown views */
export function TextStatus({ state }: { state: TextDocumentState }) {
  const { labels, locale } = useDocViewerContext();

  if (state.status === 'loading') {
    return <DocViewerLoading />;
  }

  if (state.status === 'too-large') {
    return (
      <DocViewerMessage withDownload error>
        {labels.tooLarge(formatFileSize(state.size, locale))}
      </DocViewerMessage>
    );
  }

  if (state.status === 'error') {
    return (
      <DocViewerMessage withDownload error>
        {labels.textError}
      </DocViewerMessage>
    );
  }

  return null;
}
