import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';
import { getPageViewport, type PdfRotation, renderPageToCanvas } from './render-page';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    document.getPage(pageNumber).then((page) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) {
        return;
      }

      const { width, height } = getPageViewport(page, 1, rotation);
      setSize({ width, height });
      const base = getPageViewport(page, 1);
      setBaseSize({ width: base.width, height: base.height });
      renderTask = renderPageToCanvas(
        page,
        canvas,
        scale,
        maxCanvasPixels,
        rotation,
        layers?.config ?? undefined
      );

      renderTask.promise.then(
        () => !cancelled && setRendered(true),
        () => {}
      );
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
    // Pages draw with the document's own layer visibility until a layer is toggled (version)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, pageNumber, scale, near, maxCanvasPixels, rotation, layers?.version]);

  return { canvasRef, size, baseSize, rendered };
}
