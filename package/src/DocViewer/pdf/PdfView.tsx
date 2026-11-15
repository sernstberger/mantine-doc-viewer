import { VisuallyHidden } from '@mantine/core';
import { useElementSize, useMergedRef, useUncontrolled } from '@mantine/hooks';
import React, { useEffect, useState } from 'react';
import { useRegisterController } from '../controller';
import type { DocViewerThumbnailsPosition } from '../DocViewer';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { useKeepScroll } from '../keep-scroll';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { printPdfBytes } from '../print';
import { zoomIn, zoomOut } from '../zoom';
import {
  clampPage,
  getPresentationTarget,
  getPageSize,
  getThumbnailsLayout,
  getViewScale,
  scrollsWindow,
  isTwoPages,
  nextRotation,
} from './geometry';
import { getRegionProps } from '../a11y';
import { getImageKeyAction } from '../views/image-zoom';
import { PdfBars } from './PdfBars';
import { PdfPresentationControls } from './PdfPresentationControls';
import { PdfControls } from './PdfControls';
import { getResolvedOutline } from './PdfOutline';
import { PdfPageEditor } from './PdfPageEditor';
import { PdfPageList } from './PdfPageList';
import { PdfStatus } from './PdfStatus';
import { PdfThumbnails } from './PdfThumbnails';
import type { PdfRotation } from './render-page';
import { useAnnouncement } from './use-announcement';
import { useCurrentPage } from './use-current-page';
import { useReadingProgress } from './use-reading-progress';
import { useAutoAdvance } from './use-auto-advance';
import { useEditedDocument, usePdfEdits } from './use-pdf-edits';
import { useKeepPageOnLayout, usePageLayout } from './use-page-layout';
import { usePresentationRestore } from './use-presentation-restore';
import { useSpreads } from './use-spreads';
import { useWheelZoom } from './use-wheel-zoom';
import { useLinkService } from './use-link-service';
import { useMarkup } from './use-markup';
import { usePdfLayers } from './use-pdf-layers';
import { usePresentation } from './use-presentation';
import { useZoomAnchor } from './use-zoom-anchor';
import { usePageSync, usePdfEvents } from './use-pdf-events';
import { getLoaded, usePdfDocument } from './use-pdf-document';
import { usePdfSearchBar } from './use-pdf-search-bar';
import { getPointOffset } from './page-points';
import { fitsAcross, resolvePageTurning } from './spreads';
import { getBodyAttributes } from './body-attributes';
import { usePageTurning } from './use-page-turning';
import { usePagesGutter } from './use-pages-gutter';
import { usePassageHighlight } from './use-passage-highlight';
import { useSearchHighlights, useTextLayers } from './use-search-highlights';
import { useTextSelect } from './use-text-select';
import { toPdfZoom, type PdfZoom } from './zoom';

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
  const { editing, setEditing, editedData, setEditedData } = useEditedDocument(context.src);
  const state = usePdfDocument(context.src, context.pdfWorkerSrc, context.pdfOptions, editedData);
  const { ready, document, numPages } = getLoaded(state);

  const [zoom, setZoom] = useState<PdfZoom>(() => toPdfZoom(context.defaultZoom));
  const { layout, setLayout } = usePageLayout({
    controlled: context.pageLayout,
    defaultLayout: defaultPageLayout,
    onChange: events.onPageLayoutChange,
  });
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
  const pageSize = getPageSize(ready?.firstPageSize, rotation);
  const presentation = usePresentation({
    fullscreen: context.fullscreen,
    toggleFullscreen: context.toggleFullscreen,
    body: scrollRoot,
  });
  const { presenting } = presentation;
  const viewport = scrollsWindow(context.autoHeight, context.fullscreen, presenting);
  // A document is open for reading: loaded, and not shown as a presentation
  const reading = !!ready && !presenting;
  const scale = getViewScale({
    ready: !!ready,
    presenting,
    pageSize,
    zoom,
    layout,
    bodyWidth,
    bodyHeight,
    columnGap,
    gutter,
    autoHeight: viewport,
  });

  const horizontal = layout === 'horizontal';
  const progress = useReadingProgress({
    scrollRoot,
    document,
    numPages,
    horizontal,
    viewport,
    events,
  });
  const { currentPage, registerPage, scrollToPage, resumeScroll } = useCurrentPage(
    scrollRoot,
    horizontal,
    viewport,
    progress.sample
  );
  useKeepPageOnLayout(layout, currentPage, scrollToPage);
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
  const markup = useMarkup(context.markup);
  const pdfLayers = usePdfLayers(document);
  const layers = { config: pdfLayers.config, version: pdfLayers.version };
  const linkService = useLinkService({ document, currentPage, scale, scrollToPage, events });
  const pageReported = usePdfEvents({
    state,
    events,
    currentPage,
    scale,
    fitted: typeof zoom !== 'number',
    mimeType: context.mimeType,
  });
  // The document's pages are in place in the scroll area
  const laidOut = !!(ready && scrollRoot && pagesNode);
  usePageSync({
    numPages,
    laidOut,
    page: context.page,
    defaultPage: context.defaultPage,
    pageReported,
    scrollToPage,
  });

  useKeepScroll(scrollRoot, laidOut, context.src, context.keepView);

  /** Moves to a page, and reads it out unless something else already does (the thumbnails) */
  const goToPage = (
    page: number,
    withAnnouncement = true,
    top?: number,
    behavior?: 'smooth' | 'instant'
  ) => {
    scrollToPage(
      page,
      top === undefined
        ? undefined
        : (pageHeight) => getPointOffset(Math.max(top, 0), scale, rotation, pageHeight),
      behavior === 'instant'
    );
    withAnnouncement && announce(labels.pageOf(page, numPages));
  };
  useAutoAdvance({
    autoAdvance: reading && !editing ? context.autoAdvance : undefined,
    currentPage,
    numPages,
    layout,
    goToPage: (page) => goToPage(page, false),
  });
  const rotate = () => setRotation(nextRotation);

  const { turn, goToSpread } = useSpreads({
    layout,
    numPages,
    currentPage,
    ready: !!ready,
    goToPage,
    onSpreadChange: events.onSpreadChange,
  });
  const turning = resolvePageTurning(context.withPageTurning);
  const swipeable =
    turning.swipe && fitsAcross({ layout, scale, pageWidth: pageSize.width, columnGap, bodyWidth });
  const pageTurning = usePageTurning({
    options: turning,
    active: reading,
    swipeable,
    turn,
  });
  const setBodyNode = useMergedRef(setBodyRef, pageTurning.ref);
  const { keyShortcuts, ...bodyAttributes } = getBodyAttributes({
    presenting,
    layout,
    scrollSnap: context.withScrollSnap,
    scroll: context.withScroll,
    swipeable,
    turningKeys: turning.keys,
  });

  const print = async () => {
    document && (await printPdfBytes(await document.getData()));
  };

  useRegisterController(controller, {
    goToPage: (page, options) =>
      ready && goToPage(clampPage(page, numPages), true, options?.top, options?.behavior),
    goToSpread,
    nextSpread: () => turn(1),
    previousSpread: () => turn(-1),
    highlight: (target) => ready && passage.highlight(target),
    clearHighlight: passage.clear,
    setZoom: (next) => setZoom(toPdfZoom(next)),
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
    getBytes: async () => (document ? document.getData() : null),
    // Only a page element carries data-rendered, once its canvas holds the drawn page
    getPageCanvas: (page) =>
      scrollRoot?.querySelector(`[data-page-number="${page}"][data-rendered] canvas`) ?? null,
    setMarkupTool: markup.setTool,
    saveMarkup: () => saveMarkup(),
    print,
    isPrintable: () => !!ready,
    resetReadingProgress: progress.reset,
  });

  // The page a presentation ended on is restored below, after this has run
  useZoomAnchor(scrollRoot, scale, !presenting && !viewport, resumeScroll);

  usePresentationRestore(presenting, currentPage, scale, scrollToPage);

  const { savePdf, saveMarkup, reorderPages, deletePage, showEdited } = usePdfEdits({
    document,
    numPages,
    editedData,
    setEditedData,
    scrollToPage,
    announce,
    labels,
    onSave: context.onSave,
    fileName: context.fileName,
    markup,
  });

  useWheelZoom(scrollRoot, !presenting, scale, setZoom);

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
  // Page editing lets the thumbnails reorder and delete pages too
  const thumbnailEdits = context.withPageEditing
    ? { onReorder: reorderPages, onDelete: deletePage }
    : {};
  const thumbnails = reading && thumbnailsOpened && (
    <PdfThumbnails
      document={ready!.document}
      placeholderSize={ready!.firstPageSize}
      currentPage={currentPage}
      rotation={rotation}
      layers={layers}
      orientation={thumbnailsLayout.orientation}
      // Screen readers already read the selected thumbnail, so no page announcement as well
      onSelect={(page) => goToPage(page, false)}
      {...thumbnailEdits}
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
        <PdfBars
          ready={!!ready}
          onPrint={print}
          markup={markup}
          onSaveMarkup={saveMarkup}
          search={search}
          controls={
            ready && (
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
            )
          }
        />
      )}

      <div
        {...getStyles('main')}
        data-thumbnails-position={position}
        data-presenting={presenting || undefined}
      >
        {thumbnailsLayout.first && thumbnails}
        <div
          ref={setBodyNode}
          {...getStyles('body')}
          {...getRegionProps(!!ready, title, keyShortcuts)}
          {...bodyAttributes}
          onKeyDown={handleKeyDown}
          // In a presentation a click shows the next page; otherwise the edges may turn pages
          onClick={
            presenting ? () => goToPage(Math.min(currentPage + 1, numPages)) : pageTurning.onClick
          }
        >
          <PdfStatus state={state} />

          {ready && (
            <PdfPageList
              pagesRef={setPagesNode}
              layout={layout}
              presenting={presenting}
              currentPage={currentPage}
              highlight={passage.rects}
              pdfjs={ready.pdfjs}
              document={ready.document}
              numPages={numPages}
              scale={scale}
              rotation={rotation}
              layers={layers}
              placeholderSize={ready.firstPageSize}
              scrollRoot={scrollRoot}
              viewport={viewport}
              registerPage={registerPage}
              linkService={linkService}
              onTextLayer={textLayers.onTextLayer}
              markup={markup}
            />
          )}
        </div>
        {!thumbnailsLayout.first && thumbnails}
        {presenting && (
          <PdfPresentationControls
            currentPage={currentPage}
            numPages={numPages}
            onExit={presentation.stop}
          />
        )}
      </div>

      {ready && <VisuallyHidden role="status">{pageAnnouncement}</VisuallyHidden>}
    </>
  );
}
