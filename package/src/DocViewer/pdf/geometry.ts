import type { DocViewerPageLayout } from '../DocViewer';
import type { PdfRotation } from './render-page';
import { getFitWidthScale, PdfZoom } from './zoom';

/** A page number within the document, from 1 to `numPages` */
export function clampPage(page: number, numPages: number) {
  return Math.min(Math.max(Math.round(page), 1), Math.max(numPages, 1));
}

export interface ScaleInput {
  zoom: PdfZoom;
  twoPages: boolean;
  bodyWidth: number;
  columnGap: number;

  /** Width of a page at scale 1, after rotation */
  pageWidth: number;
}

/** Scale of the pages: the zoom, or the scale that fits one page (or two side by side) to the width */
export function computeScale({ zoom, twoPages, bodyWidth, columnGap, pageWidth }: ScaleInput) {
  if (zoom !== 'fit-width') {
    return zoom;
  }

  return twoPages
    ? getFitWidthScale(bodyWidth - columnGap, pageWidth * 2)
    : getFitWidthScale(bodyWidth, pageWidth);
}

export function nextRotation(rotation: PdfRotation): PdfRotation {
  return ((rotation + 90) % 360) as PdfRotation;
}

/** Layout after the two pages button: single, or two pages in the flavour the viewer opened with */
export function toggleTwoPages(
  layout: DocViewerPageLayout,
  defaultLayout: DocViewerPageLayout | undefined
): DocViewerPageLayout {
  if (layout !== 'single') {
    return 'single';
  }

  return defaultLayout === 'two-page-cover' ? 'two-page-cover' : 'two-page';
}

/** Thumbnails strip direction, and whether they come before the pages in the DOM so focus order follows the layout */
export function getThumbnailsLayout(position: 'left' | 'right' | 'top' | 'bottom') {
  return {
    orientation:
      position === 'top' || position === 'bottom' ? ('horizontal' as const) : ('vertical' as const),
    first: position === 'left' || position === 'top',
  };
}

export interface VisibleBox {
  page: number;
  top: number;
  bottom: number;
}

/** Page with the most visible height inside the view, 0 when none is visible */
export function getMostVisiblePage(boxes: VisibleBox[], viewTop: number, viewBottom: number) {
  let best = 0;
  let bestHeight = 0;
  boxes.forEach(({ page, top, bottom }) => {
    const height = Math.min(bottom, viewBottom) - Math.max(top, viewTop);
    if (height > bestHeight) {
      best = page;
      bestHeight = height;
    }
  });
  return best;
}
