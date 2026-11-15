import { useEffect } from 'react';
import { useDocViewerContext } from '../../doc-viewer.context';
import type { useEditedDocument } from './use-pdf-edits';
import { useReturnFocus } from './use-return-focus';

/**
 * The modes that replace the toolbar, presentations and the page editor: opening the editor, the
 * refs of the buttons that take focus back when a mode ends, and saying that a presentation started
 */
export function usePdfModes(
  { setEditing, editing }: ReturnType<typeof useEditedDocument>,
  presenting: boolean,
  announce: (message: string) => void
) {
  const { labels } = useDocViewerContext();

  useEffect(() => {
    presenting && announce(labels.presentationStarted);
    // Only when a presentation starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenting]);

  return {
    setEditing,
    presentRef: useReturnFocus(presenting),
    editPagesRef: useReturnFocus(editing),
  };
}

export type PdfModes = ReturnType<typeof usePdfModes>;
