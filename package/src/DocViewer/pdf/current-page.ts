import { Box, VisibleBox } from './geometry';

/** Space left above a page when scrolling to it */
export const PAGE_SCROLL_OFFSET = 12;

/** Jumps further than this many screens scroll instantly */
export const LONG_JUMP_SCREENS = 3;

/** Where a scroller is, and how big its view is */
export type ScrollView = {
  scrollTop: number;
  scrollLeft: number;
  clientHeight: number;
  clientWidth: number;
};

/** The pages in view, measured in pixels from their elements */
export function collectVisibleBoxes(visible: Iterable<number>, pages: Map<number, HTMLElement>) {
  const boxes: VisibleBox[] = [];
  for (const page of visible) {
    const rect = pages.get(page)?.getBoundingClientRect();
    rect &&
      boxes.push({
        page,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      });
  }
  return boxes;
}

/** The area pages are seen in: the window, or the viewer's own scroll area */
export function getViewBox(viewport: boolean, scrollRoot: HTMLElement): Box {
  return viewport
    ? { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth }
    : scrollRoot.getBoundingClientRect();
}

/** The window's scroll position and size, shaped like a scroll area */
export function getWindowScrollView(): ScrollView {
  return {
    scrollTop: window.scrollY,
    scrollLeft: window.scrollX,
    clientHeight: window.innerHeight,
    clientWidth: window.innerWidth,
  };
}

/** The distance from the top of a page to scroll to: a number, or a function of the page height */
export function resolveOffset(offset: number | ((pageHeight: number) => number), height: number) {
  return typeof offset === 'function' ? offset(height) : offset;
}

type ScrollTargetInput = {
  /** Page top and left in the scroller's coordinates */
  pageTop: number;
  pageLeft: number;
  /** Distance below the top of the page, in px */
  distance: number;
  horizontal: boolean;
  viewport: boolean;
  view: ScrollView;
};

/** Where to scroll to bring a page into view, and whether that is a long way (several screens) */
export function getScrollTarget(input: ScrollTargetInput) {
  const { pageTop, distance, horizontal, viewport, view } = input;
  const top = pageTop - PAGE_SCROLL_OFFSET + distance;
  const pageLeft = input.pageLeft - PAGE_SCROLL_OFFSET;
  const left = horizontal && !viewport ? pageLeft : view.scrollLeft;
  const far =
    Math.abs(top - view.scrollTop) > view.clientHeight * LONG_JUMP_SCREENS ||
    Math.abs(left - view.scrollLeft) > view.clientWidth * LONG_JUMP_SCREENS;
  return { top, left, pageLeft, far };
}
