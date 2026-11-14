import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';

const cache = new WeakMap<PDFDocumentProxy, Map<number, Promise<TextContent>>>();

/**
 * Text of a page, shared by the text layer and search so that each page is extracted once.
 * Cached per document, entries go away with the document.
 */
export function getPageTextContent(document: PDFDocumentProxy, pageNumber: number) {
  let pages = cache.get(document);
  if (!pages) {
    pages = new Map();
    cache.set(document, pages);
  }

  let textContent = pages.get(pageNumber);
  if (!textContent) {
    textContent = document.getPage(pageNumber).then((page) => page.getTextContent());
    textContent.catch(() => pages!.delete(pageNumber));
    pages.set(pageNumber, textContent);
  }

  return textContent;
}

/** Text items in the same order as pdf.js `TextLayer` creates its spans */
export function getTextItems(textContent: TextContent): TextItem[] {
  return textContent.items.filter((item): item is TextItem => 'str' in item);
}
