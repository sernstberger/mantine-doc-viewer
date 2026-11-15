import { toRgba } from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfRotation } from './render-page';

/** Markup tools a reader can draw with on PDF pages */
export type DocViewerMarkupTool =
  | 'highlight'
  | 'pen'
  | 'text'
  | 'rectangle'
  | 'ellipse'
  | 'cloud'
  | 'signature';

/** All markup tools, in the order the markup bar shows them */
export const MARKUP_TOOLS: DocViewerMarkupTool[] = [
  'highlight',
  'pen',
  'text',
  'rectangle',
  'ellipse',
  'cloud',
  'signature',
];

/** A box on a page in PDF points from the page's top-left, as the page shows before the viewer rotates it */
export interface DocViewerMarkRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A point on a page, `[x, y]` in PDF points from the page's top-left */
export type DocViewerMarkPoint = [number, number];

interface MarkBase {
  /** Unique id of the mark */
  id: string;

  /** Page number, counted from 1 */
  page: number;

  /** CSS color, such as `#e03131` */
  color: string;
}

/** A translucent box over text, saved as a PDF highlight annotation */
export interface DocViewerHighlightMark extends MarkBase {
  type: 'highlight';
  rect: DocViewerMarkRect;
}

/** Freehand lines: a pen mark (saved as an ink annotation) or a signature (saved as a signature) */
export interface DocViewerStrokeMark extends MarkBase {
  type: 'pen' | 'signature';

  /** Lines drawn without lifting the pen, each a list of points */
  strokes: DocViewerMarkPoint[][];

  /** Line width in PDF points */
  width: number;
}

/** A rectangle, ellipse or revision cloud outline, saved as an ink annotation */
export interface DocViewerShapeMark extends MarkBase {
  type: 'rectangle' | 'ellipse' | 'cloud';
  rect: DocViewerMarkRect;

  /** Line width in PDF points */
  width: number;
}

/** Text on the page, saved as a PDF free text annotation in Helvetica */
export interface DocViewerTextMark extends MarkBase {
  type: 'text';

  /** Top-left corner of the text */
  x: number;
  y: number;
  text: string;

  /** Font size in PDF points */
  fontSize: number;
}

/** A mark drawn on a PDF page with a markup tool, or added by the app through `markup` */
export type DocViewerMark =
  | DocViewerHighlightMark
  | DocViewerStrokeMark
  | DocViewerShapeMark
  | DocViewerTextMark;

/** Line height of text marks, in ems */
export const TEXT_LINE_HEIGHT = 1.2;

/** Average width of a Helvetica character, in ems, to size the saved text box */
const TEXT_CHAR_WIDTH = 0.56;

/** Points per scallop along the edge of a revision cloud */
const CLOUD_SEGMENTS = 8;

/** Smallest box a drag makes, in PDF points; smaller drags are treated as clicks and dropped */
export const MIN_MARK_SIZE = 3;

/** Box of a text mark: Helvetica estimated, wide enough for its longest line */
export function getTextRect(mark: Pick<DocViewerTextMark, 'x' | 'y' | 'text' | 'fontSize'>) {
  const lines = mark.text.split('\n');
  const longest = Math.max(...lines.map((line) => line.length));
  return {
    x: mark.x,
    y: mark.y,
    width: Math.max(1, longest) * mark.fontSize * TEXT_CHAR_WIDTH,
    height: lines.length * mark.fontSize * TEXT_LINE_HEIGHT,
  };
}

/** Box between two corners of a drag, whichever way it went */
export function rectFromPoints(
  [x1, y1]: DocViewerMarkPoint,
  [x2, y2]: DocViewerMarkPoint
): DocViewerMarkRect {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

function cloudOutline({ x, y, width, height }: DocViewerMarkRect): DocViewerMarkPoint[] {
  // Scallops about 14pt wide, a whole number of them along each side
  const corners: DocViewerMarkPoint[] = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ];
  const points: DocViewerMarkPoint[] = [];

  corners.forEach(([ax, ay], side) => {
    const [bx, by] = corners[(side + 1) % 4];
    const length = Math.hypot(bx - ax, by - ay);
    const count = Math.max(1, Math.round(length / 14));
    // Outward normal of the side, for a clockwise outline in screen coordinates
    const nx = (by - ay) / (length || 1);
    const ny = -(bx - ax) / (length || 1);

    for (let scallop = 0; scallop < count; scallop += 1) {
      for (let step = 0; step < CLOUD_SEGMENTS; step += 1) {
        const t = (scallop + step / CLOUD_SEGMENTS) / count;
        const bulge = Math.sin((step / CLOUD_SEGMENTS) * Math.PI) * (length / count / 2);
        points.push([ax + (bx - ax) * t + nx * bulge, ay + (by - ay) * t + ny * bulge]);
      }
    }
  });

  points.push(points[0]);
  return points;
}

function ellipseOutline({ x, y, width, height }: DocViewerMarkRect): DocViewerMarkPoint[] {
  return Array.from({ length: 49 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    return [
      x + width / 2 + (Math.cos(angle) * width) / 2,
      y + height / 2 + (Math.sin(angle) * height) / 2,
    ];
  });
}

/** Lines that draw a pen, signature or shape mark, in page coordinates */
export function getMarkLines(
  mark: DocViewerStrokeMark | DocViewerShapeMark
): DocViewerMarkPoint[][] {
  if ('strokes' in mark) {
    return mark.strokes;
  }

  const { x, y, width, height } = mark.rect;
  if (mark.type === 'ellipse') {
    return [ellipseOutline(mark.rect)];
  }
  if (mark.type === 'cloud') {
    return [cloudOutline(mark.rect)];
  }
  return [
    [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
      [x, y],
    ],
  ];
}

