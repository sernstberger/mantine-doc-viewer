import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useRef } from 'react';

function release(document: PDFDocumentProxy, pageNumber: number) {
  document
    .getPage(pageNumber)
    .then((page) => page.cleanup())
    .catch(() => {});
}

/**
 * Frees what pdf.js keeps for a page (fonts, images, operator lists) once the page has been
 * drawn and is released, or unmounts. Pages that were never drawn are left alone, so mounting
 * 1000 placeholders does not load 1000 pages. pdf.js skips the clean up while the page is still
 * being drawn elsewhere, for example as a thumbnail
 */
export function useReleasePage(document: PDFDocumentProxy, pageNumber: number, near: boolean) {
  const drawn = useRef(false);

  useEffect(() => {
    if (near) {
      drawn.current = true;
      return undefined;
    }

    if (drawn.current) {
      drawn.current = false;
      release(document, pageNumber);
    }

    return undefined;
  }, [document, pageNumber, near]);

  useEffect(
    () => () => {
      drawn.current && release(document, pageNumber);
    },
    [document, pageNumber]
  );
}
