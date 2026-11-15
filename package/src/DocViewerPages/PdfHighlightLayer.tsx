import React from 'react';
import { useDocViewerPageContext } from '../doc-viewer.context';
import { getOverlayStyle } from '../utils/page-overlay';
import type { DocViewerPageRect } from '../utils/page-points';
import type { PdfRotation } from '../utils/render-page';

interface PdfHighlightLayerProps {
  /** Boxes to mark, in page coordinates */
  rects: DocViewerPageRect[];
  /** Page size at scale 1, before the viewer's rotation */
  width: number;
  height: number;
  scale: number;
  rotation: PdfRotation;
}

/** The boxes marked by `controller.highlight`, turned with the page */
export function PdfHighlightLayer({
  rects,
  width,
  height,
  scale,
  rotation,
}: PdfHighlightLayerProps) {
  const { getStyles } = useDocViewerPageContext();

  return (
    <div
      {...getStyles('highlightLayer', {
        style: getOverlayStyle(width * scale, height * scale, rotation),
      })}
    >
      {rects.map((rect, index) => (
        <div
          key={index}
          {...getStyles('highlight', {
            style: {
              left: rect.x * scale,
              top: rect.y * scale,
              width: rect.width * scale,
              height: rect.height * scale,
            },
          })}
        />
      ))}
    </div>
  );
}
