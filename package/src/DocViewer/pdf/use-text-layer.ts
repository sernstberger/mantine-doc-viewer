import type { PDFDocumentProxy } from 'pdfjs-dist';
import { type RefObject, useEffect, useRef } from 'react';
import type { PdfJsModule } from './load-pdfjs';
import { getPageViewport, type PdfRotation } from './render-page';
import { getPageTextContent } from './text-content';

interface TextLayerInput {
  pdfjs: PdfJsModule;
  document: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: PdfRotation;
  near: boolean;
  /** Called with the text layer spans once they are rendered, and with `null` when they are removed */
  onTextLayer: (pageNumber: number, textDivs: HTMLElement[] | null) => void;
}

/** While text is being selected, pdf.js stretches `.endOfContent` over the layer to stop the selection jumping */
function useSelectingClass(textLayerRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    // The text layer element is always rendered, so it exists once the page has mounted
    const layer = textLayerRef.current!;

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

/** pdf.js's text layer over the page while it is near the viewport, so its text can be selected and found */
export function useTextLayer({
  pdfjs,
  document,
  pageNumber,
  scale,
  rotation,
  near,
  onTextLayer,
}: TextLayerInput) {
  const textLayerRef = useRef<HTMLDivElement>(null);

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
          viewport: getPageViewport(page, scale, rotation),
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
  }, [pdfjs, document, pageNumber, scale, near, onTextLayer, rotation]);

  useSelectingClass(textLayerRef);

  return textLayerRef;
}
