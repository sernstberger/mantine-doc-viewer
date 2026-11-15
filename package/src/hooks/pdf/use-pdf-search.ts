import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { useEffect, useMemo, useState } from 'react';
import { buildPageText, findMatches, PageText, SearchOptions } from '../../utils/search';
import { getPageTextContent, getTextItems } from '../../utils/text-content';

export interface SearchablePage {
  text: PageText;
  items: TextItem[];
}

/** Pages read at once: enough to keep the worker busy, few enough to stop soon when cancelled */
export const SEARCH_BATCH_SIZE = 8;

/**
 * Searchable text per page, shared by search and passage highlights so that each page is built
 * once and both search the same `PageText` (whose normalised forms are cached). Entries go away
 * with the document
 */
const searchablePages = new WeakMap<PDFDocumentProxy, Map<number, SearchablePage>>();

async function readSearchablePage(document: PDFDocumentProxy, pageNumber: number) {
  let pages = searchablePages.get(document);
  if (!pages) {
    pages = new Map();
    searchablePages.set(document, pages);
  }

  const cached = pages.get(pageNumber);
  if (cached) {
    return cached;
  }

  try {
    const items = getTextItems(await getPageTextContent(document, pageNumber));
    const page = { text: buildPageText(items), items };
    pages.set(pageNumber, page);
    return page;
  } catch {
    return { text: buildPageText([]), items: [] };
  }
}

/**
 * Text of every page, read a batch at a time rather than all pages at once. Stops between
 * batches once `cancelled()` is true and gives `null`; pages read so far stay cached
 */
export async function readSearchablePages(
  document: PDFDocumentProxy,
  cancelled: () => boolean
): Promise<SearchablePage[] | null> {
  const pages: SearchablePage[] = [];
  for (let first = 1; first <= document.numPages; first += SEARCH_BATCH_SIZE) {
    if (cancelled()) {
      return null;
    }
    const last = Math.min(first + SEARCH_BATCH_SIZE - 1, document.numPages);
    const batch = Array.from({ length: last - first + 1 }, (_, index) =>
      readSearchablePage(document, first + index)
    );
    pages.push(...(await Promise.all(batch)));
  }
  return pages;
}

/** Extracts the text of every page the first time `enabled` is true */
export function useSearchablePages(document: PDFDocumentProxy | null, enabled: boolean) {
  const [pages, setPages] = useState<SearchablePage[] | null>(null);

  useEffect(() => {
    setPages(null);
  }, [document]);

  useEffect(() => {
    if (!document || !enabled || pages) {
      return undefined;
    }

    let cancelled = false;
    readSearchablePages(document, () => cancelled).then(
      (result) => !cancelled && result && setPages(result)
    );

    return () => {
      cancelled = true;
    };
  }, [document, enabled, pages]);

  return pages;
}

export function usePdfSearch(
  document: PDFDocumentProxy | null,
  query: string,
  options: SearchOptions = {}
) {
  const { matchCase, wholeWords, matchAccents } = options;
  const enabled = query.trim().length > 0;
  const pages = useSearchablePages(document, enabled);
  const matches = useMemo(
    () =>
      pages && enabled
        ? findMatches(
            pages.map((page) => page.text),
            query,
            { matchCase, wholeWords, matchAccents }
          )
        : [],
    [pages, query, enabled, matchCase, wholeWords, matchAccents]
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
