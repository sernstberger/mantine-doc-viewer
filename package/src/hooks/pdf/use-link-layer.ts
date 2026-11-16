import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { useEffect, useRef } from 'react';
import type { DocViewerLabels } from '../../default-labels';
import { type PdfLinkService, resolveDestination } from '../../utils/link-service';
import type { PdfJsModule } from '../../DocViewerAdapterProvider/adapters/pdfjs-adapter';
import { getPageViewport, type PdfRotation } from '../../utils/render-page';

interface LinkLayerInput {
  pdfjs: PdfJsModule;
  document: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: PdfRotation;
  near: boolean;
  /** Handles links in the page, links are not clickable without it */
  linkService?: PdfLinkService;
  labels: DocViewerLabels;
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
        destination && link.setAttribute('aria-label', labels.linkToPageLabel(destination.page));
      }
    })
  );
}

/**
 * Links: pdf.js's annotation layer, with only link annotations. Everything else in the
 * annotation layer is drawn on the canvas already
 */
export function useLinkLayer({
  pdfjs,
  document,
  pageNumber,
  scale,
  rotation,
  near,
  linkService,
  labels,
}: LinkLayerInput) {
  const linkLayerRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef(labels);
  labelsRef.current = labels;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const built = useRef<{
    layer: InstanceType<PdfJsModule['AnnotationLayer']>;
    page: PDFPageProxy;
  } | null>(null);

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

        const viewport = getPageViewport(page, scaleRef.current, rotation).clone({
          dontFlip: true,
        });
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
          // Workaround: our link service implements the part of pdf.js's PDFLinkService that links use
        } as unknown as Parameters<NonNullable<typeof layer>['render']>[0]);

        if (!cancelled) {
          built.current = { layer, page };
          await nameLinks(container, annotations, document, labelsRef.current);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      built.current = null;
      container.replaceChildren();
    };
  }, [pdfjs, document, pageNumber, near, linkService, rotation]);

  useEffect(() => {
    const viewport =
      built.current &&
      getPageViewport(built.current.page, scale, rotation).clone({ dontFlip: true });
    // Workaround: pdf.js types `update` with the parameters of `render`
    viewport && built.current!.layer.update({ viewport } as never);
  }, [scale, rotation]);

  return linkLayerRef;
}
