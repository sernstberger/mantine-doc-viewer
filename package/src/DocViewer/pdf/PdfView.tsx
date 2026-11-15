import { CloseButton, VisuallyHidden } from '@mantine/core';
import { useElementSize, useMergedRef, useUncontrolled } from '@mantine/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { useRegisterController } from '../controller';
import type { DocViewerPageLayout, DocViewerThumbnailsPosition } from '../DocViewer';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { useKeepScroll } from '../keep-scroll';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { printPdfBytes } from '../print';
import { clampZoom, zoomIn, zoomOut } from '../zoom';
import {
  clampPage,
  computeFitPageScale,
  computeScale,
  getPresentationTarget,
  getThumbnailsLayout,
  isTwoPages,
  nextRotation,
} from './geometry';
import { getRegionProps } from '../a11y';
import { formatNumber } from '../format';
import { saveBytes } from '../files';
import { buildExtractRequest, getEditedFileName, initialOrder, movePage } from './page-edits';
import { getImageKeyAction, getWheelScale } from '../views/image-zoom';
import { PdfControls } from './PdfControls';
import { getResolvedOutline } from './PdfOutline';
import { PdfPageEditor, PdfSaveReason } from './PdfPageEditor';
import { PdfPage } from './PdfPage';
import { PdfSearchBar } from './PdfSearchBar';
import { PdfStatus } from './PdfStatus';
import { PdfThumbnails } from './PdfThumbnails';
import { PdfRotation, rotateSize } from './render-page';
import { useAnnouncement } from './use-announcement';
import { useCurrentPage } from './use-current-page';
import { useLinkService } from './use-link-service';
import { usePdfLayers } from './use-pdf-layers';
import { usePresentation } from './use-presentation';
import { useZoomAnchor } from './use-zoom-anchor';
import { usePageSync, usePdfEvents } from './use-pdf-events';
import { usePdfDocument } from './use-pdf-document';
import { usePdfSearchBar } from './use-pdf-search-bar';
import { getPointOffset } from './page-points';
import { usePagesGutter } from './use-pages-gutter';
import { usePassageHighlight } from './use-passage-highlight';
import { useSearchHighlights, useTextLayers } from './use-search-highlights';
import { useTextSelect } from './use-text-select';
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

/** How long after a presentation the page it ended on is kept in view while the layout settles, in ms */
const RESTORE_SETTLE_TIME = 600;

