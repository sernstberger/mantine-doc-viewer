import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import React, { useEffect, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import type { PdfJsModule } from './load-pdfjs';
import { renderPageToCanvas } from './render-page';
import { getPageTextContent } from './text-content';
import { useNearViewport } from './use-near-viewport';
import { useReleasePage } from './use-release-page';
import type { PdfPageSize } from './use-pdf-document';

interface PdfPageProps {
  pdfjs: PdfJsModule;
  document: PDFDocumentProxy;
  pageNumber: number;
  numPages: number;
  scale: number;

  /** Size at scale 1 used until the page itself has loaded */
  placeholderSize: PdfPageSize;

  /** Scroll container, pages render once they come within a few screens of it */
  scrollRoot: HTMLElement | null;

  registerPage: (pageNumber: number, node: HTMLDivElement | null) => void;

  /** Called with the text layer spans once they are rendered, and with `null` when they are removed */
  onTextLayer: (pageNumber: number, textDivs: HTMLElement[] | null) => void;
}

/** While text is being selected, pdf.js stretches `.endOfContent` over the layer to stop the selection jumping */
function useSelectingClass(textLayerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const layer = textLayerRef.current;
    if (!layer) {
      return undefined;
    }

    const stop = () => layer.classList.remove('selecting');
    const start = () => {
      layer.classList.add('selecting');
      window.addEventListener('pointerup', stop, { once: true });
    };

    layer.addEventListener('pointerdown', start);
    return () => {
      layer.removeEventListener('pointerdown', start);
      window.removeEventListener('pointerup', stop);
    };
  }, [textLayerRef]);
}

export function PdfPage({
  pdfjs,
  document,
  pageNumber,
  numPages,
  scale,
  placeholderSize,
  scrollRoot,
  registerPage,
  onTextLayer,
}: PdfPageProps) {
  const { getStyles, labels, maxCanvasPixels } = useDocViewerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const { ref, near } = useNearViewport<HTMLDivElement>(scrollRoot);
  const [size, setSize] = useState<PdfPageSize | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    registerPage(pageNumber, ref.current);
    return () => registerPage(pageNumber, null);
  }, [pageNumber, registerPage, ref]);

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

      const { width, height } = page.getViewport({ scale: 1 });
      setSize({ width, height });
      renderTask = renderPageToCanvas(page, canvas, scale, maxCanvasPixels);

      renderTask.promise.then(
        () => !cancelled && setRendered(true),
        () => {}
      );
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, scale, near, maxCanvasPixels]);

  useEffect(() => {
    const container = textLayerRef.current;
    if (!near || !container) {
      return undefined;
    }

    let cancelled = false;
    let textLayer: InstanceType<PdfJsModule['TextLayer']> | undefined;

    Promise.all([document.getPage(pageNumber), getPageTextContent(document, pageNumber)])
      .then(async ([page, textContent]) => {
        if (cancelled) {
          return;
        }

        textLayer = new pdfjs.TextLayer({
          textContentSource: textContent,
          container,
          viewport: page.getViewport({ scale }),
        });
        await textLayer.render();

        if (!cancelled) {
          const endOfContent = window.document.createElement('div');
          endOfContent.className = 'endOfContent';
          container.append(endOfContent);
          onTextLayer(pageNumber, textLayer.textDivs);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      textLayer?.cancel();
      container.replaceChildren();
      onTextLayer(pageNumber, null);
    };
  }, [pdfjs, document, pageNumber, scale, near, onTextLayer]);

  useSelectingClass(textLayerRef);
  useReleasePage(document, pageNumber, near);

  const pageSize = size ?? placeholderSize;

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
    </div>
  );
}
