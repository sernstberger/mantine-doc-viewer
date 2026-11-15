import { Box, BoxProps, ElementProps } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import React from 'react';
import { useDocumentTitle } from '../doc-viewer.context';
import type { DocViewerPasswordInputProps } from '../doc-viewer.types';
import type { PdfSession } from '../DocViewerRoot/pdf-session-context';
import { getRegionProps } from '../utils/a11y';
import type { DocViewerRenderPageOverlay } from '../utils/page-overlay';
import { PdfPageList } from './PdfPageList';
import { PdfStatus } from './PdfStatus';

type BodyProps = BoxProps & ElementProps<'div'>;

interface PdfPagesBodyProps {
  session: PdfSession;
  bodyProps: BodyProps;
  bodyRef: React.Ref<HTMLDivElement> | undefined;
  maxCanvasPixels: number;
  renderPageOverlay: DocViewerRenderPageOverlay | undefined;
  passwordInputProps: DocViewerPasswordInputProps | undefined;
}

/** The scrolling region of a PDF session with the load status and the pages */
export function PdfPagesBody({
  session,
  bodyProps,
  bodyRef,
  maxCanvasPixels,
  renderPageOverlay,
  passwordInputProps,
}: PdfPagesBodyProps) {
  const title = useDocumentTitle();
  const { state, loaded, view, position, content, turns, actions } = session;
  const { ready, numPages } = loaded;
  const { presenting } = view;
  const { currentPage, goToPage } = position;
  const { onKeyDown, onClick } = bodyProps;
  const ref = useMergedRef(bodyRef, turns.setBodyNode);

  return (
    <Box
      ref={ref}
      {...bodyProps}
      {...getRegionProps(!!ready, title, turns.keyShortcuts)}
      {...turns.bodyAttributes}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        actions.handleKeyDown(event);
      }}
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        presenting ? goToPage(Math.min(currentPage + 1, numPages)) : turns.onEdgeClick(event);
      }}
    >
      <PdfStatus state={state} passwordInputProps={passwordInputProps} />

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
          maxCanvasPixels={maxCanvasPixels}
          renderPageOverlay={renderPageOverlay}
        />
      )}
    </Box>
  );
}
