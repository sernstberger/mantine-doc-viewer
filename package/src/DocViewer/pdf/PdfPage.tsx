import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useEffect } from 'react';
import { useDocViewerPageContext } from '../DocViewer.context';
import type { PdfLinkService } from './link-service';
import type { PdfLayersState } from './use-pdf-layers';
import type { PdfJsModule } from './load-pdfjs';
import { type PdfRotation, rotateSize } from './render-page';
import { getOverlayStyle } from './page-overlay';
import type { DocViewerPageRect } from './page-points';
import { PdfHighlightLayer } from './PdfHighlightLayer';
import { NO_MARKS } from './marks-by-page';
import { PdfMarkupLayer } from './PdfMarkupLayer';
import { PdfMarkList } from './PdfMarkupText';
import type { DocViewerMark } from './markup';
import type { PdfLayerMarkup } from './use-markup';
import { useLinkLayer } from './use-link-layer';
import { useNearViewport } from './use-near-viewport';
import { usePageCanvas } from './use-page-canvas';
import { useReleasePage } from './use-release-page';
import { useTextLayer } from './use-text-layer';
import type { PdfPageSize } from './use-pdf-document';

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
  /** The tool to draw new marks with */
  markup?: PdfLayerMarkup;

  /** Marks to show on the page */
  marks?: DocViewerMark[];

  /** The page whose markup layer the Tab key reaches while a tool is picked */
  markupTabStop?: boolean;
}

function PdfPageView({
  numPages,
  rotation = 0,
  placeholderSize,
  scrollRoot,
  registerPage,
  highlightRects,
  markup,
  marks = NO_MARKS,
  markupTabStop = false,
  ...props
}: PdfPageProps) {
  const { document, pageNumber, scale } = props;
  const { getStyles, labels, maxCanvasPixels, renderPageOverlay } = useDocViewerPageContext();
  const { ref, near } = useNearViewport<HTMLDivElement>(scrollRoot);
  // What the canvas, text and link layers draw from; each hook takes the fields it needs
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
  // Overlays and marks follow the page before the viewer's rotation, then turn with it
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
      // A group, not an image: screen readers read the page from its text layer
      role="group"
      aria-label={labels.pageOf(pageNumber, numPages)}
    >
      {near && <canvas ref={canvasRef} {...getStyles('canvas')} aria-hidden />}
      <div ref={textLayerRef} {...getStyles('textLayer')} />
      <div ref={linkLayerRef} {...getStyles('linkLayer')} />
      {highlightRects && <PdfHighlightLayer rects={highlightRects} {...layerSize} />}
      {marks.length > 0 && <PdfMarkList pageNumber={pageNumber} marks={marks} />}
      {/* Only near the view: a long document would otherwise hold a layer for every page */}
      {markup && near && (
        <PdfMarkupLayer
          pageNumber={pageNumber}
          numPages={numPages}
          tabStop={markupTabStop}
          markup={markup}
          marks={marks}
          {...layerSize}
        />
      )}
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
