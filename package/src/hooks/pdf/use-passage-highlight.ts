import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocViewerHighlightTarget } from '../use-controller-registry';
import { ACTIVE_MATCH_HIGHLIGHT, addHighlightRanges } from '../../utils/highlights';
import { getPointOffset, type DocViewerPageRect } from '../../utils/page-points';
import type { PdfRotation } from '../../utils/render-page';
import {
  findMatches,
  getMatchRanges,
  getMatchSegments,
  type SearchMatch,
} from '../../utils/search';
import { type SearchablePage, useSearchablePages } from './use-pdf-search';
import { scrollRangeIntoView, type TextLayers } from './use-search-highlights';

/** Space kept above boxes that are scrolled to, in px at 100% */
const RECTS_SCROLL_MARGIN = 48;

interface PassageHighlightInput {
  document: PDFDocumentProxy | null;

  /** Text layer spans of the pages that are rendered */
  textLayers: TextLayers;

  scrollRoot: HTMLElement | null;
  /** The window scrolls instead of `scrollRoot` (`height="auto"`) */
  viewport: boolean;
  scrollToPage: (page: number, offset?: number | ((pageHeight: number) => number)) => void;
  scale: number;
  rotation: PdfRotation;
}

interface PassagePaintInput extends Pick<
  PassageHighlightInput,
  'textLayers' | 'scrollRoot' | 'viewport' | 'scrollToPage'
> {
  match: SearchMatch | undefined;
  /** The text of the match's page */
  page: SearchablePage | undefined;
}

/**
 * Brings a new match into view, first its page and then the match itself, and paints it as the
 * active search match: again whenever its page renders its text layer, or loses it
 */
function usePassagePaint({
  match,
  page,
  textLayers: { layers, subscribe },
  scrollRoot,
  viewport,
  scrollToPage,
}: PassagePaintInput) {
  const pendingScroll = useRef(false);

  useEffect(() => {
    if (match) {
      pendingScroll.current = true;
      scrollToPage(match.pageNumber);
    }
  }, [match, scrollToPage]);

  useEffect(() => {
    if (!match || !page) {
      return undefined;
    }

    let remove = () => {};
    const paint = (pageNumber: number) => {
      if (pageNumber !== match.pageNumber) {
        return;
      }

      remove();
      const textDivs = layers.get(pageNumber);
      const ranges = textDivs
        ? getMatchRanges(getMatchSegments(page.text, match, page.items), textDivs)
        : [];
      remove = addHighlightRanges(ACTIVE_MATCH_HIGHLIGHT, ranges);
      if (pendingScroll.current && ranges.length > 0 && scrollRoot) {
        pendingScroll.current = false;
        scrollRangeIntoView(viewport ? null : scrollRoot, ranges[0]);
      }
    };

    paint(match.pageNumber);
    const unsubscribe = subscribe(paint);
    return () => {
      unsubscribe();
      remove();
    };
  }, [match, page, layers, subscribe, scrollRoot, viewport]);
}

/**
 * A passage marked from outside the viewer (`controller.highlight`): the first place a text is
 * found is painted as the active search match and scrolled to, boxes are returned for the pages to
 * draw. Only one passage is marked at a time
 */
export function usePassageHighlight({
  document,
  textLayers,
  scrollRoot,
  viewport,
  scrollToPage,
  scale,
  rotation,
}: PassageHighlightInput) {
  const [target, setTarget] = useState<DocViewerHighlightTarget | null>(null);
  const textTarget = target && 'text' in target ? target : null;
  const pages = useSearchablePages(document, !!textTarget);
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

  useEffect(() => setTarget(null), [document]);

  usePassagePaint({
    match,
    page: match && pages![match.pageNumber - 1],
    textLayers,
    scrollRoot,
    viewport,
    scrollToPage,
  });

  const highlight = (next: DocViewerHighlightTarget) => {
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
