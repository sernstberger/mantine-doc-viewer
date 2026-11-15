import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';
import type { DocViewerContextValue } from '../../doc-viewer.context';
import { saveBytes } from '../../utils/files';
import {
  buildExtractRequest,
  getEditedFileName,
  initialOrder,
  movePage,
  removeSelected,
  type PdfSaveReason,
} from '../../utils/page-edits';
import { focusThumbnail, getFocusedThumbnailViewer } from '../../utils/thumbnail-focus';
import type { PdfMarkup } from './use-markup';

/**
 * Page editing makes a new document, which the viewer then shows instead of `src`. With keepView
 * the view is not remounted for a new src, but edits belong to the old document, so they go
 */
export function useEditedDocument(src: DocViewerContextValue['src']) {
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<Uint8Array | null>(null);
  const [editedSrc, setEditedSrc] = useState(src);
  if (editedSrc !== src) {
    setEditedSrc(src);
    setEditedData(null);
    setEditing(false);
  }
  return { editing, setEditing, editedData, setEditedData };
}

interface PdfEditsInput {
  /** The document shown, null while it loads */
  document: PDFDocumentProxy | null;
  numPages: number;
  editedData: Uint8Array | null;
  setEditedData: (bytes: Uint8Array) => void;
  scrollToPage: (page: number) => void;
  announce: (message: string) => void;
  labels: DocViewerContextValue['labels'];
  onSave: DocViewerContextValue['onSave'];
  fileName: string | undefined;
  markup: PdfMarkup;
}

/** Saving edited PDFs: from the page editor, the markup tools, and thumbnail drags and deletes */
export function usePdfEdits({
  document,
  numPages,
  editedData,
  setEditedData,
  scrollToPage,
  announce,
  labels,
  onSave,
  fileName,
  markup,
}: PdfEditsInput) {
  const savePdf = async (bytes: Uint8Array, reason: PdfSaveReason, pages: number[]) => {
    if (onSave) {
      await onSave(bytes, { reason, pages });
    } else {
      const suffixes = { extract: 'pages', annotate: 'annotated' } as Record<string, string>;
      const suffix = suffixes[reason] ?? 'edited';
      saveBytes(bytes, getEditedFileName(fileName, suffix), 'application/pdf');
    }
  };

  // An edited document starts at its first page, or where a dragged page landed. The effect
  // waits for the new document: right after the bytes change, the old one is still loaded
  const pageAfterEdit = useRef(1);
  const replacedDocument = useRef<unknown>(null);
  // A sidebar edit reloads the document and the thumbnails with it: focus comes back to the page
  const thumbnailViewer = useRef<Element | null>(null);
  const showEdited = (bytes: Uint8Array, page = 1) => {
    pageAfterEdit.current = page;
    replacedDocument.current = document;
    setEditedData(bytes);
  };
  useEffect(() => {
    if (editedData && document && document !== replacedDocument.current) {
      scrollToPage(pageAfterEdit.current);
      replacedDocument.current = document;
      focusThumbnail(thumbnailViewer.current, pageAfterEdit.current);
      thumbnailViewer.current = null;
    }
    // Only when a new edited document is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedData, document]);

  /** Writes the marks into the PDF and saves it, with the pages that have marks */
  const saveMarkup = async () => {
    if (!document || markup.marks.length === 0) {
      return;
    }
    const bytes = await markup.save(document);
    const pages = [...new Set(markup.marks.map((mark) => mark.page))].sort((a, b) => a - b);
    await savePdf(bytes, 'annotate', pages);
    announce(labels.markupSavedLabel);
  };

  /** Moves a page by dragging its thumbnail: the viewer shows the reordered document */
  const reorderPages = async (page: number, toIndex: number) => {
    thumbnailViewer.current = getFocusedThumbnailViewer();
    const order = movePage(initialOrder(numPages), page, toIndex);
    const bytes = (await document!.extractPages(buildExtractRequest(order))) as Uint8Array;
    showEdited(bytes, toIndex + 1);
    announce(labels.pageMovedLabel(page, toIndex + 1));
    // Only an app that saves edits hears about it; a drag never starts a download
    await onSave?.(bytes, { reason: 'reorder', pages: order });
  };

  /** Removes a page with its thumbnail's delete button: the viewer shows the shorter document */
  const deletePage = async (page: number) => {
    thumbnailViewer.current = getFocusedThumbnailViewer();
    // Thumbnails only offer delete while there are two pages or more
    const order = removeSelected(initialOrder(numPages), new Set([page]));
    const bytes = (await document!.extractPages(buildExtractRequest(order))) as Uint8Array;
    showEdited(bytes, Math.min(page, order.length));
    announce(labels.pagesRemovedLabel(1));
    await onSave?.(bytes, { reason: 'delete', pages: order });
  };

  return { savePdf, saveMarkup, reorderPages, deletePage, showEdited };
}
