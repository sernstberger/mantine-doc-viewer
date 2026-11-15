import type { DocViewerSaveHandler } from '../doc-viewer.context';
import type { DocViewerMarkupOptions } from '../DocViewerMarkup/markup-extension';
import type { DocViewerPageEditorOptions } from '../DocViewerPageEditor/page-editor-extension';
import { saveBytes } from '../utils/files';
import { getEditedFileName } from '../utils/page-edits';

interface SaveHandlerInput {
  editor: DocViewerPageEditorOptions | undefined;
  markup: DocViewerMarkupOptions | undefined;
  fileName: string | undefined;
}

const DOWNLOAD_SUFFIXES: Record<string, string> = {
  save: 'edited',
  extract: 'pages',
  annotate: 'annotated',
};

/**
 * Where the bytes of an edit go: the extension's `onDocumentChange` or `onExtract`, otherwise a
 * download for saved, extracted and marked up documents. A reorder or delete without a handler
 * only changes what is shown
 */
export function getSaveHandler({
  editor,
  markup,
  fileName,
}: SaveHandlerInput): DocViewerSaveHandler | undefined {
  if (!editor && !markup) {
    return undefined;
  }

  return (bytes, { reason, pages }) => {
    if (reason === 'extract' && editor?.onExtract) {
      return editor.onExtract(bytes, { pages });
    }
    if (reason === 'annotate' && markup?.onDocumentChange) {
      return markup.onDocumentChange(bytes, { reason, pages });
    }
    if (reason !== 'extract' && reason !== 'annotate' && editor?.onDocumentChange) {
      return editor.onDocumentChange(bytes, { reason, pages });
    }
    if (DOWNLOAD_SUFFIXES[reason]) {
      saveBytes(bytes, getEditedFileName(fileName, DOWNLOAD_SUFFIXES[reason]), 'application/pdf');
    }
    return undefined;
  };
}
