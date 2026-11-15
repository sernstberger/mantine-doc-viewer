import { useCallbackRef, useIsomorphicEffect } from '@mantine/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DocViewerEvents, DocViewerZoom } from '../use-controller-registry';
import { useZoomSetting } from '../use-zoom-setting';
import { clampZoom } from '../../utils/zoom';
import {
  applyAnchor,
  getAnchor,
  getWheelScale,
  ImageZoom,
  isOverflowing,
  ZoomAnchor,
} from '../../utils/image-zoom';

interface ImageZoomInput {
  stage: HTMLElement | null;

  /** The zoom the app controls (`zoom`) */
  zoom: DocViewerZoom | undefined;
  defaultZoom: DocViewerZoom;
  fitScale: number;

  /** The image has loaded, so its scale is known */
  ready: boolean;
  onZoomChange: Required<DocViewerEvents>['onZoomChange'];

  /** Changes that resize the image, after which the anchor point is put back */
  layoutKey: unknown;

  /** Called with each zoom request, from keys, buttons, the wheel or the app */
  onZoom: () => void;
}

/**
 * Zoom of the image, keeping the point under the pointer (or the middle of the view) in place,
 * with pinch and Ctrl+wheel zoom
 */
export function useImageZoom(input: ImageZoomInput) {
  const { stage, fitScale, layoutKey, onZoom } = input;
  const setting = useZoomSetting({
    value: input.zoom,
    defaultValue: input.defaultZoom,
    ready: input.ready,
    scaleOf: (zoom) => (typeof zoom === 'number' ? clampZoom(zoom) : fitScale),
    onZoomChange: input.onZoomChange,
  });
  const { scale, setZoom } = setting;
  const zoom: ImageZoom = typeof setting.zoom === 'number' ? scale : 'fit';
  const [overflowing, setOverflowing] = useState(false);
  const pendingAnchor = useRef<ZoomAnchor | null>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const handleZoom = useCallbackRef(onZoom);

  const zoomTo = useCallback(
    (next: DocViewerZoom, clientX?: number, clientY?: number) => {
      if (stage) {
        pendingAnchor.current = getAnchor(stage, clientX, clientY);
      }
      handleZoom();
      setZoom(next);
    },
    [stage, handleZoom, setZoom]
  );

  useIsomorphicEffect(() => {
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
