import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerLoading, DocViewerMessage } from './MessageView';

/** Loading spinner or error message over the stage until the image is ready */
export function ImageOverlay({ failed }: { failed: boolean }) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <div {...getStyles('imageOverlay')}>
      {failed ? (
        <DocViewerMessage withDownload error>
          {labels.imageError}
        </DocViewerMessage>
      ) : (
        <DocViewerLoading />
      )}
    </div>
  );
}
