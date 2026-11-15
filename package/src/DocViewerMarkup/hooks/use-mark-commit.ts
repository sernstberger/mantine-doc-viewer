import { useEffect, useRef } from 'react';
import { createMarkId, DocViewerStrokeMark, MIN_MARK_SIZE, rectFromPoints } from '../utils/markup';
import { type Draft, isStrokeTool, makeMark } from '../utils/markup-draft';
import type { MarkupLayerInput } from './use-markup';

/** Writes a finished drag or stroke into the marks; the function it returns says whether a mark was added */
export function useMarkCommit({
  pageNumber,
  markup,
  marks,
}: Pick<MarkupLayerInput, 'pageNumber' | 'markup' | 'marks'>) {
  const { tool } = markup;
  const signature = useRef<string | null>(null);
  useEffect(() => {
    signature.current = null;
  }, [tool]);

  const addStroke = (points: Draft) => {
    const existing =
      tool === 'signature'
        ? marks.find((mark): mark is DocViewerStrokeMark => mark.id === signature.current)
        : undefined;
    if (existing) {
      markup.replaceMark(existing, { ...existing, strokes: [...existing.strokes, points] });
      return;
    }

    const id = createMarkId();
    signature.current = id;
    markup.addMark(makeMark(tool!, id, pageNumber, markup.getColor(tool!), markup.width, points));
  };

  return (points: Draft) => {
    if (isStrokeTool(tool)) {
      addStroke(points);
      return true;
    }

    const rect = rectFromPoints(points[0], points[points.length - 1]);
    if (rect.width < MIN_MARK_SIZE || rect.height < MIN_MARK_SIZE) {
      return false;
    }
    const id = createMarkId();
    markup.addMark(makeMark(tool!, id, pageNumber, markup.getColor(tool!), markup.width, points));
    return true;
  };
}
