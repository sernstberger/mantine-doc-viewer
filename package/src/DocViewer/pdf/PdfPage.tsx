import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import type { DocViewerLabels } from '../labels';
import React, { useEffect, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { type PdfLinkService, resolveDestination } from './link-service';
import type { PdfJsModule } from './load-pdfjs';
import { getPageViewport, PdfRotation, renderPageToCanvas, rotateSize } from './render-page';
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

  /** Rotation added to the page's own, in quarter turns */
  rotation?: PdfRotation;

  /** Size at scale 1 used until the page itself has loaded */
  placeholderSize: PdfPageSize;

  /** Scroll container, pages render once they come within a few screens of it */
  scrollRoot: HTMLElement | null;

  registerPage: (pageNumber: number, node: HTMLDivElement | null) => void;

  /** Handles links in the page, links are not clickable without it */
  linkService?: PdfLinkService;

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

interface LinkAnnotation {
  id: string;
  url?: string;
  dest?: string | unknown[];
}

/**
 * pdf.js link elements usually have no text, so screen readers would only say "link". Name web
 * links after their address and links within the document after the page they go to
 */
async function nameLinks(
  container: HTMLElement,
  annotations: LinkAnnotation[],
  document: PDFDocumentProxy,
  labels: DocViewerLabels
) {
  await Promise.all(
    annotations.map(async (annotation) => {
      const link = container.querySelector<HTMLAnchorElement>(
        `a[data-element-id="${annotation.id.replace(/["\\]/g, '\\$&')}"]`
      );
      if (!link || link.getAttribute('aria-label')) {
        return;
      }

      if (annotation.url) {
        link.setAttribute('aria-label', link.title || annotation.url);
      } else if (annotation.dest) {
        const destination = await resolveDestination(document, annotation.dest).catch(() => null);
        destination && link.setAttribute('aria-label', labels.linkToPage(destination.page));
      }
    })
  );
}

export function PdfPage({
  pdfjs,
  document,
  pageNumber,
  numPages,
  scale,
  rotation = 0,
  placeholderSize,
  scrollRoot,
  registerPage,
  linkService,
  onTextLayer,
}: PdfPageProps) {
  const { getStyles, labels, maxCanvasPixels } = useDocViewerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const linkLayerRef = useRef<HTMLDivElement>(null);
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

      const { width, height } = getPageViewport(page, 1, rotation);
      setSize({ width, height });
      renderTask = renderPageToCanvas(page, canvas, scale, maxCanvasPixels, rotation);

      renderTask.promise.then(
        () => !cancelled && setRendered(true),
        () => {}
      );
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, scale, near, maxCanvasPixels, rotation]);

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

  // Links: pdf.js's annotation layer, with only link annotations. Everything else in the
  // annotation layer is drawn on the canvas already
  useEffect(() => {
    const container = linkLayerRef.current;
    if (!near || !container || !linkService) {
      return undefined;
    }

    let cancelled = false;
    let layer: InstanceType<PdfJsModule['AnnotationLayer']> | undefined;

    document
      .getPage(pageNumber)
      .then(async (page) => {
        const annotations = (await page.getAnnotations({ intent: 'display' })).filter(
          (annotation: { annotationType: number }) =>
            annotation.annotationType === pdfjs.AnnotationType.LINK
        );
        if (cancelled || annotations.length === 0) {
          return;
        }

        const viewport = getPageViewport(page, scale, rotation).clone({ dontFlip: true });
        layer = new pdfjs.AnnotationLayer({
          div: container,
          accessibilityManager: null,
          annotationCanvasMap: null,
          annotationEditorUIManager: null,
          page,
          viewport,
          structTreeLayer: null,
          commentManager: null,
          linkService,
          annotationStorage: document.annotationStorage,
        });
        await layer.render({
          annotations,
          viewport,
          div: container,
          page,
          linkService,
          renderForms: false,
          enableScripting: false,
          hasJSActions: false,
          imageResourcesPath: '',
          // Our link service implements the part of pdf.js's PDFLinkService that links use
        } as unknown as Parameters<NonNullable<typeof layer>['render']>[0]);

        if (!cancelled) {
          await nameLinks(container, annotations, document, labels);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [pdfjs, document, pageNumber, scale, near, linkService, labels, rotation]);

  useSelectingClass(textLayerRef);
  useReleasePage(document, pageNumber, near);

  const pageSize = size ?? rotateSize(placeholderSize, rotation);

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
    </div>
  );
}
