import { useDocViewerContext } from '../../doc-viewer.context';
import { useRegisterController, type DocViewerZoom } from '../use-controller-registry';
import { zoomIn, zoomOut } from '../../utils/zoom';

interface ImageControllerInput {
  ready: boolean;
  scale: number;
  zoomTo: (zoom: DocViewerZoom) => void;
  rotate: () => void;
  print: () => Promise<void>;
}

/** Exposes the image to the imperative controller */
export function useImageController({ ready, scale, zoomTo, rotate, print }: ImageControllerInput) {
  const { controller } = useDocViewerContext();

  useRegisterController(controller, {
    setZoom: (next) => zoomTo(next),
    zoomIn: () => zoomTo(zoomIn(scale)),
    zoomOut: () => zoomTo(zoomOut(scale)),
    rotate,
    print,
    isPrintable: () => ready,
  });
}
