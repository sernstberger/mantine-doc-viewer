import type { DocViewerMark } from './markup';
import type { PdfRotation } from './render-page';
import type { PdfMarkup } from './use-markup';

/** What the markup layer's hooks read: the page it sits on and the markup state */
export interface MarkupLayerInput {
  pageNumber: number;

  /** Page size at 100%, before the viewer's rotation */
  width: number;
  height: number;
  scale: number;
  rotation: PdfRotation;
  markup: PdfMarkup;
}

export const addMark = (markup: PdfMarkup, mark: DocViewerMark) =>
  markup.setMarks([...markup.marks, mark]);
