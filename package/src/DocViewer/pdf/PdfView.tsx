import { ActionIcon, Group, Popover, SegmentedControl, Text, VisuallyHidden } from '@mantine/core';
import { useDebouncedValue, useElementSize, useMergedRef, useUncontrolled } from '@mantine/hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { useRegisterController } from '../controller';
import type { DocViewerPageLayout, DocViewerThumbnailsPosition } from '../DocViewer';
import { printPdfBytes } from '../print';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FitWidthIcon,
  OutlineIcon,
  TwoPagesIcon,
  PanelPositionIcon,
  SearchIcon,
  SidebarIcon,
} from '../icons';
import { DocViewerLoading, DocViewerMessage } from '../views/MessageView';
import { ACTIVE_MATCH_HIGHLIGHT, addHighlightRanges, MATCH_HIGHLIGHT } from './highlights';
import { PdfOutline, usePdfOutline } from './PdfOutline';
import { PdfPage } from './PdfPage';
import { PdfPassword } from './PdfPassword';
import { PdfSearchBar } from './PdfSearchBar';
import { PdfThumbnails } from './PdfThumbnails';
import { getMatchRanges, getMatchSegments } from './search';
import { usePdfDocument } from './use-pdf-document';
import { usePdfSearch } from './use-pdf-search';
import { ZoomControls } from '../ZoomControls';
import { clampZoom, zoomIn, zoomOut } from '../zoom';
import { getFitWidthScale, PdfZoom } from './zoom';
import { softDisabled } from '../a11y';
import { DocViewerTooltip, useControlProps } from '../controls';

/** Space left above a page when scrolling to it */
const PAGE_SCROLL_OFFSET = 12;

/** Smooth scrolling, unless the user prefers reduced motion */
function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/** Jumps further than this many screens scroll instantly */
const LONG_JUMP_SCREENS = 3;

/** Longest a programmatic scroll is expected to take, used when `scrollend` is not supported */
const SCROLL_SETTLE_TIMEOUT = 1000;

