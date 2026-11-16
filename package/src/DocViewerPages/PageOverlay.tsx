import { createContext, use } from 'react';
import { useDocViewerPageContext } from '../doc-viewer.context';
import { type PageScaleStore, usePageScale } from '../hooks/pdf/use-page-scale';
import { type DocViewerRenderPageOverlay, getOverlayStyle } from '../utils/page-overlay';
import type { PdfRotation } from '../utils/render-page';

/** The `renderPageOverlay` of the page list, read by the overlay of each page */
export const PageOverlayContext = createContext<DocViewerRenderPageOverlay | undefined>(undefined);

interface PageOverlayProps {
  scaleStore: PageScaleStore;
  page: number;
  /** Page size at scale 1, before the viewer's rotation */
  width: number;
  height: number;
  rotation: PdfRotation;
}

/**
 * The content of `renderPageOverlay` over one page. It follows the zoom itself, so the page
 * around it does not render again for a zoom step
 */
export function PageOverlay({ scaleStore, page, width, height, rotation }: PageOverlayProps) {
  const render = use(PageOverlayContext);
  const { getStyles } = useDocViewerPageContext();
  const scale = usePageScale(scaleStore, !!render);
  const overlay = render?.({ page, width, height, scale, rotation });

  return overlay == null || overlay === false ? null : (
    <div
      {...getStyles('pageOverlay', {
        style: getOverlayStyle(width * scale, height * scale, rotation),
      })}
    >
      {overlay}
    </div>
  );
}
