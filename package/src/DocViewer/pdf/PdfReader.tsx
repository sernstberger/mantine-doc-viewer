import React from 'react';
import { getRegionProps } from '../a11y';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { PdfBars } from './PdfBars';
import { PdfControls } from './PdfControls';
import { PdfThumbnailsPanel } from './PdfMain';
import { PdfPageList } from './PdfPageList';
import { PdfStatus } from './PdfStatus';
import type { PdfDocumentState } from './use-pdf-document';
import type { PdfPageContent } from './use-pdf-page-content';
import type { PdfPageTurns } from './use-pdf-page-turns';
import type { PdfReadingPosition } from './use-pdf-reading-position';
import type { PdfViewActions } from './use-pdf-view-actions';
import type { PdfLoaded, PdfViewGeometry } from './use-pdf-view-geometry';

interface PdfReaderBarsProps {
  ready: PdfLoaded['ready'];
  view: PdfViewGeometry;
  position: PdfReadingPosition;
  content: PdfPageContent;
  actions: PdfViewActions;
  setEditing: (editing: boolean) => void;
  /** Refs of the buttons that take focus back after a presentation and the page editor */
  returnFocus: {
    present: React.Ref<HTMLButtonElement>;
    editPages: React.Ref<HTMLButtonElement>;
  };
}

/** The toolbar with the PDF's controls, and the markup and search bars below it */
export function PdfReaderBars({
  ready,
  view,
  position,
  content,
  actions,
  setEditing,
  returnFocus,
}: PdfReaderBarsProps) {
  const { thumbnailsPanel } = view;
  const { search, pdfLayers } = content;

  return (
    <PdfBars
      ready={!!ready}
      onPrint={actions.print}
      markup={content.markup}
      onSaveMarkup={actions.saveMarkup}
      search={search}
      controls={
        ready && (
          <PdfControls
            document={ready.document}
            currentPage={position.currentPage}
            onPage={position.goToPage}
            scale={view.scale}
            zoom={view.zoom}
            onZoom={actions.setZoom}
            onRotate={view.rotate}
            layout={view.layout}
            layers={pdfLayers.layers}
            onLayerChange={pdfLayers.setVisible}
            onLayoutChange={view.setLayout}
            thumbnailsOpened={thumbnailsPanel.opened}
            onToggleThumbnails={() => thumbnailsPanel.toggle()}
            position={thumbnailsPanel.position}
            onPositionChange={thumbnailsPanel.setPosition}
            searchOpened={search.opened}
            searchToggleRef={search.toggleRef}
            onToggleSearch={() => (search.opened ? search.close() : search.open())}
            onPresent={view.presentation.start}
            onEditPages={() => setEditing(true)}
            presentRef={returnFocus.present}
            editPagesRef={returnFocus.editPages}
          />
        )
      }
    />
  );
}

interface PdfReaderBodyProps {
  state: PdfDocumentState;
  loaded: PdfLoaded;
  view: PdfViewGeometry;
  position: PdfReadingPosition;
  content: PdfPageContent;
  turns: PdfPageTurns;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

/** The scrolling region with the load status and the pages */
export function PdfReaderBody({
  state,
  loaded: { ready, numPages },
  view,
  position,
  content,
  turns,
  onKeyDown,
}: PdfReaderBodyProps) {
  const { getStyles } = useDocViewerContext();
  const title = useDocumentTitle();
  const { presenting } = view;
  const { currentPage, goToPage } = position;

  return (
    <div
      ref={turns.setBodyNode}
      {...getStyles('body')}
      {...getRegionProps(!!ready, title, turns.keyShortcuts)}
      {...turns.bodyAttributes}
      onKeyDown={onKeyDown}
      // In a presentation a click shows the next page; otherwise the edges may turn pages
      onClick={presenting ? () => goToPage(Math.min(currentPage + 1, numPages)) : turns.onEdgeClick}
    >
      <PdfStatus state={state} />

      {ready && (
        <PdfPageList
          pagesRef={view.setPagesNode}
          layout={view.layout}
          presenting={presenting}
          currentPage={currentPage}
          highlight={content.passage.rects}
          pdfjs={ready.pdfjs}
          document={ready.document}
          numPages={numPages}
          scale={view.scale}
          rotation={view.rotation}
          layers={content.layers}
          placeholderSize={ready.firstPageSize}
          scrollRoot={view.scrollRoot}
          viewport={view.viewport}
          registerPage={position.registerPage}
          linkService={content.linkService}
          onTextLayer={content.textLayers.onTextLayer}
          markup={content.markup}
        />
      )}
    </div>
  );
}

interface PdfReaderThumbnailsProps {
  ready: PdfLoaded['ready'];
  view: PdfViewGeometry;
  position: PdfReadingPosition;
  content: PdfPageContent;
  actions: PdfViewActions;
}

/** The thumbnails strip beside the pages */
export function PdfReaderThumbnails({
  ready,
  view,
  position,
  content,
  actions,
}: PdfReaderThumbnailsProps) {
  const { thumbnailsPanel } = view;

  return (
    <PdfThumbnailsPanel
      ready={ready}
      opened={thumbnailsPanel.opened}
      presenting={view.presenting}
      position={thumbnailsPanel.position}
      currentPage={position.currentPage}
      rotation={view.rotation}
      layers={content.layers}
      // Screen readers already read the selected thumbnail, so no page announcement as well
      onSelect={(page) => position.goToPage(page, false)}
      onReorder={actions.reorderPages}
      onDelete={actions.deletePage}
    />
  );
}
