import type React from 'react';
import type { PdfRotation } from './render-page';

/** What `renderPageOverlay` gets for each PDF page */
export interface DocViewerPageOverlayInfo {
  /** Page number, counted from 1 */
  pageNumber: number;

  /** Width of the page at 100% in px (PDF points), as the page shows before the viewer rotates it */
  width: number;

  /** Height of the page at 100% in px (PDF points), as the page shows before the viewer rotates it */
  height: number;

  /** Zoom the page is shown at, 1 is 100%. Multiply page coordinates by it to place content */
  scale: number;

  /** Rotation the reader added from the toolbar, clockwise in degrees. The overlay turns with it */
  rotation: PdfRotation;
}

/** Renders content over one PDF page, positioned in page coordinates times `scale` */
export type DocViewerRenderPageOverlay = (page: DocViewerPageOverlayInfo) => React.ReactNode;

/**
 * Style of the overlay box: the page's unrotated size at `scale`, turned with the page so content
 * placed at (x, y) from the page's top-left stays on the same spot of the page in every rotation
 */
export function getOverlayStyle(
  width: number,
  height: number,
  rotation: PdfRotation
): React.CSSProperties {
  const translate: Record<PdfRotation, string> = {
    0: '',
    90: `translate(${height}px, 0px) `,
    180: `translate(${width}px, ${height}px) `,
    270: `translate(0px, ${width}px) `,
  };

  return {
    width,
    height,
    transform: rotation === 0 ? undefined : `${translate[rotation]}rotate(${rotation}deg)`,
  };
}
