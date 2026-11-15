import type { Box } from './geometry';

/** The part of a page that has been on screen, as a start and an end between 0 and 1 along the scroll axis */
export type SeenRange = [start: number, end: number];

/** Fractions are rounded to this many steps, so a slow scroll does not report every pixel */
const STEPS = 100;

/** The end of a page counts as seen when this much of it has been */
const END_SEEN = 0.99;

const round = (value: number) => Math.round(value * STEPS) / STEPS;

/** The part of a page inside the view along the scroll axis, or null when none of it is */
export function getVisibleRange(page: Box, view: Box, horizontal: boolean): SeenRange | null {
  const start = horizontal ? page.left : page.top;
  const end = horizontal ? page.right : page.bottom;
  const size = end - start;
  const from = Math.max(start, horizontal ? view.left : view.top);
  const to = Math.min(end, horizontal ? view.right : view.bottom);
  return size > 0 && to > from ? [(from - start) / size, (to - start) / size] : null;
}

/**
 * Adds what is on screen to what has been seen. Scrolling is continuous, so ranges that touch
 * make one; after a jump the larger of the two is kept
 */
export function mergeRange(seen: SeenRange | undefined, visible: SeenRange): SeenRange {
  if (!seen) {
    return visible;
  }
  if (visible[0] <= seen[1] && visible[1] >= seen[0]) {
    return [Math.min(seen[0], visible[0]), Math.max(seen[1], visible[1])];
  }
  return visible[1] - visible[0] > seen[1] - seen[0] ? visible : seen;
}

/** How far the view has scrolled, from 0 at the start to 1 at the end. 0 when nothing scrolls */
export function getReadingPosition(offset: number, size: number, viewSize: number) {
  const scrollable = size - viewSize;
  return scrollable > 0 ? round(Math.min(Math.max(offset / scrollable, 0), 1)) : 0;
}

/** Fraction seen of every page, in page order, and whether the end of the last page has been seen */
export function getSeenSummary(ranges: Map<number, SeenRange>, numPages: number) {
  const seen = Array.from({ length: numPages }, (_, index) => {
    const range = ranges.get(index + 1);
    return range ? round(range[1] - range[0]) : 0;
  });
  return { seen, reachedEnd: (ranges.get(numPages)?.[1] ?? 0) >= END_SEEN };
}
