import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { type RefObject, useEffect, useRef } from 'react';
import { useDocViewerPageContext } from '../../doc-viewer.context';
import type { PdfJsModule } from '../../DocViewerAdapterProvider/adapters/pdfjs-adapter';
import { getPageViewport, type PdfRotation } from '../../utils/render-page';
import { getPageTextContent } from '../../utils/text-content';

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

/**
 * Hidden text in a page's text layer for pages without text, such as scanned pages: screen
 * readers would otherwise read only the page's name and nothing about it
 */
function createNoTextNote(text: string) {
  const note = window.document.createElement('span');
  note.className = 'noText';
  note.textContent = text;
  Object.assign(note.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  });
  return note;
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
  const built = useRef<{
    layer: InstanceType<PdfJsModule['TextLayer']>;
    page: PDFPageProxy;
  } | null>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const { pageHasNoTextLabel: pageHasNoText } = useDocViewerPageContext().labels;

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
          viewport: getPageViewport(page, scaleRef.current, rotation),
        });
        await textLayer.render();

        if (!cancelled) {
          built.current = { layer: textLayer, page };
          textLayer.update({ viewport: getPageViewport(page, scaleRef.current, rotation) });
          const endOfContent = window.document.createElement('div');
          endOfContent.className = 'endOfContent';
          container.append(endOfContent);
          textLayer.textDivs.length === 0 && container.append(createNoTextNote(pageHasNoText));
          onTextLayer(pageNumber, textLayer.textDivs);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      built.current = null;
      textLayer?.cancel();
      container.replaceChildren();
      onTextLayer(pageNumber, null);
    };
  }, [pdfjs, document, pageNumber, near, onTextLayer, rotation, pageHasNoText]);

  useEffect(() => {
    built.current?.layer.update({
      viewport: getPageViewport(built.current.page, scale, rotation),
    });
  }, [scale, rotation]);

  useSelectingClass(textLayerRef);

  return textLayerRef;
}
