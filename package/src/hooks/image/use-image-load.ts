import { useCallback, useEffect, useState } from 'react';
import { useDocViewerContext } from '../../doc-viewer.context';
import type { Size } from '../../utils/image-fit';
import { useDocViewerView } from '../view/use-doc-viewer-view';

/** Load state of the image, and the document events that follow from it */
export function useImageLoad() {
  const { src } = useDocViewerContext();
  const { onLoad: reportLoad, onError: reportError } = useDocViewerView();
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  // Workaround: a server-rendered image can finish loading before React attaches onLoad
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
      reportLoad({ type: 'image', ...naturalSize });
    }
  }, [naturalSize, failed, reportLoad]);

  useEffect(() => {
    if (failed) {
      reportError(new Error(`Image could not be loaded: ${src}`));
    }
  }, [failed, reportError, src]);

  return {
    naturalSize,
    failed,
    ready: naturalSize !== null && !failed,
    checkLoaded,
    onLoad,
    onError,
  };
}
