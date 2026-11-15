import { useEffect } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { useRegisterController } from '../controller';
import { zoomIn, zoomOut } from '../zoom';
import type { DocViewerZoom } from '../controller';
import type { ImageZoom } from './image-zoom';

interface ImageControllerInput {
  ready: boolean;
  scale: number;
  zoom: ImageZoom;
  zoomTo: (zoom: DocViewerZoom) => void;
  rotate: () => void;
  print: () => Promise<void>;
}

/** Exposes the image to the imperative controller and reports zoom changes */
export function useImageController({
  ready,
  scale,
  zoom,
  zoomTo,
  rotate,
  print,
}: ImageControllerInput) {
  const { controller, events } = useDocViewerContext();

  useEffect(() => {
    if (ready) {
      events.onZoomChange(scale, zoom === 'fit');
    }
  }, [ready, scale, zoom, events]);

  useRegisterController(controller, {
    setZoom: (next) => zoomTo(next),
    zoomIn: () => zoomTo(zoomIn(scale)),
    zoomOut: () => zoomTo(zoomOut(scale)),
    rotate,
    print,
    isPrintable: () => ready,
  });
}
