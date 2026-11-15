import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';
import type { DocViewerContextValue } from '../../doc-viewer.context';
import { focusThumbnail, getFocusedThumbnailViewer } from '../../utils/thumbnail-focus';

/**
 * Bytes an extension made (an edited or reordered document), which the viewer then shows instead
 * of `src`. With keepView the view is not remounted for a new src, but the bytes belong to the
 * old document, so they go
 */
export function useEditedDocument(src: DocViewerContextValue['src']) {
  const [editedData, setEditedData] = useState<Uint8Array | null>(null);
  const [editedSrc, setEditedSrc] = useState(src);
  if (editedSrc !== src) {
    setEditedSrc(src);
    setEditedData(null);
  }
  return { editedData, setEditedData };
}

interface ShowBytesInput {
  /** The document shown, null while it loads */
  document: PDFDocumentProxy | null;
  editedData: Uint8Array | null;
  setEditedData: (bytes: Uint8Array) => void;
  scrollToPage: (page: number) => void;
}

/**
 * Shows new bytes in place of the document. The new document starts at `page`; a thumbnail that
 * had focus takes it back once the thumbnails are there again. The effect waits for the new
 * document: right after the bytes change, the old one is still loaded
 */
export function useShowBytes({
  document,
  editedData,
  setEditedData,
  scrollToPage,
}: ShowBytesInput) {
  const pageAfterEdit = useRef(1);
  const replacedDocument = useRef<unknown>(null);
  const thumbnailViewer = useRef<Element | null>(null);

  const showBytes = (bytes: Uint8Array, page = 1) => {
    pageAfterEdit.current = page;
    replacedDocument.current = document;
    thumbnailViewer.current = getFocusedThumbnailViewer();
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

  return showBytes;
}
