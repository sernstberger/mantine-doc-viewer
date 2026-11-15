import { MIN_ZOOM } from '../zoom';

export type PdfZoom = number | 'fit-width';

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
