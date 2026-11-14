import { ActionIcon, Group, Loader, Text, Tooltip } from '@mantine/core';
import { useDebouncedValue, useElementSize, useMergedRef } from '@mantine/hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { ChevronDownIcon, ChevronUpIcon, FitWidthIcon, SearchIcon, SidebarIcon } from '../icons';
import { DocViewerMessage } from '../views/MessageView';
import { ACTIVE_MATCH_HIGHLIGHT, addHighlightRanges, MATCH_HIGHLIGHT } from './highlights';
import { PdfPage } from './PdfPage';
import { PdfSearchBar } from './PdfSearchBar';
import { PdfThumbnails } from './PdfThumbnails';
import { getMatchRanges, getMatchSegments } from './search';
import { usePdfDocument } from './use-pdf-document';
import { usePdfSearch } from './use-pdf-search';
import { ZoomControls } from '../ZoomControls';
import { getFitWidthScale, PdfZoom } from './zoom';

/** Space left above a page when scrolling to it */
const PAGE_SCROLL_OFFSET = 12;

/** Smooth scrolling, unless the user prefers reduced motion */
function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/** Longest a programmatic scroll is expected to take, used when `scrollend` is not supported */
const SCROLL_SETTLE_TIMEOUT = 1000;

/** Tracks which page takes up most of the scroll container */
function useCurrentPage(scrollRoot: HTMLElement | null) {
  const [currentPage, setCurrentPage] = useState(1);
  const pages = useRef(new Map<number, HTMLDivElement>());
  const ratios = useRef(new Map<number, number>());
  const observer = useRef<IntersectionObserver | null>(null);

  // While scrolling to a page, the pages passed on the way are ignored so the counter
  // shows the target page instead of counting through every page in between
  const scrollTarget = useRef<number | null>(null);
  const settleScroll = useRef<(() => void) | null>(null);

  useEffect(() => () => settleScroll.current?.(), []);

  useEffect(() => {
    if (!scrollRoot || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNumber = Number((entry.target as HTMLElement).dataset.pageNumber);
          ratios.current.set(pageNumber, entry.intersectionRatio);
        });

        let best = 0;
        let bestRatio = 0;
        ratios.current.forEach((ratio, pageNumber) => {
          if (ratio > bestRatio) {
            best = pageNumber;
            bestRatio = ratio;
          }
        });

        best && scrollTarget.current === null && setCurrentPage(best);
      },
      { root: scrollRoot, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    pages.current.forEach((node) => observer.current?.observe(node));

    return () => {
      observer.current?.disconnect();
      observer.current = null;
    };
  }, [scrollRoot]);

  const registerPage = useCallback((pageNumber: number, node: HTMLDivElement | null) => {
    const previous = pages.current.get(pageNumber);
    previous && observer.current?.unobserve(previous);

    if (node) {
      pages.current.set(pageNumber, node);
      observer.current?.observe(node);
    } else {
      pages.current.delete(pageNumber);
      ratios.current.delete(pageNumber);
    }
  }, []);

  // Only the viewer scrolls: scrollIntoView() would also scroll the page around the viewer
  const scrollToPage = useCallback(
    (pageNumber: number) => {
      const node = pages.current.get(pageNumber);
      setCurrentPage(pageNumber);

      if (!node || !scrollRoot) {
        return;
      }

      // Finish any scroll still in progress, so its listener cannot end this one early
      settleScroll.current?.();
      scrollTarget.current = pageNumber;

      const settle = () => {
        window.clearTimeout(timeout);
        scrollRoot.removeEventListener('scrollend', settle);
        scrollTarget.current = null;
        settleScroll.current = null;
      };
      const timeout = window.setTimeout(settle, SCROLL_SETTLE_TIMEOUT);
      scrollRoot.addEventListener('scrollend', settle);
      settleScroll.current = settle;
      scrollRoot.scrollTo({
        top: node.offsetTop - PAGE_SCROLL_OFFSET,
        behavior: getScrollBehavior(),
      });
    },
    [scrollRoot]
  );

  return { currentPage, registerPage, scrollToPage };
}

/** Text layer spans of pages that are currently rendered, with a version that changes when they do */
function useTextLayers() {
  const layers = useRef(new Map<number, HTMLElement[]>());
  const [version, setVersion] = useState(0);

  const onTextLayer = useCallback((pageNumber: number, textDivs: HTMLElement[] | null) => {
    textDivs ? layers.current.set(pageNumber, textDivs) : layers.current.delete(pageNumber);
    setVersion((current) => current + 1);
  }, []);

  return { layers: layers.current, version, onTextLayer };
}

