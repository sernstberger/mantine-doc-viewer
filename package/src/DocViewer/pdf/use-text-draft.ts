import { useState } from 'react';
import { useDocViewerPageContext } from '../DocViewer.context';
import { createMarkId } from './markup';
import type { TextDraft } from './markup-draft';
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
    markup.announce(labels.markAdded(labels.markupTools.text));
  };

  const cancelText = () => {
    setTextDraft(null);
    markup.announce(labels.markCancelled);
  };

  return { textDraft, setTextDraft, commitText, cancelText };
}
