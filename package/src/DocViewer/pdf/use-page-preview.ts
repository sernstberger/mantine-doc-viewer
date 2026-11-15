import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { getPageViewport, PdfRotation, renderPageToCanvas } from './render-page';
import type { PdfPageSize } from './use-pdf-document';
import type { PdfLayersState } from './use-pdf-layers';
import { useReleasePage } from './use-release-page';

interface PagePreviewInput {
  document: PDFDocumentProxy;
  pageNumber: number;

  /** Width to draw the page at, in px */
  width: number;

  /** Draws while true, and gives the canvas back when it turns false */
  near: boolean;
  rotation?: PdfRotation;
  layers?: PdfLayersState;
}

/** Small drawing of a page, for thumbnails and the page editor. Returns the canvas ref and the page size */
export function usePagePreview({
  document,
  pageNumber,
  width,
  near,
  rotation = 0,
  layers,
}: PagePreviewInput) {
  const { maxCanvasPixels } = useDocViewerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<PdfPageSize | null>(null);

  useEffect(() => {
    if (!near) {
      return undefined;
    }

    let cancelled = false;
    let renderTask: RenderTask | undefined;

    document.getPage(pageNumber).then((page) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) {
        return;
      }

      const { width: pageWidth, height } = getPageViewport(page, 1, rotation);
      setSize({ width: pageWidth, height });
      renderTask = renderPageToCanvas(
        page,
        canvas,
        width / pageWidth,
        maxCanvasPixels,
        rotation,
        layers?.config ?? undefined
      );
      renderTask.promise.catch(() => {});
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
    // Pages draw with the document's own layer visibility until a layer is toggled (version)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, pageNumber, near, width, maxCanvasPixels, rotation, layers?.version]);

  useReleasePage(document, pageNumber, near);

  return { canvasRef, size };
}
