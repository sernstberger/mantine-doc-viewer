import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocViewerHighlightTarget } from '../controller';
import { ACTIVE_MATCH_HIGHLIGHT, addHighlightRanges } from './highlights';
import { getPointOffset, type DocViewerPageRect } from './page-points';
import type { PdfRotation } from './render-page';
import { findMatches, getMatchRanges, getMatchSegments } from './search';
import { useSearchablePages } from './use-pdf-search';
import { scrollRangeIntoView } from './use-search-highlights';

/** Space kept above boxes that are scrolled to, in px at 100% */
const RECTS_SCROLL_MARGIN = 48;

interface PassageHighlightInput {
  document: PDFDocumentProxy | null;

  /** Text layer spans of the pages that are rendered, and a version that changes when they do */
  layers: Map<number, HTMLElement[]>;
  layersVersion: number;

  scrollRoot: HTMLElement | null;
  scrollToPage: (page: number, offset?: number | ((pageHeight: number) => number)) => void;
  scale: number;
  rotation: PdfRotation;
}

/**
 * A passage marked from outside the viewer (`controller.highlight`): the first place a text is
 * found is painted as the active search match and scrolled to, boxes are returned for the pages to
 * draw. Only one passage is marked at a time
 */
export function usePassageHighlight({
  document,
  layers,
  layersVersion,
  scrollRoot,
  scrollToPage,
  scale,
  rotation,
}: PassageHighlightInput) {
  const [target, setTarget] = useState<DocViewerHighlightTarget | null>(null);
  const textTarget = target && 'text' in target ? target : null;
  const pages = useSearchablePages(document, !!textTarget);
  const pendingScroll = useRef(false);

  const match = useMemo(() => {
    if (!pages || !textTarget) {
      return undefined;
    }

    return findMatches(
      pages.map((page) => page.text),
      textTarget.text,
      { matchCase: textTarget.matchCase }
    ).find((found) => !textTarget.page || found.pageNumber === textTarget.page);
  }, [pages, textTarget]);

  // A new document has other pages: the passage is gone
  useEffect(() => setTarget(null), [document]);

  useEffect(() => {
    if (match) {
      pendingScroll.current = true;
      scrollToPage(match.pageNumber);
    }
  }, [match, scrollToPage]);

  useEffect(() => {
    const textDivs = match && layers.get(match.pageNumber);
    const page = match && pages?.[match.pageNumber - 1];
    if (!match || !textDivs || !page) {
      return undefined;
    }

    const ranges = getMatchRanges(getMatchSegments(page.text, match, page.items), textDivs);
    const remove = addHighlightRanges(ACTIVE_MATCH_HIGHLIGHT, ranges);
    if (pendingScroll.current && ranges.length > 0 && scrollRoot) {
      pendingScroll.current = false;
      scrollRangeIntoView(scrollRoot, ranges[0]);
    }

    return remove;
  }, [match, pages, layers, layersVersion, scrollRoot]);

  const highlight = (next: DocViewerHighlightTarget) => {
    // A copy, so marking the same passage again scrolls to it again
    setTarget({ ...next });
    if ('rects' in next && next.rects.length > 0) {
      const top = Math.min(...next.rects.map((rect) => rect.y));
      scrollToPage(next.page, (pageHeight) =>
        getPointOffset(Math.max(top - RECTS_SCROLL_MARGIN, 0), scale, rotation, pageHeight)
      );
    }
  };

  const clear = useCallback(() => setTarget(null), []);

  const rects: { page: number; rects: DocViewerPageRect[] } | null =
    target && 'rects' in target ? target : null;

  return { highlight, clear, rects };
}