/** Tracks which page takes up most of the scroll container */
function useCurrentPage(scrollRoot: HTMLElement | null) {
  const [currentPage, setCurrentPage] = useState(1);
  const pages = useRef(new Map<number, HTMLDivElement>());
  const visible = useRef(new Set<number>());
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

    // Measured in pixels, not intersection ratios: a page zoomed to several times the
    // height of the viewer never reaches a ratio threshold, yet fills the whole view
    const update = () => {
      if (scrollTarget.current !== null) {
        return;
      }

      const rootRect = scrollRoot.getBoundingClientRect();
      let best = 0;
      let bestHeight = 0;
      visible.current.forEach((pageNumber) => {
        const rect = pages.current.get(pageNumber)?.getBoundingClientRect();
        const height = rect
          ? Math.min(rect.bottom, rootRect.bottom) - Math.max(rect.top, rootRect.top)
          : 0;
        if (height > bestHeight) {
          best = pageNumber;
          bestHeight = height;
        }
      });

      best && setCurrentPage(best);
    };

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNumber = Number((entry.target as HTMLElement).dataset.pageNumber);
          entry.isIntersecting
            ? visible.current.add(pageNumber)
            : visible.current.delete(pageNumber);
        });
        update();
      },
      { root: scrollRoot }
    );
    pages.current.forEach((node) => observer.current?.observe(node));

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      scrollRoot.removeEventListener('scroll', onScroll);
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
      visible.current.delete(pageNumber);
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
      // Long jumps are instant: scrolling smoothly past hundreds of pages would draw each one
      const top = node.offsetTop - PAGE_SCROLL_OFFSET;
      const far =
        Math.abs(top - scrollRoot.scrollTop) > scrollRoot.clientHeight * LONG_JUMP_SCREENS;
      scrollRoot.scrollTo({ top, behavior: far ? 'auto' : getScrollBehavior() });
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
  const {
    getStyles,
    src,
    pdfWorkerSrc,
    pdfOptions,
    defaultThumbnailsOpened,
    thumbnailsPosition,
    defaultThumbnailsPosition,
    onThumbnailsPositionChange,
    labels,
    size,
    controller,
    events,
    page,
    defaultPage,
    defaultZoom,
    defaultPageLayout,
  } = useDocViewerContext();
  const controlProps = useControlProps();
  const title = useDocumentTitle();
  const state = usePdfDocument(src, pdfWorkerSrc, pdfOptions);
  const [zoom, setZoom] = useState<PdfZoom>(defaultZoom === 'fit' ? 'fit-width' : defaultZoom);
  const [layout, setLayout] = useState<DocViewerPageLayout>(defaultPageLayout ?? 'single');
  const twoPages = layout !== 'single';
  const [pagesNode, setPagesNode] = useState<HTMLDivElement | null>(null);
  const [columnGap, setColumnGap] = useState(16);
  const { ref: bodyRef, width: bodyWidth } = useElementSize<HTMLDivElement>();
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const { currentPage, registerPage, scrollToPage } = useCurrentPage(scrollRoot);
  const { layers, version: textLayersVersion, onTextLayer } = useTextLayers();
  const [searchOpened, setSearchOpened] = useState(false);
  const [thumbnailsOpened, setThumbnailsOpened] = useState(defaultThumbnailsOpened ?? false);
  const [position, setPosition] = useUncontrolled<DocViewerThumbnailsPosition>({
    value: thumbnailsPosition,
    defaultValue: defaultThumbnailsPosition,
    finalValue: 'left',
    onChange: onThumbnailsPositionChange,
  });
  const horizontalThumbnails = position === 'top' || position === 'bottom';
  // Thumbnails after the pages in the DOM when they are shown after them, so the focus order matches
  const thumbnailsFirst = position === 'left' || position === 'top';
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const pendingScroll = useRef(false);

  // Read out after moving with the page buttons or thumbnails, but not while scrolling
  const [pageAnnouncement, setPageAnnouncement] = useState('');

  const setBodyRef = useMergedRef(bodyRef, setScrollRoot);

  const ready = state.status === 'ready' ? state : null;
  const numPages = ready?.document.numPages ?? 0;
  // Two pages side by side fit their combined width, with the gap between them
  const scale = ready
    ? zoom === 'fit-width'
      ? twoPages
        ? getFitWidthScale(bodyWidth - columnGap, ready.firstPageSize.width * 2)
        : getFitWidthScale(bodyWidth, ready.firstPageSize.width)
      : zoom
    : 1;

  useEffect(() => {
    if (pagesNode && twoPages) {
      setColumnGap(parseFloat(getComputedStyle(pagesNode).columnGap) || 0);
    }
  }, [pagesNode, twoPages]);

  const outline = usePdfOutline(ready?.document ?? null);
  const [outlineOpened, setOutlineOpened] = useState(false);

  const goToPage = (pageNumber: number, announce = true) => {
    scrollToPage(pageNumber);
    if (!announce) {
      return;
    }
    // Alternates an invisible character, so the same page is read out again when moved to again
    setPageAnnouncement(
      (current) =>
        labels.pageOf(pageNumber, numPages) + (current.endsWith('\u200b') ? '' : '\u200b')
    );
  };

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
    // The search bar held focus, so return it to the button that opens search
    requestAnimationFrame(() => searchToggleRef.current?.focus());
  };

  const print = async () => {
    if (ready) {
      await printPdfBytes(await ready.document.getData());
    }
  };

  // Events
  useEffect(() => {
    if (ready) {
      events.onDocumentLoad({ type: 'pdf', numPages: ready.document.numPages });
    } else if (state.status === 'error') {
      events.onDocumentError(state.error);
    }
  }, [state, ready, events]);

  const pageReported = useRef(0);
  useEffect(() => {
    if (ready && currentPage !== pageReported.current) {
      pageReported.current = currentPage;
      events.onPageChange(currentPage);
    }
  }, [ready, currentPage, events]);

  useEffect(() => {
    ready && events.onZoomChange(scale, zoom === 'fit-width');
  }, [ready, scale, zoom, events]);

  // `defaultPage` once the pages are laid out, then `page` whenever it changes
  const initialPage = page ?? defaultPage;
  useEffect(() => {
    if (ready && scrollRoot && pagesNode && initialPage && initialPage > 1) {
      scrollToPage(Math.min(initialPage, ready.document.numPages));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, scrollRoot, pagesNode]);

  useEffect(() => {
    if (ready && page && page !== pageReported.current) {
      scrollToPage(Math.min(Math.max(page, 1), ready.document.numPages));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useRegisterController(controller, {
    goToPage: (pageNumber) =>
      ready && goToPage(Math.min(Math.max(Math.round(pageNumber), 1), numPages)),
    setZoom: (next) => setZoom(next === 'fit' ? 'fit-width' : clampZoom(next)),
    zoomIn: () => setZoom(zoomIn(scale)),
    zoomOut: () => setZoom(zoomOut(scale)),
    openSearch: (nextQuery) => {
      if (!ready) {
        return;
      }
      nextQuery !== undefined && setQuery(nextQuery);
      openSearch();
    },
    closeSearch: () => searchOpened && closeSearch(),
    toggleThumbnails: (opened) => setThumbnailsOpened((current) => opened ?? !current),
    print,
  });

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
      <DocViewerTooltip label={thumbnailsOpened ? labels.hidePages : labels.showPages}>
        <ActionIcon
          {...controlProps(thumbnailsOpened)}
          aria-label={labels.pageThumbnails}
          aria-pressed={thumbnailsOpened}
          onClick={() => setThumbnailsOpened((opened) => !opened)}
        >
          <SidebarIcon />
        </ActionIcon>
      </DocViewerTooltip>

      {thumbnailsOpened && (
        <Popover position="bottom-end" shadow="md" withinPortal={false} trapFocus returnFocus>
          <Popover.Target>
            <DocViewerTooltip label={labels.thumbnailsPosition}>
              <ActionIcon {...controlProps()} aria-label={labels.thumbnailsPosition}>
                <PanelPositionIcon />
              </ActionIcon>
            </DocViewerTooltip>
          </Popover.Target>
          <Popover.Dropdown p={4}>
            <SegmentedControl
              size={size.input}
              value={position}
              onChange={(value) => setPosition(value as DocViewerThumbnailsPosition)}
              aria-label={labels.thumbnailsPosition}
              data={(['left', 'right', 'top', 'bottom'] as const).map((value) => ({
                value,
                label: labels[value],
              }))}
            />
          </Popover.Dropdown>
        </Popover>
      )}

      <Group gap={2} wrap="nowrap">
        <DocViewerTooltip label={labels.previousPage}>
          <ActionIcon
            {...controlProps()}
            aria-label={labels.previousPage}
            {...softDisabled(currentPage <= 1, () => goToPage(currentPage - 1))}
          >
            <ChevronUpIcon />
          </ActionIcon>
        </DocViewerTooltip>
        <Text {...getStyles('pageIndicator')} title={labels.pageOf(currentPage, numPages)}>
          {currentPage} / {numPages}
        </Text>
        <DocViewerTooltip label={labels.nextPage}>
          <ActionIcon
            {...controlProps()}
            aria-label={labels.nextPage}
            {...softDisabled(currentPage >= numPages, () => goToPage(currentPage + 1))}
          >
            <ChevronDownIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Group>

      <ZoomControls
        scale={scale}
        fitted={zoom === 'fit-width'}
        fitLabel={labels.fitToWidth}
        fitIcon={<FitWidthIcon />}
        onZoom={setZoom}
        onFit={() => setZoom('fit-width')}
      />

      <DocViewerTooltip label={labels.twoPages}>
        <ActionIcon
          {...controlProps(twoPages)}
          aria-label={labels.twoPages}
          aria-pressed={twoPages}
          onClick={() =>
            setLayout((current) =>
              current !== 'single'
                ? 'single'
                : defaultPageLayout === 'two-page-cover'
                  ? 'two-page-cover'
                  : 'two-page'
            )
          }
        >
          <TwoPagesIcon />
        </ActionIcon>
      </DocViewerTooltip>

      {outline && outline.length > 0 && (
        <Popover
          opened={outlineOpened}
          onChange={setOutlineOpened}
          position="bottom-end"
          shadow="md"
          withinPortal={false}
          trapFocus
          returnFocus
        >
          <Popover.Target>
            <DocViewerTooltip label={labels.outline}>
              <ActionIcon
                {...controlProps(outlineOpened)}
                aria-label={labels.outline}
                aria-expanded={outlineOpened}
                onClick={() => setOutlineOpened((opened) => !opened)}
              >
                <OutlineIcon />
              </ActionIcon>
            </DocViewerTooltip>
          </Popover.Target>
          <Popover.Dropdown p={4}>
            <PdfOutline
              document={ready.document}
              items={outline}
              onSelect={(pageNumber) => {
                setOutlineOpened(false);
                goToPage(pageNumber);
              }}
            />
          </Popover.Dropdown>
        </Popover>
      )}

      <DocViewerTooltip label={labels.search}>
        <ActionIcon
          {...controlProps(searchOpened)}
          ref={searchToggleRef}
          aria-label={labels.search}
          aria-pressed={searchOpened}
          onClick={() => (searchOpened ? closeSearch() : openSearch())}
        >
          <SearchIcon />
        </ActionIcon>
      </DocViewerTooltip>
    </>
  );

  const thumbnails = ready && thumbnailsOpened && (
    <PdfThumbnails
      document={ready.document}
      placeholderSize={ready.firstPageSize}
      currentPage={currentPage}
      orientation={horizontalThumbnails ? 'horizontal' : 'vertical'}
      // Screen readers already read the selected thumbnail, so no page announcement as well
      onSelect={(pageNumber) => goToPage(pageNumber, false)}
    />
  );

  return (
    <>
      <DocViewerToolbar onPrint={ready ? print : undefined}>{controls}</DocViewerToolbar>
      {ready && searchOpened && (
        <PdfSearchBar
          inputRef={searchInputRef}
          query={query}
          onQueryChange={setQuery}
          matchCount={search.matches.length}
          activeIndex={search.activeIndex}
          activePage={activeMatch?.pageNumber}
          searching={search.searching || query !== debouncedQuery}
          onNext={search.next}
          onPrevious={search.previous}
          onClose={closeSearch}
        />
      )}
      <div {...getStyles('main')} data-thumbnails-position={position}>
        {thumbnailsFirst && thumbnails}
        <div
          ref={setBodyRef}
          {...getStyles('body')}
          tabIndex={ready ? 0 : undefined}
          role={ready ? 'region' : undefined}
          aria-label={ready ? title : undefined}
          aria-keyshortcuts={ready ? 'Control+F Meta+F' : undefined}
          onKeyDown={handleKeyDown}
        >
          {state.status === 'loading' && <DocViewerLoading />}

          {state.status === 'password' && (
            <PdfPassword incorrect={state.incorrect} onSubmit={state.submit} />
          )}

          {state.status === 'error' && (
            <DocViewerMessage withDownload error>
              {state.reason === 'worker' ? labels.pdfWorkerMissing : labels.pdfError}
            </DocViewerMessage>
          )}

          {ready && (
            <div ref={setPagesNode} {...getStyles('pages')} data-layout={layout}>
              {Array.from({ length: numPages }, (_, index) => (
                <PdfPage
                  key={index + 1}
                  pdfjs={ready.pdfjs}
                  document={ready.document}
                  pageNumber={index + 1}
                  numPages={numPages}
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
        {!thumbnailsFirst && thumbnails}
      </div>
      {ready && <VisuallyHidden role="status">{pageAnnouncement}</VisuallyHidden>}
    </>
  );
}
