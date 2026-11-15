import type { DocViewerPageLayout } from '../DocViewer';
import { type PdfRotation, rotateSize } from './render-page';
import type { PdfPageSize } from './use-pdf-document';
import { DEFAULT_PAGES_GUTTER, getFitWidthScale, PagesGutter, PdfZoom } from './zoom';

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

  /** Padding of the pages element, kept free when fitting. 16px a side by default */
  gutter?: PagesGutter;

  /** The viewer grows to its pages, so the height of the view cannot be fitted to */
  autoHeight?: boolean;
}

/** Scale of the pages: the zoom, or the scale that fits the layout to the view */
export function computeScale(input: ScaleInput) {
  const { zoom, layout, bodyWidth, bodyHeight, columnGap, pageWidth, pageHeight } = input;
  const gutter = input.gutter ?? DEFAULT_PAGES_GUTTER;
  if (typeof zoom === 'number') {
    return zoom;
  }
  const byHeight = getFitWidthScale(bodyHeight, pageHeight, gutter.y);
  if (fitsToHeight(layout) && !input.autoHeight) {
    // Pages fill the height of the view, but a landscape page is never made wider than the view
    return Math.min(byHeight, getFitWidthScale(bodyWidth, pageWidth, gutter.x));
  }
  const byWidth = isTwoPages(layout)
    ? getFitWidthScale(bodyWidth - columnGap, pageWidth * 2, gutter.x)
    : getFitWidthScale(bodyWidth, pageWidth, gutter.x);
  // A whole page, or a whole spread, fits both ways; a viewer that grows with its pages has no
  // height of its own to fit, so it fits the width
  return zoom === 'fit-page' && !input.autoHeight ? Math.min(byWidth, byHeight) : byWidth;
}

export interface ViewScaleInput extends Omit<ScaleInput, 'pageWidth' | 'pageHeight'> {
  /** Size of the first page at scale 1, after rotation */
  pageSize: { width: number; height: number };
  /** False while there is no document */
  ready: boolean;
  presenting: boolean;
}

/** Scale the pages are shown at: 1 while loading, the whole page in a presentation, else the zoom or fit */
export function getViewScale({ pageSize, ready, presenting, ...input }: ViewScaleInput) {
  if (!ready) {
    return 1;
  }
  return presenting
    ? computeFitPageScale(input.bodyWidth, input.bodyHeight, pageSize.width, pageSize.height)
    : computeScale({ ...input, pageWidth: pageSize.width, pageHeight: pageSize.height });
}

/** Size of the first page after the reader's rotation, or nothing while there is no document */
export function getPageSize(firstPageSize: PdfPageSize | undefined, rotation: PdfRotation) {
  return firstPageSize ? rotateSize(firstPageSize, rotation) : { width: 0, height: 0 };
}

/**
 * With height="auto" the window scrolls, except in full screen or a presentation, which have a
 * fixed height and scroll inside the viewer
 */
export function scrollsWindow(
  autoHeight: boolean | undefined,
  fullscreen: boolean,
  presenting: boolean
) {
  return !!autoHeight && !fullscreen && !presenting;
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

/** The document's pages are in place in the scroll area */
export function isLaidOut(
  ready: unknown,
  scrollRoot: HTMLElement | null,
  pages: HTMLElement | null
) {
  return !!(ready && scrollRoot && pages);
}