/** Scrolls the container so that the range is in the middle of it */
function scrollRangeIntoView(container: HTMLElement, range: Range) {
  const rangeRect = range.getBoundingClientRect();
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

export function PdfView() {
  const { getStyles, src, pdfWorkerSrc, defaultThumbnailsOpened } = useDocViewerContext();
  const state = usePdfDocument(src, pdfWorkerSrc);
  const [zoom, setZoom] = useState<PdfZoom>('fit-width');
  const { ref: bodyRef, width: bodyWidth } = useElementSize<HTMLDivElement>();
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const { currentPage, registerPage, scrollToPage } = useCurrentPage(scrollRoot);
  const { layers, version: textLayersVersion, onTextLayer } = useTextLayers();
  const [searchOpened, setSearchOpened] = useState(false);
  const [thumbnailsOpened, setThumbnailsOpened] = useState(defaultThumbnailsOpened ?? false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingScroll = useRef(false);

  const setBodyRef = useMergedRef(bodyRef, setScrollRoot);

  const ready = state.status === 'ready' ? state : null;
  const numPages = ready?.document.numPages ?? 0;
  const scale = ready
    ? zoom === 'fit-width'
      ? getFitWidthScale(bodyWidth, ready.firstPageSize.width)
      : zoom
    : 1;

  const search = usePdfSearch(ready?.document ?? null, searchOpened ? debouncedQuery : '');
  const activeMatch = search.matches[search.activeIndex];

  // A new active match scrolls into view: first to its page, so that the page and its
  // text layer render, then to the match itself once its ranges exist
  useEffect(() => {
    if (activeMatch) {
      pendingScroll.current = true;
      scrollToPage(activeMatch.pageNumber);
    }
  }, [activeMatch, scrollToPage]);

  useEffect(() => {
    if (!search.pages) {
      return undefined;
    }

    const cleanups: (() => void)[] = [];
    const matchRanges: Range[] = [];
    let activeRanges: Range[] = [];

    search.matches.forEach((match) => {
      const textDivs = layers.get(match.pageNumber);
      const page = search.pages![match.pageNumber - 1];
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

    cleanups.push(addHighlightRanges(MATCH_HIGHLIGHT, matchRanges));
    cleanups.push(addHighlightRanges(ACTIVE_MATCH_HIGHLIGHT, activeRanges));

    if (pendingScroll.current && activeRanges.length > 0 && scrollRoot) {
      pendingScroll.current = false;
      scrollRangeIntoView(scrollRoot, activeRanges[0]);
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [search.pages, search.matches, activeMatch, layers, textLayersVersion, scrollRoot]);

  const openSearch = () => {
    setSearchOpened(true);
    // Focus after the search bar has rendered
    requestAnimationFrame(() => searchInputRef.current?.select());
  };

  const closeSearch = () => {
    setSearchOpened(false);
    setQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (ready && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      openSearch();
    }
  };

  useEffect(() => {
    if (state.status === 'error' && state.reason === 'worker') {
      // eslint-disable-next-line no-console
      console.error(state.error.message);
    }
  }, [state]);

  const controls = ready && (
    <>
      <Tooltip label={thumbnailsOpened ? 'Hide pages' : 'Show pages'}>
        <ActionIcon
          variant={thumbnailsOpened ? 'light' : 'subtle'}
          color="gray"
          aria-label="Page thumbnails"
          aria-pressed={thumbnailsOpened}
          onClick={() => setThumbnailsOpened((opened) => !opened)}
        >
          <SidebarIcon />
        </ActionIcon>
      </Tooltip>

      <Group gap={2} wrap="nowrap">
        <Tooltip label="Previous page">
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(currentPage - 1)}
          >
            <ChevronUpIcon />
          </ActionIcon>
        </Tooltip>
        <Text size="sm" {...getStyles('pageIndicator')} aria-live="polite">
          {currentPage} / {numPages}
        </Text>
        <Tooltip label="Next page">
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Next page"
            disabled={currentPage >= numPages}
            onClick={() => scrollToPage(currentPage + 1)}
          >
            <ChevronDownIcon />
          </ActionIcon>
        </Tooltip>
      </Group>

      <ZoomControls
        scale={scale}
        fitted={zoom === 'fit-width'}
        fitLabel="Fit to width"
        fitIcon={<FitWidthIcon />}
        onZoom={setZoom}
        onFit={() => setZoom('fit-width')}
      />

      <Tooltip label="Search">
        <ActionIcon
          variant={searchOpened ? 'light' : 'subtle'}
          color="gray"
          aria-label="Search"
          aria-pressed={searchOpened}
          onClick={() => (searchOpened ? closeSearch() : openSearch())}
        >
          <SearchIcon />
        </ActionIcon>
      </Tooltip>
    </>
  );

  return (
    <>
      <DocViewerToolbar>{controls}</DocViewerToolbar>
      {ready && searchOpened && (
        <PdfSearchBar
          inputRef={searchInputRef}
          query={query}
          onQueryChange={setQuery}
          matchCount={search.matches.length}
          activeIndex={search.activeIndex}
          searching={search.searching || query !== debouncedQuery}
          onNext={search.next}
          onPrevious={search.previous}
          onClose={closeSearch}
        />
      )}
      <div {...getStyles('main')}>
        {ready && thumbnailsOpened && (
          <PdfThumbnails
            document={ready.document}
            placeholderSize={ready.firstPageSize}
            currentPage={currentPage}
            onSelect={scrollToPage}
          />
        )}
        <div
          ref={setBodyRef}
          {...getStyles('body')}
          tabIndex={ready ? 0 : undefined}
          onKeyDown={handleKeyDown}
        >
          {state.status === 'loading' && (
            <DocViewerMessage>
              <Loader size="sm" aria-label="Loading document" />
            </DocViewerMessage>
          )}

          {state.status === 'error' && (
            <DocViewerMessage withDownload>
              {state.reason === 'worker'
                ? 'PDF preview is not configured: set the pdfWorkerSrc prop'
                : 'This PDF could not be opened'}
            </DocViewerMessage>
          )}

          {ready && (
            <div {...getStyles('pages')}>
              {Array.from({ length: numPages }, (_, index) => (
                <PdfPage
                  key={index + 1}
                  pdfjs={ready.pdfjs}
                  document={ready.document}
                  pageNumber={index + 1}
                  scale={scale}
                  placeholderSize={ready.firstPageSize}
                  scrollRoot={scrollRoot}
                  registerPage={registerPage}
                  onTextLayer={onTextLayer}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
