import { useDebouncedCallback } from '@mantine/hooks';
import { useEffect, useRef } from 'react';
import { useDocViewerContext } from './DocViewer.context';
import { formatPercent } from './format';

/** Quiet time after the last zoom step before the zoom is read out, so a wheel or pinch says it once */
export const ZOOM_ANNOUNCE_DELAY = 400;

/**
 * Reads out the zoom after the reader (or the app) zooms, through `announce` (a status region).
 * Call the returned function with each zoom request; fit zoom that follows a resize stays silent
 */
export function useZoomAnnouncement(scale: number, announce: (message: string) => void) {
  const { labels, locale } = useDocViewerContext();
  const requested = useRef(false);
  const say = useDebouncedCallback(
    (value: number) => announce(labels.zoomLevel(formatPercent(value, locale))),
    ZOOM_ANNOUNCE_DELAY
  );

  useEffect(() => {
    if (requested.current) {
      requested.current = false;
      say(scale);
    }
  }, [scale, say]);

  return () => {
    requested.current = true;
  };
}

/** `setZoom` that reads out the zoom it leads to, with useZoomAnnouncement */
export function useAnnouncedZoom<Zoom>(
  scale: number,
  setZoom: (zoom: Zoom) => void,
  announce: (message: string) => void
) {
  const markZoom = useZoomAnnouncement(scale, announce);
  return (zoom: Zoom) => {
    markZoom();
    setZoom(zoom);
  };
}
