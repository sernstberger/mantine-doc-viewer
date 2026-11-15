import type { PDFPageProxy, RenderTask } from 'pdfjs-dist';
import type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config';

export type PdfRotation = 0 | 90 | 180 | 270;

/** Viewport with the viewer's rotation added to the page's own rotation */
export function getPageViewport(page: PDFPageProxy, scale: number, rotation: PdfRotation = 0) {
  return page.getViewport({ scale, rotation: (page.rotate + rotation) % 360 });
}

/** Swaps width and height for quarter turns */
export function rotateSize<T extends { width: number; height: number }>(
  size: T,
  rotation: PdfRotation
): T {
  return rotation % 180 === 0 ? size : { ...size, width: size.height, height: size.width };
}

/**
 * Largest canvas drawn for one page, in pixels. Safari refuses canvases above about 16.7
 * million pixels and draws nothing, which a page at 800% on a high density screen passes
 */
export const MAX_CANVAS_PIXELS = 2 ** 24;

/** Pixel density to draw at: the screen's, lowered when the canvas would pass `maxPixels` */
export function getCanvasPixelRatio(
  width: number,
  height: number,
  devicePixelRatio: number,
  maxPixels: number
) {
  const area = width * height;
  if (area <= 0 || area * devicePixelRatio ** 2 <= maxPixels) {
    return devicePixelRatio;
  }

  return Math.sqrt(maxPixels / area);
}

/** Draws a page on a canvas at the screen's pixel density, within `maxPixels`, and returns the render task */
export function renderPageToCanvas(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number,
  maxPixels = MAX_CANVAS_PIXELS,
  rotation: PdfRotation = 0,
  /** Layer visibility, when the document has layers */
  optionalContentConfig?: OptionalContentConfig
): RenderTask {
  const viewport = getPageViewport(page, scale, rotation);
  const pixelRatio = getCanvasPixelRatio(
    viewport.width,
    viewport.height,
    window.devicePixelRatio || 1,
    maxPixels
  );
  canvas.width = Math.floor(viewport.width * pixelRatio);
  canvas.height = Math.floor(viewport.height * pixelRatio);

  return page.render({
    canvas,
    viewport,
    transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
    ...(optionalContentConfig !== undefined && {
      optionalContentConfigPromise: Promise.resolve(optionalContentConfig),
    }),
  });
}
