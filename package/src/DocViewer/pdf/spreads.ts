import type { DocViewerPageLayout } from '../DocViewer';
import { isTwoPages } from './geometry';
import { PAGES_GUTTER } from './zoom';

/** Which ways of turning pages `withPageTurning` turns on. Each is on unless set to `false` */
export interface DocViewerPageTurning {
  /** Click or tap the left or right edge of the view to turn back or forward */
  tapZones?: boolean;

  /** Swipe sideways with a finger or pen to turn, when the pages fit the width of the view */
  swipe?: boolean;

  /**
   * Arrow left and right, Page up and Page down turn, wherever focus is on the page except in
   * text fields and menus. Page turner pedals send these keys
   */
  keys?: boolean;
}

export type PageTurnDirection = 1 | -1;

/**
 * The pages shown side by side, in order: pairs in two-page layouts (the first page alone in
 * `'two-page-cover'`), one page each in other layouts
 */
export function getSpreads(layout: DocViewerPageLayout, numPages: number): number[][] {
  const pages = Array.from({ length: numPages }, (_, index) => index + 1);
  if (!isTwoPages(layout)) {
    return pages.map((page) => [page]);
  }

  const cover = layout === 'two-page-cover';
  const spreads: number[][] = cover && numPages > 0 ? [[1]] : [];
  for (let page = cover ? 2 : 1; page <= numPages; page += 2) {
    spreads.push(page < numPages ? [page, page + 1] : [page]);
  }
  return spreads;
}

/** Index of the spread a page is on, from 0 */
export function getSpreadIndex(spreads: number[][], page: number) {
  return Math.max(
    0,
    spreads.findIndex((spread) => spread.includes(page))
  );
}

/** First page of the spread before or after the one `page` is on, or null at either end */
export function getTurnTarget(spreads: number[][], page: number, direction: PageTurnDirection) {
  return spreads[getSpreadIndex(spreads, page) + direction]?.[0] ?? null;
}

/** Share of the view's width at each side that turns the page when clicked */
export const TAP_ZONE = 0.25;

/** Way a click at `x` turns the page, by its place across the view: null in the middle */
export function getTapDirection(x: number, left: number, width: number): PageTurnDirection | null {
  const position = (x - left) / width;
  if (position < TAP_ZONE) {
    return -1;
  }
  return position > 1 - TAP_ZONE ? 1 : null;
}

/** Shortest swipe that turns the page, in px */
export const SWIPE_DISTANCE = 48;

/** Way a swipe turns the page: mostly sideways and long enough, against the swipe like paper */
export function getSwipeDirection([x, y]: [number, number]): PageTurnDirection | null {
  if (Math.abs(x) < SWIPE_DISTANCE || Math.abs(x) < Math.abs(y) * 2) {
    return null;
  }
  return x < 0 ? 1 : -1;
}

const TURN_KEYS: Record<string, PageTurnDirection> = {
  ArrowRight: 1,
  PageDown: 1,
  ArrowLeft: -1,
  PageUp: -1,
};

/** Elements that use these keys themselves: text fields, menus, sliders and the like */
const OWN_KEYS_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="menu"], [role="listbox"], [role="slider"], [role="tablist"], [role="radiogroup"], [role="dialog"]';

/** Way a key turns the page, or null for other keys, keys with modifiers and keys meant for text fields and menus */
export function getTurnKeyDirection(event: KeyboardEvent): PageTurnDirection | null {
  const direction = TURN_KEYS[event.key];
  if (!direction || event.defaultPrevented) {
    return null;
  }
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return null;
  }
  const target = event.target as Element | null;
  return target?.closest?.(OWN_KEYS_SELECTOR) ? null : direction;
}

/** Ways of turning pages that are on, from the `withPageTurning` prop */
export function resolvePageTurning(
  value: boolean | DocViewerPageTurning | undefined
): Required<DocViewerPageTurning> {
  const options = typeof value === 'object' ? value : {};
  const on = value !== undefined && value !== false;
  return {
    tapZones: on && options.tapZones !== false,
    swipe: on && options.swipe !== false,
    keys: on && options.keys !== false,
  };
}

interface FitsAcrossInput {
  layout: DocViewerPageLayout;
  scale: number;
  pageWidth: number;
  columnGap: number;
  bodyWidth: number;
}

/**
 * Whether a spread fits the width of the view, so a sideways swipe can turn the page instead of
 * scrolling. Never in the horizontal layout, which scrolls sideways
 */
export function fitsAcross({ layout, scale, pageWidth, columnGap, bodyWidth }: FitsAcrossInput) {
  if (layout === 'horizontal') {
    return false;
  }
  const width = isTwoPages(layout) ? pageWidth * scale * 2 + columnGap : pageWidth * scale;
  return width + PAGES_GUTTER <= bodyWidth + 1;
}