/** SVG path data for lines at a scale; a single point draws a dot */
export function toPathData(lines: DocViewerMarkPoint[][], scale: number) {
  const round = (value: number) => Math.round(value * scale * 100) / 100;
  return lines
    .map((points) => {
      const [first, ...rest] = points;
      const head = `M${round(first[0])} ${round(first[1])}`;
      return rest.length === 0
        ? `${head}h0`
        : `${head}${rest.map(([x, y]) => `L${round(x)} ${round(y)}`).join('')}`;
    })
    .join('');
}

/**
 * Point on the page, in page coordinates, for a point (`u`, `v`) in the page's box on screen.
 * The box is the page at `scale` as shown, turned by the viewer's `rotation`
 */
export function toPagePoint(
  u: number,
  v: number,
  width: number,
  height: number,
  scale: number,
  rotation: PdfRotation
): DocViewerMarkPoint {
  const w = width * scale;
  const h = height * scale;
  const unrotated: Record<PdfRotation, DocViewerMarkPoint> = {
    0: [u, v],
    90: [v, h - u],
    180: [w - u, h - v],
    270: [w - v, u],
  };
  const [x, y] = unrotated[rotation];
  return [x / scale, y / scale];
}

interface PdfViewport {
  convertToPdfPoint: (x: number, y: number) => number[];
}

const EDITOR_TYPE = { FREETEXT: 3, HIGHLIGHT: 9, INK: 15, SIGNATURE: 101 } as const;

/** Prefix pdf.js gives keys of new annotations in `annotationStorage`; saveDocument writes those */
const EDITOR_PREFIX = 'pdfjs_internal_editor_';

function toRgb(color: string) {
  const { r, g, b } = toRgba(color);
  return [r, g, b];
}

/** Bezier data pdf.js writes ink from: 6 numbers per point, NaN control points draw straight lines */
function toBezier(points: number[][]) {
  return points.flatMap(([x, y]) => [NaN, NaN, NaN, NaN, x, y]);
}

/** Bounding box in PDF coordinates [x1, y1, x2, y2], grown by `pad` */
function getPdfRect(points: number[][], pad = 0) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return [
    Math.min(...xs) - pad,
    Math.min(...ys) - pad,
    Math.max(...xs) + pad,
    Math.max(...ys) + pad,
  ];
}

/**
 * A mark as pdf.js's annotation editors serialize it, so `saveDocument()` writes it into the PDF
 * as a real annotation. `viewport` is the page at scale 1 with its own rotation
 */
export function serializeMark(mark: DocViewerMark, viewport: PdfViewport, pageRotation: number) {
  const toPdf = ([x, y]: number[]) => viewport.convertToPdfPoint(x, y);
  const color = toRgb(mark.color);
  const base = { pageIndex: mark.page - 1, color, rotation: 0 };

  if (mark.type === 'highlight') {
    const [x1, y1, x2, y2] = getPdfRect(
      [
        [mark.rect.x, mark.rect.y],
        [mark.rect.x + mark.rect.width, mark.rect.y + mark.rect.height],
      ].map(toPdf)
    );
    return {
      ...base,
      annotationType: EDITOR_TYPE.HIGHLIGHT,
      opacity: 1,
      rect: [x1, y1, x2, y2],
      quadPoints: [x1, y2, x2, y2, x1, y1, x2, y1],
      outlines: [[x1, y1, x1, y2, x2, y2, x2, y1]],
    };
  }

  if (mark.type === 'text') {
    const box = getTextRect(mark);
    return {
      ...base,
      annotationType: EDITOR_TYPE.FREETEXT,
      rotation: pageRotation,
      fontSize: mark.fontSize,
      value: mark.text,
      rect: getPdfRect(
        [
          [box.x, box.y],
          [box.x + box.width, box.y + box.height],
        ].map(toPdf)
      ),
    };
  }

  const lines = getMarkLines(mark).map((points) => points.map(toPdf));
  const rect = getPdfRect(lines.flat(), mark.width / 2);
  const thickness = mark.width;

  if (mark.type === 'signature') {
    return {
      ...base,
      annotationType: EDITOR_TYPE.SIGNATURE,
      isSignature: true,
      areContours: false,
      thickness,
      lines: lines.map(toBezier),
      rect,
    };
  }

  return {
    ...base,
    annotationType: EDITOR_TYPE.INK,
    opacity: 1,
    thickness,
    paths: { lines: lines.map(toBezier), points: lines.map((points) => points.flat()) },
    rect,
  };
}

/** Writes marks into the document as PDF annotations and returns the bytes of the new file */
export async function saveMarkedDocument(document: PDFDocumentProxy, marks: DocViewerMark[]) {
  const storage = document.annotationStorage;
  const keys: string[] = [];

  try {
    for (const [index, mark] of marks.entries()) {
      const page = await document.getPage(mark.page);
      const viewport = page.getViewport({ scale: 1, rotation: page.rotate });
      const key = `${EDITOR_PREFIX}docviewer_${index}`;
      keys.push(key);
      storage.setValue(key, serializeMark(mark, viewport, page.rotate));
    }
    return await document.saveDocument();
  } finally {
    // The marks stay on screen as the viewer's own layer; the loaded document is left as it was
    keys.forEach((key) => storage.remove(key));
  }
}

let nextId = 0;

/** Id for a new mark */
export function createMarkId() {
  nextId += 1;
  return `mark-${Date.now().toString(36)}-${nextId}`;
}
