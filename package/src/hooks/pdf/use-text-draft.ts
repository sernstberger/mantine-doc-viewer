import { useState } from 'react';
import { useDocViewerPageContext } from '../../doc-viewer.context';
import { createMarkId } from '../../utils/markup';
import type { TextDraft } from '../../utils/markup-draft';
import type { MarkupLayerInput } from './use-markup';

/** The text box being typed, and writing it into the marks; both are read out */
export function useTextDraft({
  pageNumber,
  markup,
}: Pick<MarkupLayerInput, 'pageNumber' | 'markup'>) {
  const { labels } = useDocViewerPageContext();
  const [textDraft, setTextDraft] = useState<TextDraft | null>(null);

  const commitText = () => {
    const text = textDraft?.text.trimEnd();
    setTextDraft(null);
    if (!text) {
      return;
    }
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
    markup.announce(labels.markAddedLabel(labels.markupToolLabels.text));
  };

  const cancelText = () => {
    setTextDraft(null);
    markup.announce(labels.markCancelledLabel);
  };

  return { textDraft, setTextDraft, commitText, cancelText };
}
