import { Loader } from '@mantine/core';
import React from 'react';
import { DocViewerMessage } from '../views/MessageView';
import { formatFileSize, TextDocumentState } from './use-text-document';

/** Loading, error and too-large messages shared by the text, code and markdown views */
export function TextStatus({ state }: { state: TextDocumentState }) {
  if (state.status === 'loading') {
    return (
      <DocViewerMessage>
        <Loader size="sm" aria-label="Loading document" />
      </DocViewerMessage>
    );
  }

  if (state.status === 'too-large') {
    return (
      <DocViewerMessage withDownload>
        This file is too large to preview ({formatFileSize(state.size)})
      </DocViewerMessage>
    );
  }

  if (state.status === 'error') {
    return <DocViewerMessage withDownload>This file could not be loaded</DocViewerMessage>;
  }

  return null;
}
