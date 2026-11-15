import { useCallback, useEffect, useRef, useState } from 'react';
import { getScrollBehavior } from '../scroll';
import { ACTIVE_MATCH_HIGHLIGHT, addHighlightRanges, MATCH_HIGHLIGHT } from './highlights';
import { getMatchRanges, getMatchSegments, SearchMatch } from './search';
import type { SearchablePage } from './use-pdf-search';

/** Text layer spans of pages that are currently rendered, with a version that changes when they do */
export function useTextLayers() {
  const layers = useRef(new Map<number, HTMLElement[]>());
  const [version, setVersion] = useState(0);

  const onTextLayer = useCallback((page: number, textDivs: HTMLElement[] | null) => {
    textDivs ? layers.current.set(page, textDivs) : layers.current.delete(page);
    setVersion((current) => current + 1);
  }, []);

  return { layers: layers.current, version, onTextLayer };
}

/** Scrolls the container so that the range is in the middle of it, or the window when there is no container */
export function scrollRangeIntoView(container: HTMLElement | null, range: Range) {
  const rangeRect = range.getBoundingClientRect();
  if (!container) {
    window.scrollTo({
      top: window.scrollY + rangeRect.top - window.innerHeight / 2 + rangeRect.height / 2,
      behavior: getScrollBehavior(),
    });
    return;
  }
  const containerRect = container.getBoundingClientRect();
  container.scrollTo({
    top:
      container.scrollTop +
      rangeRect.top -
      containerRect.top -
      container.clientHeight / 2 +
      rangeRect.height / 2,
    left:
      container.scrollLeft +
      rangeRect.left -
      containerRect.left -
      container.clientWidth / 2 +
      rangeRect.width / 2,
    behavior: getScrollBehavior(),
  });
}

interface SearchHighlightsInput {
  textLayers: ReturnType<typeof useTextLayers>;
  pages: SearchablePage[] | null;
  matches: SearchMatch[];
  activeMatch: SearchMatch | undefined;
  scrollRoot: HTMLElement | null;
  /** The window scrolls instead of `scrollRoot` (`height="auto"`) */
  viewport?: boolean;
  scrollToPage: (page: number) => void;
}

/**
 * Highlights every match on the pages whose text layer is rendered, and brings a new active
 * match into view: first its page, so the page and its text layer render, then the match itself
 * once its ranges exist
 */
export function useSearchHighlights({
  textLayers: { layers, version },
  pages,
  matches,
  activeMatch,
  scrollRoot,
  viewport = false,
  scrollToPage,
}: SearchHighlightsInput) {
  const pendingScroll = useRef(false);

  useEffect(() => {
    if (activeMatch) {
      pendingScroll.current = true;
      scrollToPage(activeMatch.pageNumber);
    }
  }, [activeMatch, scrollToPage]);

  useEffect(() => {
    if (!pages) {
      return undefined;
    }

    const matchRanges: Range[] = [];
    let activeRanges: Range[] = [];

    matches.forEach((match) => {
      const textDivs = layers.get(match.pageNumber);
      const page = pages[match.pageNumber - 1];
      if (!textDivs || !page) {
        return;
      }

      const ranges = getMatchRanges(getMatchSegments(page.text, match, page.items), textDivs);
      if (match === activeMatch) {
        activeRanges = ranges;
      } else {
        matchRanges.push(...ranges);
      }
    });

    const cleanups = [
      addHighlightRanges(MATCH_HIGHLIGHT, matchRanges),
      addHighlightRanges(ACTIVE_MATCH_HIGHLIGHT, activeRanges),
    ];

    if (pendingScroll.current && activeRanges.length > 0 && scrollRoot) {
      pendingScroll.current = false;
      scrollRangeIntoView(viewport ? null : scrollRoot, activeRanges[0]);
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [pages, matches, activeMatch, layers, version, scrollRoot, viewport]);
}
