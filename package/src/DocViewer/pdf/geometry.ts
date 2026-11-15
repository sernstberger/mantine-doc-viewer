import type { DocViewerPageLayout } from '../DocViewer';
import type { PdfRotation } from './render-page';
import { getFitWidthScale, PdfZoom } from './zoom';

/** A page number within the document, from 1 to `numPages` */
export function clampPage(page: number, numPages: number) {
  return Math.min(Math.max(Math.round(page), 1), Math.max(numPages, 1));
}

export function isTwoPages(layout: DocViewerPageLayout) {
  return layout === 'two-page' || layout === 'two-page-cover';
}

/** Horizontal and wrapped layouts fit pages to the height of the view, so several show at once */
export function fitsToHeight(layout: DocViewerPageLayout) {
  return layout === 'horizontal' || layout === 'wrapped';
}

export interface ScaleInput {
  zoom: PdfZoom;
  layout: DocViewerPageLayout;
  bodyWidth: number;
  bodyHeight: number;
  columnGap: number;

  /** Size of a page at scale 1, after rotation */
  pageWidth: number;
  pageHeight: number;
}

/** Scale of the pages: the zoom, or the scale that fits the layout to the view */
export function computeScale(input: ScaleInput) {
  const { zoom, layout, bodyWidth, bodyHeight, columnGap, pageWidth, pageHeight } = input;
  if (typeof zoom === 'number') {
    return zoom;
  }
  const byHeight = getFitWidthScale(bodyHeight, pageHeight);
  if (fitsToHeight(layout)) {
    return byHeight;
  }
  const byWidth = isTwoPages(layout)
    ? getFitWidthScale(bodyWidth - columnGap, pageWidth * 2)
    : getFitWidthScale(bodyWidth, pageWidth);
  // A whole page, or a whole spread, fits both ways
  return zoom === 'fit-page' ? Math.min(byWidth, byHeight) : byWidth;
}

/** Scale that fits a whole page in the view, for presentations */
export function computeFitPageScale(
  bodyWidth: number,
  bodyHeight: number,
  pageWidth: number,
  pageHeight: number
) {
  return Math.min(getFitWidthScale(bodyWidth, pageWidth), getFitWidthScale(bodyHeight, pageHeight));
}

const PRESENTATION_KEYS: Record<string, 'next' | 'previous' | 'first' | 'last' | 'exit'> = {
  ArrowRight: 'next',
  ArrowDown: 'next',
  PageDown: 'next',
  ' ': 'next',
  Enter: 'next',
  ArrowLeft: 'previous',
  ArrowUp: 'previous',
  PageUp: 'previous',
  Backspace: 'previous',
  Home: 'first',
  End: 'last',
  Escape: 'exit',
};

/** Page a key moves to in a presentation, 'exit' for Escape, or null for other keys */
export function getPresentationTarget(
  key: string,
  page: number,
  numPages: number
): number | 'exit' | null {
  const action = PRESENTATION_KEYS[key];
  const pages = { next: page + 1, previous: page - 1, first: 1, last: numPages };
  if (!action) {
    return null;
  }
  return action === 'exit' ? 'exit' : clampPage(pages[action], numPages);
}

export function nextRotation(rotation: PdfRotation): PdfRotation {
  return ((rotation + 90) % 360) as PdfRotation;
}

/** Thumbnails strip direction, and whether they come before the pages in the DOM so focus order follows the layout */
export function getThumbnailsLayout(position: 'left' | 'right' | 'top' | 'bottom') {
  return {
    orientation:
      position === 'top' || position === 'bottom' ? ('horizontal' as const) : ('vertical' as const),
    first: position === 'left' || position === 'top',
  };
}

export interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface VisibleBox extends Box {
  page: number;
}

/** Page with the most visible area inside the view, 0 when none is visible */
export function getMostVisiblePage(boxes: VisibleBox[], view: Box) {
  let best = 0;
  let bestArea = 0;
  boxes.forEach((box) => {
    const height = Math.min(box.bottom, view.bottom) - Math.max(box.top, view.top);
    const width = Math.min(box.right, view.right) - Math.max(box.left, view.left);
    const area = Math.max(0, height) * Math.max(0, width);
    if (area > bestArea) {
      best = box.page;
      bestArea = area;
    }
  });
  return best;
}