export function PdfView() {
  const context = useDocViewerContext();
  const { getStyles, labels, controller, events, defaultPageLayout } = context;
  const title = useDocumentTitle();
  // Page editing makes a new document, which the viewer then shows instead of `src`
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<Uint8Array | null>(null);
  // With keepView the view is not remounted for a new src, but edits belong to the old document
  const [editedSrc, setEditedSrc] = useState(context.src);
  if (editedSrc !== context.src) {
    setEditedSrc(context.src);
    setEditedData(null);
    setEditing(false);
  }
  const state = usePdfDocument(context.src, context.pdfWorkerSrc, context.pdfOptions, editedData);
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
  const { ref: bodyRef, width: bodyWidth, height: bodyHeight } = useElementSize<HTMLDivElement>();
  const setBodyRef = useMergedRef(bodyRef, setScrollRoot);

  const columnGap = useColumnGap(pagesNode, isTwoPages(layout));
  const gutter = usePagesGutter(pagesNode, bodyWidth);
  const pageSize = ready ? rotateSize(ready.firstPageSize, rotation) : { width: 0, height: 0 };
  const presentation = usePresentation({
    fullscreen: context.fullscreen,
    toggleFullscreen: context.toggleFullscreen,
    body: scrollRoot,
  });
  const { presenting } = presentation;
  // With height="auto" the window scrolls, except in full screen or a presentation, which have a fixed height
  const viewport = !!context.autoHeight && !context.fullscreen && !presenting;
  const scale = !ready
    ? 1
    : presenting
      ? computeFitPageScale(bodyWidth, bodyHeight, pageSize.width, pageSize.height)
      : computeScale({
          zoom,
          layout,
          bodyWidth,
          bodyHeight,
          columnGap,
          pageWidth: pageSize.width,
          pageHeight: pageSize.height,
          gutter,
          autoHeight: viewport,
        });

  const { currentPage, registerPage, scrollToPage } = useCurrentPage(
    scrollRoot,
    layout === 'horizontal',
    viewport
  );
  const [pageAnnouncement, announce] = useAnnouncement();
  const search = usePdfSearchBar(document, scrollRoot);
  const textLayers = useTextLayers();
  useSearchHighlights({
    textLayers,
    pages: search.pages,
    matches: search.matches,
    activeMatch: search.activeMatch,
    scrollRoot,
    viewport,
    scrollToPage,
  });
  const passage = usePassageHighlight({
    document,
    layers: textLayers.layers,
    layersVersion: textLayers.version,
    scrollRoot,
    viewport,
    scrollToPage,
    scale,
    rotation,
  });
  useTextSelect({ scrollRoot, scale, rotation, onTextSelect: events.onTextSelect });
  const pdfLayers = usePdfLayers(document);
  const layers = { config: pdfLayers.config, version: pdfLayers.version };
  const linkService = useLinkService({ document, currentPage, scale, scrollToPage, events });
  const pageReported = usePdfEvents({
    state,
    events,
    currentPage,
    scale,
    fitted: zoom === 'fit-width',
    mimeType: context.mimeType,
  });
  usePageSync({
    numPages,
    laidOut: !!(ready && scrollRoot && pagesNode),
    page: context.page,
    defaultPage: context.defaultPage,
    pageReported,
    scrollToPage,
  });

  useKeepScroll(scrollRoot, !!(ready && scrollRoot && pagesNode), context.src, context.keepView);

  /** Moves to a page, and reads it out unless something else already does (the thumbnails) */
  const goToPage = (page: number, withAnnouncement = true, top?: number) => {
    scrollToPage(
      page,
      top === undefined
        ? undefined
        : (pageHeight) => getPointOffset(Math.max(top, 0), scale, rotation, pageHeight)
    );
    withAnnouncement && announce(labels.pageOf(page, numPages));
  };
  const rotate = () => setRotation(nextRotation);
  const print = async () => {
    document && (await printPdfBytes(await document.getData()));
  };

  useRegisterController(controller, {
    goToPage: (page, options) => ready && goToPage(clampPage(page, numPages), true, options?.top),
    highlight: (target) => ready && passage.highlight(target),
    clearHighlight: passage.clear,
    setZoom: (next) => setZoom(next === 'fit' ? 'fit-width' : clampZoom(next)),
    zoomIn: () => setZoom(zoomIn(scale)),
    zoomOut: () => setZoom(zoomOut(scale)),
    setPageLayout: setLayout,
    rotate,
    openSearch: (query) => ready && search.open(query),
    closeSearch: () => search.opened && search.close(),
    toggleThumbnails: (opened) => setThumbnailsOpened((current) => opened ?? !current),
    getOutline: async () =>
      document ? getResolvedOutline(document, await document.getOutline().catch(() => null)) : [],
    editPages: () => {
      context.withPageEditing && ready && setEditing(true);
    },
    togglePresentation: () => {
      ready && presentation.toggle();
    },
    print,
    isPrintable: () => !!ready,
  });

  // The page a presentation ended on is restored below, after this has run
  useZoomAnchor(scrollRoot, scale, !presenting && !viewport);

  // After a presentation, stay on the page it ended on instead of the top of the document.
  // The toolbar and thumbnails come back and the fitted scale changes a moment later, so the
  // page is scrolled to again whenever the scale changes until things settle
  const presentedPage = useRef(0);
  const restorePage = useRef(0);
  if (presenting) {
    presentedPage.current = currentPage;
  }
  useEffect(() => {
    if (presenting || !presentedPage.current) {
      return undefined;
    }

    restorePage.current = presentedPage.current;
    presentedPage.current = 0;
    const timeout = window.setTimeout(() => {
      restorePage.current = 0;
    }, RESTORE_SETTLE_TIME);
    return () => window.clearTimeout(timeout);
  }, [presenting]);

  useEffect(() => {
    const page = restorePage.current;
    if (page && !presenting) {
      const frame = requestAnimationFrame(() => scrollToPage(page));
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [presenting, scale, scrollToPage]);

  const savePdf = async (bytes: Uint8Array, reason: PdfSaveReason, pages: number[]) => {
    if (context.onSave) {
      await context.onSave(bytes, { reason, pages });
    } else {
      const suffix = reason === 'extract' ? 'pages' : 'edited';
      saveBytes(bytes, getEditedFileName(context.fileName, suffix), 'application/pdf');
    }
  };

  /** Moves a page by dragging its thumbnail: the viewer shows the reordered document */
  const reorderPages = async (page: number, toIndex: number) => {
    const order = movePage(initialOrder(numPages), page, toIndex);
    const bytes = (await ready!.document.extractPages(buildExtractRequest(order))) as Uint8Array;
    showEdited(bytes, toIndex + 1);
    announce(labels.pageMoved(page, toIndex + 1));
    // Only an app that saves edits hears about it; a drag never starts a download
    await context.onSave?.(bytes, { reason: 'reorder', pages: order });
  };

  // An edited document starts at its first page, or where a dragged page landed. The effect
  // waits for the new document: right after the bytes change, the old one is still loaded
  const pageAfterEdit = useRef(1);
  const replacedDocument = useRef<unknown>(null);
  const showEdited = (bytes: Uint8Array, page = 1) => {
    pageAfterEdit.current = page;
    replacedDocument.current = ready?.document;
    setEditedData(bytes);
  };
  useEffect(() => {
    if (editedData && ready && ready.document !== replacedDocument.current) {
      scrollToPage(pageAfterEdit.current);
      replacedDocument.current = ready.document;
    }
    // Only when a new edited document is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedData, ready?.document]);

  // Pinch on a trackpad arrives as a wheel event with ctrlKey set; Ctrl+wheel zooms too
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  useEffect(() => {
    if (!scrollRoot || presenting) {
      return undefined;
    }
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        setZoom(clampZoom(getWheelScale(scaleRef.current, event.deltaY)));
      }
    };
    scrollRoot.addEventListener('wheel', onWheel, { passive: false });
    return () => scrollRoot.removeEventListener('wheel', onWheel);
  }, [scrollRoot, presenting]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = presenting ? getPresentationTarget(event.key, currentPage, numPages) : null;
    if (target !== null) {
      event.preventDefault();
      target === 'exit' ? presentation.stop() : goToPage(target);
      return;
    }

    // + = - 0 zoom like images do; rotation stays on its button, as r is common in screen readers
    const zoomAction = ready ? getImageKeyAction(event) : null;
    if (zoomAction && zoomAction !== 'rotate') {
      event.preventDefault();
      const zoomActions = {
        'zoom-in': () => setZoom(zoomIn(scale)),
        'zoom-out': () => setZoom(zoomOut(scale)),
        fit: () => setZoom('fit-width'),
      };
      zoomActions[zoomAction]();
      return;
    }

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
  const thumbnails = ready && thumbnailsOpened && !presenting && (
    <PdfThumbnails
      document={ready.document}
      placeholderSize={ready.firstPageSize}
      currentPage={currentPage}
      rotation={rotation}
      layers={layers}
      orientation={thumbnailsLayout.orientation}
      // Screen readers already read the selected thumbnail, so no page announcement as well
      onSelect={(page) => goToPage(page, false)}
      onReorder={context.withPageEditing ? reorderPages : undefined}
    />
  );

  if (editing && ready) {
    return (
      <>
        <DocViewerToolbar />
        <PdfPageEditor
          document={ready.document}
          onCancel={() => setEditing(false)}
          onSave={savePdf}
          onDone={(bytes) => {
            setEditing(false);
            bytes && showEdited(bytes);
          }}
        />
      </>
    );
  }

  return (
    <>
      {!presenting && (
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
              layout={layout}
              layers={pdfLayers.layers}
              onLayerChange={pdfLayers.setVisible}
              onLayoutChange={setLayout}
              thumbnailsOpened={thumbnailsOpened}
              onToggleThumbnails={() => setThumbnailsOpened((opened) => !opened)}
              position={position}
              onPositionChange={setPosition}
              searchOpened={search.opened}
              searchToggleRef={search.toggleRef}
              onToggleSearch={() => (search.opened ? search.close() : search.open())}
              onPresent={presentation.start}
              onEditPages={() => setEditing(true)}
            />
          )}
        </DocViewerToolbar>
      )}

      {ready && search.opened && !presenting && (
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

      <div
        {...getStyles('main')}
        data-thumbnails-position={position}
        data-presenting={presenting || undefined}
      >
        {thumbnailsLayout.first && thumbnails}
        <div
          ref={setBodyRef}
          {...getStyles('body')}
          {...getRegionProps(!!ready, title, 'Control+F Meta+F Plus Minus 0')}
          onKeyDown={handleKeyDown}
          // In a presentation a click shows the next page
          onClick={presenting ? () => goToPage(Math.min(currentPage + 1, numPages)) : undefined}
        >
          <PdfStatus state={state} />

          {ready && (
            <div
              ref={setPagesNode}
              {...getStyles('pages')}
              data-layout={presenting ? 'presentation' : layout}
            >
              {(presenting
                ? [currentPage]
                : Array.from({ length: numPages }, (_, index) => index + 1)
              ).map((pageNumber) => (
                <PdfPage
                  key={pageNumber}
                  pdfjs={ready.pdfjs}
                  document={ready.document}
                  pageNumber={pageNumber}
                  numPages={numPages}
                  scale={scale}
                  rotation={rotation}
                  layers={layers}
                  placeholderSize={ready.firstPageSize}
                  scrollRoot={viewport ? null : scrollRoot}
                  registerPage={registerPage}
                  linkService={linkService}
                  onTextLayer={textLayers.onTextLayer}
                  highlightRects={
                    passage.rects?.page === pageNumber ? passage.rects.rects : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
        {!thumbnailsLayout.first && thumbnails}
        {presenting && (
          <div {...getStyles('presentationControls')}>
            <span>
              {formatNumber(currentPage, context.locale)} / {formatNumber(numPages, context.locale)}
            </span>
            <CloseButton
              size="sm"
              variant="transparent"
              c="white"
              aria-label={labels.exitPresentation}
              onClick={presentation.stop}
            />
          </div>
        )}
      </div>

      {ready && <VisuallyHidden role="status">{pageAnnouncement}</VisuallyHidden>}
    </>
  );
}
