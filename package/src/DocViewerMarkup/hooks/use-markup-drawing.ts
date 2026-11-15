import React, { useState } from 'react';
import { DocViewerMark, toPagePoint } from '../utils/markup';
import { type Draft, makeMark, type TextDraft } from '../utils/markup-draft';
import type { MarkupLayerInput } from './use-markup';
import { useMarkCommit } from './use-mark-commit';

interface DrawingInput extends MarkupLayerInput {
  textDraft: TextDraft | null;
  setTextDraft: (draft: TextDraft | null) => void;
  commitText: () => void;
}

/** Drawing with the current tool: the drag or stroke in progress, its pointer handlers and the commit keys share */
export function useMarkupDrawing({
  pageNumber,
  width,
  height,
  scale,
  rotation,
  markup,
  marks,
  textDraft,
  setTextDraft,
  commitText,
}: DrawingInput) {
  const { tool } = markup;
  const [draft, setDraft] = useState<Draft | null>(null);
  const commit = useMarkCommit({ pageNumber, markup, marks });

  const getPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return toPagePoint(
      event.clientX - box.left,
      event.clientY - box.top,
      width,
      height,
      scale,
      rotation
    );
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!tool || event.button !== 0) {
      return;
    }
    event.preventDefault();
    const [x, y] = getPoint(event);

    if (tool === 'text') {
      textDraft && commitText();
      setTextDraft({ x, y, text: '' });
      return;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDraft([[x, y]]);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    draft && setDraft([...draft, getPoint(event)]);
  };

  const onPointerUp = () => {
    draft && commit(draft);
    setDraft(null);
  };

  const draftMark: DocViewerMark | null =
    draft && tool
      ? makeMark(tool, 'draft', pageNumber, markup.getColor(tool), markup.width, draft)
      : null;

  return {
    draft,
    setDraft,
    commit,
    draftMark,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: () => setDraft(null) },
  };
}
