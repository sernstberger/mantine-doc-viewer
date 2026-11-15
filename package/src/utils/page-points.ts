import { clamp } from '@mantine/hooks';
import type { PdfRotation } from './render-page';

/** A box on a PDF page in px at 100% (PDF points), from the page's top-left as `renderPageOverlay` places content */
export interface DocViewerPageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Distance in px from the top of a page as shown to a point that is `top` points down the page
 * before the viewer rotates it (the coordinates of `renderPageOverlay`), on the page's left edge.
 * `pageHeight` is the height of the page as shown, in px
 */
export function getPointOffset(
  top: number,
  scale: number,
  rotation: PdfRotation,
  pageHeight: number
) {
  const offsets: Record<PdfRotation, number> = {
    0: top * scale,
    90: 0,
    180: pageHeight - top * scale,
    270: pageHeight,
  };

  return clamp(offsets[rotation], 0, pageHeight);
}

interface ClientBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Turns boxes on screen into boxes in page coordinates: relative to the page's top-left, divided
 * by the zoom and turned back by the rotation the reader added, so they match `renderPageOverlay`.
 * Boxes with no size are left out
 */
export function getPageRects(
  boxes: ClientBox[],
  pageBox: ClientBox,
  scale: number,
  rotation: PdfRotation
): DocViewerPageRect[] {
  // Size of the page as shown, at 100%
  const shownWidth = pageBox.width / scale;
  const shownHeight = pageBox.height / scale;

  return boxes
    .filter((box) => box.width > 0 && box.height > 0)
    .map((box) => {
      const left = (box.left - pageBox.left) / scale;
      const top = (box.top - pageBox.top) / scale;
      const right = left + box.width / scale;
      const bottom = top + box.height / scale;

      // Corners of the box in the page's own coordinates: left, top, right, bottom
      const corners: Record<PdfRotation, [number, number, number, number]> = {
        0: [left, top, right, bottom],
        90: [top, shownWidth - right, bottom, shownWidth - left],
        180: [shownWidth - right, shownHeight - bottom, shownWidth - left, shownHeight - top],
        270: [shownHeight - bottom, left, shownHeight - top, right],
      };
      const [x1, y1, x2, y2] = corners[rotation];
      return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    });
}
