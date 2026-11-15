import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useEffect, useMemo } from 'react';
import { useDocViewerPageContext } from '../doc-viewer.context';
import type { PdfLinkService } from '../utils/link-service';
import type { PdfLayersState } from '../hooks/pdf/use-pdf-layers';
import type { PdfJsModule } from '../DocViewerAdapterProvider/adapters/pdfjs-adapter';
import { type PdfRotation, rotateSize } from '../utils/render-page';
import { type DocViewerRenderPageOverlay, getOverlayStyle } from '../utils/page-overlay';
import type { DocViewerPageRect } from '../utils/page-points';
import { PdfHighlightLayer } from './PdfHighlightLayer';
import { useDocViewerExtensions } from '../DocViewerRoot/extensions-context';
import { useLinkLayer } from '../hooks/pdf/use-link-layer';
import { useNearViewport } from '../hooks/pdf/use-near-viewport';
import { usePageCanvas } from '../hooks/pdf/use-page-canvas';
import { useReleasePage } from '../hooks/pdf/use-release-page';
import { useTextLayer } from '../hooks/pdf/use-text-layer';
import type { PdfPageSize } from '../hooks/pdf/use-pdf-document';

interface PdfPageProps {
  pdfjs: PdfJsModule;
  document: PDFDocumentProxy;
  pageNumber: number;
  numPages: number;
  scale: number;

  /** Rotation added to the page's own, in quarter turns */
  rotation?: PdfRotation;

  /** Layer visibility; pages draw again when `version` changes */
  layers?: PdfLayersState;

  /** Size at scale 1 used until the page itself has loaded */
  placeholderSize: PdfPageSize;

  /** Scroll container, pages render once they come within a few screens of it */
  scrollRoot: HTMLElement | null;

  registerPage: (pageNumber: number, node: HTMLDivElement | null) => void;

  /** Handles links in the page, links are not clickable without it */
  linkService?: PdfLinkService;

  /** Called with the text layer spans once they are rendered, and with `null` when they are removed */
  onTextLayer: (pageNumber: number, textDivs: HTMLElement[] | null) => void;

  /** Boxes marked by `controller.highlight`, in page coordinates */
  highlightRects?: DocViewerPageRect[];

  /** Largest canvas drawn, in pixels */
  maxCanvasPixels?: number;

  /** Content laid over the page */
  renderPageOverlay?: DocViewerRenderPageOverlay;
}

/** The page layers of the extensions, the same array while the extensions are */
function usePageLayers() {
  const extensions = useDocViewerExtensions();
  return useMemo(
    () => extensions.flatMap((extension) => (extension.pageLayer ? [extension.pageLayer] : [])),
    [extensions]
  );
}

function PdfPageView({
  numPages,
  rotation = 0,
  placeholderSize,
  scrollRoot,
  registerPage,
  highlightRects,
  maxCanvasPixels,
  renderPageOverlay,
  ...props
}: PdfPageProps) {
  const { document, pageNumber, scale } = props;
  const { getStyles, labels } = useDocViewerPageContext();
  const { ref, near } = useNearViewport<HTMLDivElement>(scrollRoot);
  const pageLayers = usePageLayers();
  const page = { ...props, rotation, near };

  useEffect(() => {
    registerPage(pageNumber, ref.current);
    return () => registerPage(pageNumber, null);
  }, [pageNumber, registerPage, ref]);

  const { canvasRef, size, baseSize, rendered } = usePageCanvas({ ...page, maxCanvasPixels });
  const textLayerRef = useTextLayer(page);
  const linkLayerRef = useLinkLayer({ ...page, labels });
  useReleasePage(document, pageNumber, near);

  const pageSize = size ?? rotateSize(placeholderSize, rotation);
  const { width, height } = baseSize ?? placeholderSize;
  const layerSize = { width, height, scale, rotation };
  const overlay = renderPageOverlay?.({ pageNumber, ...layerSize });

  return (
    <div
      ref={ref}
      {...getStyles('page', {
        style: {
          width: pageSize.width * scale,
          height: pageSize.height * scale,
          '--total-scale-factor': scale,
        } as React.CSSProperties,
      })}
      data-page-number={pageNumber}
      data-rendered={rendered || undefined}
      role="group"
      aria-label={labels.pageOfLabel(pageNumber, numPages)}
    >
      {near && <canvas ref={canvasRef} {...getStyles('canvas')} aria-hidden />}
      <div ref={textLayerRef} {...getStyles('textLayer')} />
      <div ref={linkLayerRef} {...getStyles('linkLayer')} />
      {highlightRects && <PdfHighlightLayer rects={highlightRects} {...layerSize} />}
      {pageLayers.map((Layer, index) => (
        <Layer key={index} page={pageNumber} numPages={numPages} near={near} {...layerSize} />
      ))}
      {overlay != null && overlay !== false && (
        <div
          {...getStyles('pageOverlay', {
            style: getOverlayStyle(width * scale, height * scale, rotation),
          })}
        >
          {overlay}
        </div>
      )}
    </div>
  );
}

/**
 * Memoised: a long document has a PdfPage per page, and only the pages whose props change (the
 * current page moving does not change any) need to render again
 */
export const PdfPage = React.memo(PdfPageView);
