import { useCallbackRef, useUncontrolled } from '@mantine/hooks';
import { useEffect, useRef } from 'react';
import type { DocViewerEvents, DocViewerZoom } from './use-controller-registry';
import { updateDocViewerStateAction, type DocViewerStore } from '../doc-viewer.store';
import { clampZoom } from '../utils/zoom';

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

  /** The store that gets the zoom and scale shown, for the zoom controls */
  store: DocViewerStore;
}

/** A requested zoom as it is kept and reported: scales within the zoom range */
export function normalizeZoom(zoom: DocViewerZoom): DocViewerZoom {
  return typeof zoom === 'number' ? clampZoom(zoom) : zoom;
}

/**
 * The zoom of a PDF or image, controlled (`zoom`) or not (`defaultZoom`), and the scale it gives.
 * `onZoomChange` hears the zoom and its scale whenever either changes, a fitted scale after a
 * resize too. A controlled viewer reports every request at once (like Mantine's `useUncontrolled`),
 * with the scale it would give, and shows it once the app passes it back
 */
export function useZoomSetting({
  value,
  defaultValue,
  ready,
  scaleOf,
  onZoomChange,
  store,
}: ZoomSettingInput) {
  const [zoom, setUncontrolled, controlled] = useUncontrolled<DocViewerZoom>({
    value,
    defaultValue,
    finalValue: 'fit',
  });
  const scale = scaleOf(zoom);
  const reported = useRef('');

  /** Calls onZoomChange for a zoom and scale, and remembers it so its echo is not reported again */
  const report = (next: DocViewerZoom, nextScale: number) => {
    reported.current = `${next}:${nextScale}`;
    onZoomChange(next, { scale: nextScale });
  };

  // The zoom shown changed: report it unless it is the echo of a request already reported
  useEffect(() => {
    if (ready && `${zoom}:${scale}` !== reported.current) {
      report(zoom, scale);
    }
    // report reads the ref and the stable onZoomChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, zoom, scale]);

  useEffect(() => {
    ready && updateDocViewerStateAction({ zoom, scale }, store);
  }, [ready, zoom, scale, store]);

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
