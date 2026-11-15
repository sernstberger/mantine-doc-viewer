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

/** The zoom as props and events name it, for a PDF zoom */
export function fromPdfZoom(zoom: PdfZoom): DocViewerZoom {
  return zoom === 'fit-width' ? 'fit' : zoom;
}

/** Space kept around pages when the padding of the `pages` element cannot be read, 16px a side by default */
export const PAGES_GUTTER = 32;

/** Space taken by the padding of the `pages` element, in px: left and right, top and bottom */
export interface PagesGutter {
  x: number;
  y: number;
}

export const DEFAULT_PAGES_GUTTER: PagesGutter = { x: PAGES_GUTTER, y: PAGES_GUTTER };

export function getFitWidthScale(containerWidth: number, pageWidth: number, gutter = PAGES_GUTTER) {
  if (containerWidth <= 0 || pageWidth <= 0) {
    return 1;
  }

  return Math.max(MIN_ZOOM, (containerWidth - gutter) / pageWidth);
}
