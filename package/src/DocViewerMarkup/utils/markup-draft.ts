import {
  DocViewerMark,
  DocViewerMarkPoint,
  DocViewerMarkupTool,
  rectFromPoints,
  TEXT_LINE_HEIGHT,
} from './markup';

/** Points of the drag or stroke being drawn */
export type Draft = DocViewerMarkPoint[];

export interface TextDraft {
  x: number;
  y: number;
  text: string;
}

/** Strokes are drawn point by point; the other tools drag out a box */
export function isStrokeTool(tool: DocViewerMarkupTool | null) {
  return tool === 'pen' || tool === 'signature';
}

/** The mark a drag or stroke makes with a tool (not text): `id` is `'draft'` while it is drawn */
export function makeMark(
  tool: DocViewerMarkupTool,
  id: string,
  page: number,
  color: string,
  width: number,
  points: Draft
): DocViewerMark {
  if (tool === 'pen' || tool === 'signature') {
    return { type: tool, id, page, color, width, strokes: [points] };
  }

  const rect = rectFromPoints(points[0], points[points.length - 1]);
  if (tool === 'highlight') {
    return { type: 'highlight', id, page, color, rect };
  }

  return { type: tool as 'rectangle' | 'ellipse' | 'cloud', id, page, color, width, rect };
}

/** Text style of a mark or the text box, at the page's scale */
export function getFontStyle(fontSize: number, color: string, scale: number) {
  return { fontSize: fontSize * scale, lineHeight: TEXT_LINE_HEIGHT, color };
}
