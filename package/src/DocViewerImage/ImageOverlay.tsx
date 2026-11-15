import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerLoading } from '../DocViewerLoading/DocViewerLoading';
import { DocViewerMessage } from '../DocViewerMessage/DocViewerMessage';

/** Loading spinner or error message over the stage until the image is ready */
export function ImageOverlay({ failed }: { failed: boolean }) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <div {...getStyles('imageOverlay')}>
      {failed ? (
        <DocViewerMessage withDownload error>
          {labels.imageErrorLabel}
        </DocViewerMessage>
      ) : (
        <DocViewerLoading />
      )}
    </div>
  );
}
