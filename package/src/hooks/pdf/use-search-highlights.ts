import { useEffect, useRef, useState } from 'react';
import { getScrollBehavior } from '../../utils/scroll';
import {
  ACTIVE_MATCH_HIGHLIGHT,
  addHighlightRanges,
  MATCH_HIGHLIGHT,
} from '../../utils/highlights';
import { getMatchRanges, getMatchSegments, SearchMatch } from '../../utils/search';
import type { SearchablePage } from './use-pdf-search';

/** Text layer spans of the pages that are rendered, and who to tell when a page's spans change */
export interface TextLayers {
  layers: Map<number, HTMLElement[]>;
  onTextLayer: (page: number, textDivs: HTMLElement[] | null) => void;

  /** Calls `listener` with the page number whenever a page's text layer renders or goes; returns the unsubscribe */
  subscribe: (listener: (page: number) => void) => () => void;
}

/**
 * Text layer spans of the pages that are rendered. Not React state: a text layer rendering
 * re-paints the highlights of its own page, without rendering the viewer and its page list again
 */
export function useTextLayers(): TextLayers {
  const [textLayers] = useState(() => {
    const layers = new Map<number, HTMLElement[]>();
    const listeners = new Set<(page: number) => void>();
    return {
      layers,
      onTextLayer: (page: number, textDivs: HTMLElement[] | null) => {
        textDivs ? layers.set(page, textDivs) : layers.delete(page);
        listeners.forEach((listener) => listener(page));
      },
      subscribe: (listener: (page: number) => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    };
  });

  return textLayers;
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
  textLayers: TextLayers;
  pages: SearchablePage[] | null;
  matches: SearchMatch[];
  activeMatch: SearchMatch | undefined;
  scrollRoot: HTMLElement | null;
  /** The window scrolls instead of `scrollRoot` (`autosize`) */
  viewport?: boolean;
  scrollToPage: (page: number) => void;
}

function groupByPage(matches: SearchMatch[]) {
  const byPage = new Map<number, SearchMatch[]>();
  matches.forEach((match) => {
    const forPage = byPage.get(match.pageNumber);
    forPage ? forPage.push(match) : byPage.set(match.pageNumber, [match]);
  });
  return byPage;
}

/**
 * Highlights every match on the pages whose text layer is rendered, and brings a new active
 * match into view: first its page, so the page and its text layer render, then the match itself
 * once its ranges exist. A text layer that renders or goes re-paints only its own page
 */
export function useSearchHighlights({
  textLayers: { layers, subscribe },
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

    const byPage = groupByPage(matches);
    const painted = new Map<number, () => void>();

    const paint = (pageNumber: number) => {
      painted.get(pageNumber)?.();
      painted.delete(pageNumber);
      const textDivs = layers.get(pageNumber);
      const page = pages[pageNumber - 1];
      const pageMatches = byPage.get(pageNumber);
      if (!textDivs || !page || !pageMatches) {
        return;
      }

      const matchRanges: Range[] = [];
      let activeRanges: Range[] = [];
      pageMatches.forEach((match) => {
        const ranges = getMatchRanges(getMatchSegments(page.text, match, page.items), textDivs);
        if (match === activeMatch) {
          activeRanges = ranges;
        } else {
          matchRanges.push(...ranges);
        }
      });

      const removes = [
        addHighlightRanges(MATCH_HIGHLIGHT, matchRanges),
        addHighlightRanges(ACTIVE_MATCH_HIGHLIGHT, activeRanges),
      ];
      painted.set(pageNumber, () => removes.forEach((remove) => remove()));

      if (pendingScroll.current && activeRanges.length > 0 && scrollRoot) {
        pendingScroll.current = false;
        scrollRangeIntoView(viewport ? null : scrollRoot, activeRanges[0]);
      }
    };

    Array.from(layers.keys()).forEach(paint);
    const unsubscribe = subscribe(paint);

    return () => {
      unsubscribe();
      painted.forEach((remove) => remove());
    };
  }, [pages, matches, activeMatch, layers, subscribe, scrollRoot, viewport]);
}
