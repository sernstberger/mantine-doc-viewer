import React from 'react';
import { useDocumentTitle, useDocViewerContext } from '../doc-viewer.context';
import type { PdfSession } from '../DocViewerRoot/pdf-session-context';
import { getRegionProps } from '../utils/a11y';
import { PdfPageList } from './PdfPageList';
import { PdfStatus } from './PdfStatus';

/** The scrolling region of a PDF session with the load status and the pages */
export function PdfPagesBody({ session }: { session: PdfSession }) {
  const { getStyles } = useDocViewerContext();
  const title = useDocumentTitle();
  const { state, loaded, view, position, content, turns, actions } = session;
  const { ready, numPages } = loaded;
  const { presenting } = view;
  const { currentPage, goToPage } = position;

  return (
    // Once the document is ready getRegionProps makes this a focusable, labelled region (role and
    // tabIndex come through the spread). Clicks turn pages; the keys do the same from the region
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={turns.setBodyNode}
      {...getStyles('body')}
      {...getRegionProps(!!ready, title, turns.keyShortcuts)}
      {...turns.bodyAttributes}
      onKeyDown={actions.handleKeyDown}
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
        />
      )}
    </div>
  );
}
