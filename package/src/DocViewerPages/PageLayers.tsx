import type { ComponentType } from 'react';
import type { DocViewerPageLayerProps } from '../doc-viewer.types';
import { type PageScaleStore, usePageScale } from '../hooks/pdf/use-page-scale';
import type { DocViewerPageRect } from '../utils/page-points';
import type { PdfRotation } from '../utils/render-page';
import { PdfHighlightLayer } from './PdfHighlightLayer';

interface PageLayersProps {
  scaleStore: PageScaleStore;
  page: number;
  numPages: number;
  near: boolean;
  /** Page size at scale 1, before the viewer's rotation */
  width: number;
  height: number;
  rotation: PdfRotation;
  highlightRects: DocViewerPageRect[] | undefined;
  layers: ComponentType<DocViewerPageLayerProps>[];
}

/**
 * The highlight and the page layers of the extensions over one page. They follow the zoom
 * themselves, so the page around them does not render again for a zoom step
 */
export function PageLayers({
  scaleStore,
  page,
  numPages,
  near,
  highlightRects,
  layers,
  ...size
}: PageLayersProps) {
  const scale = usePageScale(scaleStore, !!highlightRects || layers.length > 0);
  const layerSize = { ...size, scale };

  return (
    <>
      {highlightRects && <PdfHighlightLayer rects={highlightRects} {...layerSize} />}
      {layers.map((Layer, index) => (
        <Layer key={index} page={page} numPages={numPages} near={near} {...layerSize} />
      ))}
    </>
  );
}
