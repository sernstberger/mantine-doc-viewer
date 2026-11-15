import { VisuallyHidden } from '@mantine/core';
import { useElementSize, useMergedRef, useUncontrolled } from '@mantine/hooks';
import React, { useEffect, useState } from 'react';
import { useRegisterController } from '../controller';
import type { DocViewerPageLayout, DocViewerThumbnailsPosition } from '../DocViewer';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { printPdfBytes } from '../print';
import { clampZoom, zoomIn, zoomOut } from '../zoom';
import {
  clampPage,
  computeScale,
  getThumbnailsLayout,
  nextRotation,
  toggleTwoPages,
} from './geometry';
import { getRegionProps } from '../a11y';
import { PdfControls } from './PdfControls';
import { PdfPage } from './PdfPage';
import { PdfSearchBar } from './PdfSearchBar';
import { PdfStatus } from './PdfStatus';
import { PdfThumbnails } from './PdfThumbnails';
import { PdfRotation, rotateSize } from './render-page';
import { useAnnouncement } from './use-announcement';
import { useCurrentPage } from './use-current-page';
import { useLinkService } from './use-link-service';
import { usePageSync, usePdfEvents } from './use-pdf-events';
import { usePdfDocument } from './use-pdf-document';
import { usePdfSearchBar } from './use-pdf-search-bar';
import { useSearchHighlights } from './use-search-highlights';
import type { PdfZoom } from './zoom';

/** Gap between two pages side by side, read from the CSS since `pageGap` sets it */
function useColumnGap(pages: HTMLElement | null, twoPages: boolean) {
  const [columnGap, setColumnGap] = useState(16);

  useEffect(() => {
    if (pages && twoPages) {
      setColumnGap(parseFloat(getComputedStyle(pages).columnGap) || 0);
    }
  }, [pages, twoPages]);

  return columnGap;
}

