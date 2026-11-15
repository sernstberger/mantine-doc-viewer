import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import { useEffect, useState } from 'react';
import { keepSize, usePageCanvasRef } from '../../utils/page-canvas-ref';
import { getPageViewport, type PdfRotation, renderPageToCanvas } from '../../utils/render-page';
import type { PdfLayersState } from './use-pdf-layers';
import type { PdfPageSize } from './use-pdf-document';

interface PageCanvasInput {
  document: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: PdfRotation;
  near: boolean;
  maxCanvasPixels: number | undefined;
  /** Layer visibility; the page draws again when `version` changes */
  layers?: PdfLayersState;
}

/** Draws the page on its canvas while it is near the viewport, and keeps its size once known */
export function usePageCanvas({
  document,
  pageNumber,
  scale,
  rotation,
  near,
  maxCanvasPixels,
  layers,
}: PageCanvasInput) {
  const canvas = usePageCanvasRef();
  const [size, setSize] = useState<PdfPageSize | null>(null);
  // Size before the viewer's rotation, for the overlay
  const [baseSize, setBaseSize] = useState<PdfPageSize | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!near) {
      setRendered(false);
      return undefined;
    }

    let cancelled = false;
    let renderTask: RenderTask | undefined;

    // A document destroyed meanwhile (new src, edited pages, unmount) rejects: nothing to draw
    const draw = (page: PDFPageProxy) => {
      const node = canvas.node.current;
      if (cancelled || !node) {
        return;
      }

      const { width, height } = getPageViewport(page, 1, rotation);
      // The same object while the size holds, so zooming does not render the page again for it
      setSize((current) => keepSize(current, { width, height }));
      const base = getPageViewport(page, 1);
      setBaseSize((current) => keepSize(current, { width: base.width, height: base.height }));
      renderTask = renderPageToCanvas(
        page,
        node,
        scale,
        maxCanvasPixels,
        rotation,
        layers?.config ?? undefined
      );

      renderTask.promise.then(
        () => !cancelled && setRendered(true),
        () => {}
      );
    };
    document
      .getPage(pageNumber)
      .then(draw)
      .catch(() => {});

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
    // Pages draw with the document's own layer visibility until a layer is toggled (version)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, pageNumber, scale, near, maxCanvasPixels, rotation, layers?.version]);

  return { canvasRef: canvas.ref, size, baseSize, rendered };
}
