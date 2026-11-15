import { useCallback, useEffect, useState } from 'react';
import { useDocViewerContext } from '../../doc-viewer.context';
import type { Size } from '../../utils/image-fit';

/** Load state of the image, and the document events that follow from it */
export function useImageLoad() {
  const { src, events, mimeType } = useDocViewerContext();
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const [failed, setFailed] = useState(false);

  // With keepView the image is not remounted: a new src gets another try after a failure
  useEffect(() => setFailed(false), [src]);

  // A server-rendered image can finish loading before React attaches onLoad
  const checkLoaded = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) {
      setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
    }
  }, []);

  const onLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  }, []);

  const onError = useCallback(() => setFailed(true), []);

  useEffect(() => {
    if (naturalSize && !failed) {
      events.onDocumentLoad({ type: 'image', ...naturalSize, mimeType });
    }
  }, [naturalSize, failed, events, mimeType]);

  useEffect(() => {
    if (failed) {
      events.onDocumentError(new Error(`Image could not be loaded: ${src}`));
    }
  }, [failed, events, src]);

  return {
    naturalSize,
    failed,
    ready: naturalSize !== null && !failed,
    checkLoaded,
    onLoad,
    onError,
  };
}