export function PdfView() {
  const context = useDocViewerContext();
  const { getStyles, labels, controller, events, defaultPageLayout } = context;
  const title = useDocumentTitle();
  const state = usePdfDocument(context.src, context.pdfWorkerSrc, context.pdfOptions);
  const ready = state.status === 'ready' ? state : null;
  const document = ready?.document ?? null;
  const numPages = document?.numPages ?? 0;

  const [zoom, setZoom] = useState<PdfZoom>(
    context.defaultZoom === 'fit' ? 'fit-width' : context.defaultZoom
  );
  const [layout, setLayout] = useState<DocViewerPageLayout>(defaultPageLayout ?? 'single');
  const [rotation, setRotation] = useState<PdfRotation>(0);
  const [thumbnailsOpened, setThumbnailsOpened] = useState(
    context.defaultThumbnailsOpened ?? false
  );
  const [position, setPosition] = useUncontrolled<DocViewerThumbnailsPosition>({
    value: context.thumbnailsPosition,
    defaultValue: context.defaultThumbnailsPosition,
    finalValue: 'left',
    onChange: context.onThumbnailsPositionChange,
  });

  const [pagesNode, setPagesNode] = useState<HTMLDivElement | null>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const { ref: bodyRef, width: bodyWidth } = useElementSize<HTMLDivElement>();
  const setBodyRef = useMergedRef(bodyRef, setScrollRoot);

  const twoPages = layout !== 'single';
  const columnGap = useColumnGap(pagesNode, twoPages);
  const pageWidth = ready ? rotateSize(ready.firstPageSize, rotation).width : 0;
  const scale = ready ? computeScale({ zoom, twoPages, bodyWidth, columnGap, pageWidth }) : 1;

  const { currentPage, registerPage, scrollToPage } = useCurrentPage(scrollRoot);
  const [pageAnnouncement, announce] = useAnnouncement();
  const search = usePdfSearchBar(document);
  const onTextLayer = useSearchHighlights({
    pages: search.pages,
    matches: search.matches,
    activeMatch: search.activeMatch,
    scrollRoot,
    scrollToPage,
  });
  const linkService = useLinkService({ document, currentPage, scale, scrollToPage, events });
  const pageReported = usePdfEvents({
    state,
    events,
    currentPage,
    scale,
    fitted: zoom === 'fit-width',
  });
  usePageSync({
    numPages,
    laidOut: !!(ready && scrollRoot && pagesNode),
    page: context.page,
    defaultPage: context.defaultPage,
    pageReported,
    scrollToPage,
  });

  /** Moves to a page, and reads it out unless something else already does (the thumbnails) */
  const goToPage = (page: number, withAnnouncement = true) => {
    scrollToPage(page);
    withAnnouncement && announce(labels.pageOf(page, numPages));
  };
  const rotate = () => setRotation(nextRotation);
  const print = async () => {
    document && (await printPdfBytes(await document.getData()));
  };

  useRegisterController(controller, {
    goToPage: (page) => ready && goToPage(clampPage(page, numPages)),
    setZoom: (next) => setZoom(next === 'fit' ? 'fit-width' : clampZoom(next)),
    zoomIn: () => setZoom(zoomIn(scale)),
    zoomOut: () => setZoom(zoomOut(scale)),
    rotate,
    openSearch: (query) => ready && search.open(query),
    closeSearch: () => search.opened && search.close(),
    toggleThumbnails: (opened) => setThumbnailsOpened((current) => opened ?? !current),
    print,
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (ready && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      search.open();
    }
  };

  useEffect(() => {
    if (state.status === 'error' && state.reason === 'worker') {
      // eslint-disable-next-line no-console
      console.error(state.error.message);
    }
  }, [state]);

  const thumbnailsLayout = getThumbnailsLayout(position);
  const thumbnails = ready && thumbnailsOpened && (
    <PdfThumbnails
      document={ready.document}
      placeholderSize={ready.firstPageSize}
      currentPage={currentPage}
      rotation={rotation}
      orientation={thumbnailsLayout.orientation}
      // Screen readers already read the selected thumbnail, so no page announcement as well
      onSelect={(page) => goToPage(page, false)}
    />
  );

  return (
    <>
      <DocViewerToolbar onPrint={ready ? print : undefined}>
        {ready && (
          <PdfControls
            document={ready.document}
            currentPage={currentPage}
            onPage={goToPage}
            scale={scale}
            zoom={zoom}
            onZoom={setZoom}
            onRotate={rotate}
            twoPages={twoPages}
            onToggleTwoPages={() =>
              setLayout((current) => toggleTwoPages(current, defaultPageLayout))
            }
            thumbnailsOpened={thumbnailsOpened}
            onToggleThumbnails={() => setThumbnailsOpened((opened) => !opened)}
            position={position}
            onPositionChange={setPosition}
            searchOpened={search.opened}
            searchToggleRef={search.toggleRef}
            onToggleSearch={() => (search.opened ? search.close() : search.open())}
          />
        )}
      </DocViewerToolbar>

      {ready && search.opened && (
        <PdfSearchBar
          inputRef={search.inputRef}
          query={search.query}
          onQueryChange={search.setQuery}
          matchCount={search.matches.length}
          activeIndex={search.activeIndex}
          activePage={search.activeMatch?.pageNumber}
          searching={search.searching}
          onNext={search.next}
          onPrevious={search.previous}
          onClose={search.close}
          options={search.options}
          onOptionsChange={search.setOptions}
        />
      )}

      <div {...getStyles('main')} data-thumbnails-position={position}>
        {thumbnailsLayout.first && thumbnails}
        <div
          ref={setBodyRef}
          {...getStyles('body')}
          {...getRegionProps(!!ready, title, 'Control+F Meta+F')}
          onKeyDown={handleKeyDown}
        >
          <PdfStatus state={state} />

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
                  rotation={rotation}
                  placeholderSize={ready.firstPageSize}
                  scrollRoot={scrollRoot}
                  registerPage={registerPage}
                  linkService={linkService}
                  onTextLayer={onTextLayer}
                />
              ))}
            </div>
          )}
        </div>
        {!thumbnailsLayout.first && thumbnails}
      </div>

      {ready && <VisuallyHidden role="status">{pageAnnouncement}</VisuallyHidden>}
    </>
  );
}
