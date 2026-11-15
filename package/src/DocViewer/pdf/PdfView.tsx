import { ActionIcon, CloseButton, VisuallyHidden } from '@mantine/core';
import { useElementSize, useMergedRef, useUncontrolled } from '@mantine/hooks';
import React, { useEffect, useState } from 'react';
import { useRegisterController } from '../controller';
import type { DocViewerThumbnailsPosition } from '../DocViewer';
import { useDocumentTitle, useDocViewerContext, useShowControl } from '../DocViewer.context';
import { DocViewerTooltip, useControlProps } from '../controls';
import { MarkupIcon } from '../icons';
import { useKeepScroll } from '../keep-scroll';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { printPdfBytes } from '../print';
import { zoomIn, zoomOut } from '../zoom';
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
import { getImageKeyAction } from '../views/image-zoom';
import { PdfControls } from './PdfControls';
import { PdfMarkupBar } from './PdfMarkupBar';
import { getResolvedOutline } from './PdfOutline';
import { PdfPageEditor } from './PdfPageEditor';
import { PdfPage } from './PdfPage';
import { PdfSearchBar } from './PdfSearchBar';
import { PdfStatus } from './PdfStatus';
import { PdfThumbnails } from './PdfThumbnails';
import { PdfRotation, rotateSize } from './render-page';
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
import { usePdfDocument } from './use-pdf-document';
import { usePdfSearchBar } from './use-pdf-search-bar';
import { getPointOffset } from './page-points';
import { fitsAcross, resolvePageTurning } from './spreads';
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
  const show = useShowControl();
  const controlProps = useControlProps();
  const { editing, setEditing, editedData, setEditedData } = useEditedDocument(context.src);
  const state = usePdfDocument(context.src, context.pdfWorkerSrc, context.pdfOptions, editedData);
  const ready = state.status === 'ready' ? state : null;
  const document = ready?.document ?? null;
  const numPages = document?.numPages ?? 0;

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
  const [markupOpened, setMarkupOpened] = useState(false);
  const withMarkupBar = !!context.markup.withMarkup && (markupOpened || markup.tool !== null);
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
    autoAdvance: ready && !presenting && !editing ? context.autoAdvance : undefined,
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
    active: !!ready && !presenting,
    swipeable,
    turn,
  });
  const setBodyNode = useMergedRef(setBodyRef, pageTurning.ref);

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
      onDelete={context.withPageEditing ? deletePage : undefined}
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
          {ready && context.markup.withMarkup && show('markup') && (
            <DocViewerTooltip label={labels.markup}>
              <ActionIcon
                {...controlProps(withMarkupBar)}
                aria-label={labels.markup}
                aria-pressed={withMarkupBar}
                onClick={() => {
                  setMarkupOpened(!withMarkupBar);
                  withMarkupBar && markup.setTool(null);
                }}
              >
                <MarkupIcon />
              </ActionIcon>
            </DocViewerTooltip>
          )}
        </DocViewerToolbar>
      )}

      {ready && withMarkupBar && !presenting && (
        <PdfMarkupBar
          markup={markup}
          onSave={() =>
            saveMarkup().catch((error: Error) => {
              // eslint-disable-next-line no-console
              console.error(error);
            })
          }
          onClose={() => {
            setMarkupOpened(false);
            markup.setTool(null);
          }}
        />
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
          ref={setBodyNode}
          {...getStyles('body')}
          {...getRegionProps(
            !!ready,
            title,
            turning.keys
              ? 'Control+F Meta+F Plus Minus 0 ArrowLeft ArrowRight PageUp PageDown'
              : 'Control+F Meta+F Plus Minus 0'
          )}
          data-scroll-snap={
            context.withScrollSnap && !presenting
              ? layout === 'horizontal'
                ? 'x'
                : 'y'
              : undefined
          }
          data-no-scroll={(context.withScroll === false && !presenting) || undefined}
          data-swipe={(swipeable && !presenting) || undefined}
          onKeyDown={handleKeyDown}
          // In a presentation a click shows the next page; otherwise the edges may turn pages
          onClick={
            presenting ? () => goToPage(Math.min(currentPage + 1, numPages)) : pageTurning.onClick
          }
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
                  markup={markup}
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
