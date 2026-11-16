import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerLoading } from '../DocViewerLoading/DocViewerLoading';
import { DocViewerMessage } from '../DocViewerMessage/DocViewerMessage';
import type { DocViewerImageProps } from './DocViewerImage';

/** Loading spinner or error message over the stage until the image is ready */
export function ImageOverlay({
  failed,
  classNames,
  styles,
}: Pick<DocViewerImageProps, 'classNames' | 'styles'> & { failed: boolean }) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <div {...getStyles('imageOverlay', { classNames, styles })}>
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
