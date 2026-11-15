import { Anchor, Loader, VisuallyHidden } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';

interface DocViewerMessageProps {
  children: React.ReactNode;
  withDownload?: boolean;

  /** Announces the message straight away, for errors */
  error?: boolean;
}

/** Centered message inside the body, used for loading, errors and unsupported types */
export function DocViewerMessage({ children, withDownload, error }: DocViewerMessageProps) {
  const { getStyles, src, fileName, labels } = useDocViewerContext();

  return (
    <div {...getStyles('empty')} role={error ? 'alert' : 'status'}>
      {children}
      {withDownload && (
        <Anchor
          href={src}
          download={fileName ?? true}
          // Browsers ignore download for other origins and open the file instead, so not in place of the app
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
        >
          {labels.downloadFile}
        </Anchor>
      )}
    </div>
  );
}

/** Spinner with text for screen readers, a label on the spinner itself is not read out */
export function DocViewerLoading() {
  const { labels } = useDocViewerContext();

  return (
    <DocViewerMessage>
      <Loader size="sm" />
      <VisuallyHidden>{labels.loading}</VisuallyHidden>
    </DocViewerMessage>
  );
}
