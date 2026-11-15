import { useCallbackRef, useUncontrolled } from '@mantine/hooks';
import { useEffect, useRef } from 'react';
import type { DocViewerEvents, DocViewerZoom } from './controller';
import { clampZoom } from './zoom';

interface ZoomSettingInput {
  /** The zoom the app controls (`zoom`) */
  value: DocViewerZoom | undefined;

  /** The zoom to start with (`defaultZoom`) */
  defaultValue: DocViewerZoom;

  /** The document is shown, so the scale a zoom gives it is known */
  ready: boolean;

  /** The scale a zoom gives the document in the view now, 1 is 100% */
  scaleOf: (zoom: DocViewerZoom) => number;
  onZoomChange: Required<DocViewerEvents>['onZoomChange'];
}

/** A requested zoom as it is kept and reported: scales within the zoom range */
export function normalizeZoom(zoom: DocViewerZoom): DocViewerZoom {
  return typeof zoom === 'number' ? clampZoom(zoom) : zoom;
}

/**
 * The zoom of a PDF or image, controlled (`zoom`) or not (`defaultZoom`), and the scale it gives.
 * `onZoomChange` hears the zoom and its scale whenever either changes, a fitted scale after a
 * resize too. A controlled viewer reports a request at once, with the scale it would give, and
 * shows it once the app passes it back
 */
export function useZoomSetting({
  value,
  defaultValue,
  ready,
  scaleOf,
  onZoomChange,
}: ZoomSettingInput) {
  const [zoom, setUncontrolled, controlled] = useUncontrolled<DocViewerZoom>({
    value,
    defaultValue,
    finalValue: 'fit',
  });
  const scale = scaleOf(zoom);
  const reported = useRef('');

  /** Calls onZoomChange, once for each zoom and scale */
  const report = (next: DocViewerZoom, nextScale: number) => {
    const key = `${next}:${nextScale}`;
    if (key !== reported.current) {
      reported.current = key;
      onZoomChange(next, { scale: nextScale });
    }
  };

  useEffect(() => {
    ready && report(zoom, scale);
    // report reads the ref and the stable onZoomChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, zoom, scale]);

  // Stable, so listeners that zoom (the wheel) stay attached
  const setZoom = useCallbackRef((next: DocViewerZoom) => {
    const normalized = normalizeZoom(next);
    if (controlled) {
      ready && report(normalized, scaleOf(normalized));
    } else {
      setUncontrolled(normalized);
    }
  });

  return { zoom, scale, setZoom };
}
