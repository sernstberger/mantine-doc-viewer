import { MIN_ZOOM } from '../zoom';

export type PdfZoom = number | 'fit-width';

/** Horizontal space kept around pages, must match padding of the `pages` element */
export const PAGES_GUTTER = 32;

export function getFitWidthScale(containerWidth: number, pageWidth: number) {
  if (containerWidth <= 0 || pageWidth <= 0) {
    return 1;
  }

  return Math.max(MIN_ZOOM, (containerWidth - PAGES_GUTTER) / pageWidth);
}
