import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerLoading, DocViewerMessage } from '../DocViewerMessage/MessageView';
import { formatFileSize, DocViewerTextState } from '../hooks/text/use-doc-viewer-text';

/** Loading, error and too-large messages shared by the text, code and markdown views */
export function TextStatus({ state }: { state: DocViewerTextState }) {
  const { labels, locale } = useDocViewerContext();

  if (state.status === 'loading') {
    return <DocViewerLoading />;
  }

  if (state.status === 'too-large') {
    return (
      <DocViewerMessage withDownload error>
        {labels.tooLargeLabel(formatFileSize(state.size, locale))}
      </DocViewerMessage>
    );
  }

  if (state.status === 'error') {
    return (
      <DocViewerMessage withDownload error>
        {labels.textErrorLabel}
      </DocViewerMessage>
    );
  }

  return null;
}
