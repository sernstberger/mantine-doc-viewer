import { useEffect, useRef } from 'react';
import { createMarkId, DocViewerStrokeMark, MIN_MARK_SIZE, rectFromPoints } from './markup';
import { type Draft, isStrokeTool, makeMark } from './markup-draft';
import { addMark, type MarkupLayerInput } from './markup-layer-input';

/** Writes a finished drag or stroke into the marks */
export function useMarkCommit({
  pageNumber,
  markup,
}: Pick<MarkupLayerInput, 'pageNumber' | 'markup'>) {
  const { tool, marks, setMarks } = markup;
  // The signature being written: strokes join it until the reader picks another tool
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
      setMarks(
        marks.map((mark) =>
          mark === existing ? { ...existing, strokes: [...existing.strokes, points] } : mark
        )
      );
      return;
    }

    const id = createMarkId();
    signature.current = id;
    addMark(markup, makeMark(tool!, id, pageNumber, markup.getColor(tool!), markup.width, points));
  };

  return (points: Draft) => {
    if (isStrokeTool(tool)) {
      addStroke(points);
      return;
    }

    const rect = rectFromPoints(points[0], points[points.length - 1]);
    if (rect.width < MIN_MARK_SIZE || rect.height < MIN_MARK_SIZE) {
      return;
    }
    const id = createMarkId();
    addMark(markup, makeMark(tool!, id, pageNumber, markup.getColor(tool!), markup.width, points));
  };
}
