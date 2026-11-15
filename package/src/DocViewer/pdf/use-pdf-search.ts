import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { useEffect, useMemo, useState } from 'react';
import { buildPageText, findMatches, PageText } from './search';
import { getPageTextContent, getTextItems } from './text-content';

export interface SearchablePage {
  text: PageText;
  items: TextItem[];
}

/** Extracts the text of every page the first time `enabled` is true */
function useSearchablePages(document: PDFDocumentProxy | null, enabled: boolean) {
  const [pages, setPages] = useState<SearchablePage[] | null>(null);

  useEffect(() => {
    setPages(null);
  }, [document]);

  useEffect(() => {
    if (!document || !enabled || pages) {
      return undefined;
    }

    let cancelled = false;
    // A page whose text cannot be read is searched as empty, so the other pages still are
    Promise.all(
      Array.from({ length: document.numPages }, (_, index) =>
        getPageTextContent(document, index + 1).then(
          (textContent) => {
            const items = getTextItems(textContent);
            return { text: buildPageText(items), items };
          },
          () => ({ text: buildPageText([]), items: [] })
        )
      )
    ).then((result) => !cancelled && setPages(result));

    return () => {
      cancelled = true;
    };
  }, [document, enabled, pages]);

  return pages;
}

export function usePdfSearch(document: PDFDocumentProxy | null, query: string) {
  const enabled = query.trim().length > 0;
  const pages = useSearchablePages(document, enabled);
  const matches = useMemo(
    () =>
      pages && enabled
        ? findMatches(
            pages.map((page) => page.text),
            query
          )
        : [],
    [pages, query, enabled]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [matches]);

  const step = (direction: 1 | -1) =>
    matches.length > 0 &&
    setActiveIndex((current) => (current + direction + matches.length) % matches.length);

  return {
    pages,
    matches,
    activeIndex,
    searching: enabled && pages === null,
    next: () => step(1),
    previous: () => step(-1),
  };
}
