import type { DocViewerZoom } from '../controller';
import { clampZoom, MIN_ZOOM } from '../zoom';

/** Zoom of PDF pages: a scale, fit to the width of the view, or fit whole pages (or spreads) */
export type PdfZoom = number | 'fit-width' | 'fit-page';

/** The PDF zoom for a zoom from props or the controller */
export function toPdfZoom(zoom: DocViewerZoom): PdfZoom {
  if (zoom === 'fit') {
    return 'fit-width';
  }
  return zoom === 'fit-page' ? zoom : clampZoom(zoom);
}

/** Horizontal space kept around pages, must match padding of the `pages` element */
export const PAGES_GUTTER = 32;

export function getFitWidthScale(containerWidth: number, pageWidth: number) {
  if (containerWidth <= 0 || pageWidth <= 0) {
    return 1;
  }

  return Math.max(MIN_ZOOM, (containerWidth - PAGES_GUTTER) / pageWidth);
}
