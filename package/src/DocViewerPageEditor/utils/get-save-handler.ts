import { getEditedFileName, saveBytes } from '../../utils/files';
import type { DocViewerPageEditorOptions } from '../page-editor-extension';
import type { PdfSaveReason } from './page-edits';

/** Where the bytes of a page edit go, with the reason and the pages it was made for */
export type PageEditSaveHandler = (
  bytes: Uint8Array,
  info: { reason: PdfSaveReason; pages: number[] }
) => void | Promise<void>;

const DOWNLOAD_SUFFIXES: Partial<Record<PdfSaveReason, string>> = {
  save: 'edited',
  extract: 'pages',
};

/**
 * Where the bytes of an edit go: the editor's `onDocumentChange` or `onExtract`, otherwise a
 * download for saved and extracted documents. A reorder or delete without a handler only changes
 * what is shown
 */
export function getSaveHandler(
  editor: DocViewerPageEditorOptions,
  fileName: string | undefined
): PageEditSaveHandler {
  return (bytes, { reason, pages }) => {
    if (reason === 'extract' && editor.onExtract) {
      return editor.onExtract(bytes, { pages });
    }
    if (reason !== 'extract' && editor.onDocumentChange) {
      return editor.onDocumentChange(bytes, { reason, pages });
    }
    const suffix = DOWNLOAD_SUFFIXES[reason];
    if (suffix) {
      saveBytes(bytes, getEditedFileName(fileName, suffix), 'application/pdf');
    }
    return undefined;
  };
}
