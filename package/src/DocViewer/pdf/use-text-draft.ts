import { useState } from 'react';
import { createMarkId } from './markup';
import type { TextDraft } from './markup-draft';
import type { MarkupLayerInput } from './use-markup';

/** The text box being typed, and writing it into the marks */
export function useTextDraft({
  pageNumber,
  markup,
}: Pick<MarkupLayerInput, 'pageNumber' | 'markup'>) {
  const [textDraft, setTextDraft] = useState<TextDraft | null>(null);

  const commitText = () => {
    const text = textDraft?.text.trimEnd();
    setTextDraft(null);
    text &&
      markup.addMark({
        type: 'text',
        id: createMarkId(),
        page: pageNumber,
        color: markup.getColor('text'),
        x: textDraft!.x,
        y: textDraft!.y,
        text,
        fontSize: markup.fontSize,
      });
  };

  return { textDraft, setTextDraft, commitText };
}
