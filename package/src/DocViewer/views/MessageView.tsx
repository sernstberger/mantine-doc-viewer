import { Anchor } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';

interface DocViewerMessageProps {
  children: React.ReactNode;
  withDownload?: boolean;
}

/** Centered message inside the body, used for loading, errors and unsupported types */
export function DocViewerMessage({ children, withDownload }: DocViewerMessageProps) {
  const { getStyles, src, fileName } = useDocViewerContext();

  return (
    <div {...getStyles('empty')}>
      {children}
      {withDownload && (
        <Anchor href={src} download={fileName ?? true} size="sm">
          Download file
        </Anchor>
      )}
    </div>
  );
}
