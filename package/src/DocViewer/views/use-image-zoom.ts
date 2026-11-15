import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clampZoom } from '../zoom';
import {
  applyAnchor,
  getAnchor,
  getWheelScale,
  ImageZoom,
  isOverflowing,
  ZoomAnchor,
} from './image-zoom';

interface ImageZoomInput {
  stage: HTMLElement | null;
  defaultZoom: ImageZoom;
  fitScale: number;

  /** Changes that resize the image, after which the anchor point is put back */
  layoutKey: unknown;
}

/**
 * Zoom of the image, keeping the point under the pointer (or the middle of the view) in place,
 * with pinch and Ctrl+wheel zoom
 */
export function useImageZoom({ stage, defaultZoom, fitScale, layoutKey }: ImageZoomInput) {
  const [zoom, setZoom] = useState<ImageZoom>(defaultZoom);
  const [overflowing, setOverflowing] = useState(false);
  const pendingAnchor = useRef<ZoomAnchor | null>(null);
  const scale = zoom === 'fit' ? fitScale : zoom;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const zoomTo = useCallback(
    (next: ImageZoom, clientX?: number, clientY?: number) => {
      if (stage) {
        pendingAnchor.current = getAnchor(stage, clientX, clientY);
      }
      setZoom(next === 'fit' ? next : clampZoom(next));
    },
    [stage]
  );

  // Put the anchor point back once the new size has been laid out
  useLayoutEffect(() => {
    if (!stage) {
      return;
    }

    const anchor = pendingAnchor.current;
    if (anchor) {
      pendingAnchor.current = null;
      applyAnchor(stage, anchor);
    }
    setOverflowing(isOverflowing(stage));
  }, [stage, scale, layoutKey]);

  // Pinch on a trackpad arrives as a wheel event with ctrlKey set
  useEffect(() => {
    if (!stage) {
      return undefined;
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        zoomTo(getWheelScale(scaleRef.current, event.deltaY), event.clientX, event.clientY);
      }
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [stage, zoomTo]);

  return { zoom, scale, zoomTo, overflowing };
}
