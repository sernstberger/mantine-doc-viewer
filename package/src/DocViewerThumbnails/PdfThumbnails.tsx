import { Box, BoxProps, ElementProps, type GetStylesApiOptions, rem } from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useCallbackRef, useMergedRef } from '@mantine/hooks';
import React, { use, useMemo, useState } from 'react';
import { useDocViewerPageContext } from '../doc-viewer.context';
import { DragHandleIcon } from '../utils/icons';
import { useDocViewerExtensions } from '../DocViewerRoot/extensions-context';
import { PdfThumbnailEditsContext } from '../DocViewerRoot/pdf-session-context';
import { PdfRotation, rotateSize } from '../utils/render-page';
import type { PdfPageSize } from '../hooks/pdf/use-pdf-document';
import type { PdfLayersState } from '../hooks/pdf/use-pdf-layers';
import { useNearViewport } from '../hooks/pdf/use-near-viewport';
import { usePagePreview } from '../hooks/pdf/use-page-preview';
import { useThumbnailKeys } from '../hooks/pdf/use-thumbnail-keys';
import { useThumbnailScroll } from '../hooks/pdf/use-thumbnail-scroll';
import {
  getReorderItemProps,
  type ReorderItemState,
  type ReorderList,
  useReorderItem,
  useReorderList,
} from '../hooks/pdf/use-reorder-drag';

export type ThumbnailsOrientation = 'vertical' | 'horizontal';

export { getNextThumbnailPage, getThumbnailsPerView } from '../utils/thumbnail-keys';

interface PdfThumbnailProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  placeholderSize: PdfPageSize;
  active: boolean;
  rotation: PdfRotation;
  layers?: PdfLayersState;
  orientation: ThumbnailsOrientation;
  width: number;
  scrollRoot: HTMLElement | null;
  reorder: ReorderList;
  dragState: ReorderItemState;
  onSelect: (pageNumber: number) => void;
  /** Actions of the extensions, shown on the thumbnail */
  actions: React.ComponentType<{ page: number }>[];
}

function PdfThumbnailView({
  document,
  pageNumber,
  placeholderSize,
  active,
  rotation,
  layers,
  orientation,
  width,
  scrollRoot,
  reorder,
  dragState,
  onSelect,
  actions,
}: PdfThumbnailProps) {
  const { getStyles, labels } = useDocViewerPageContext();
  const horizontal = orientation === 'horizontal';
  const { ref, near } = useNearViewport<HTMLDivElement>(
    scrollRoot,
    horizontal ? '0px 100%' : '100% 0px'
  );
  const { itemRef, handleRef } = useReorderItem(reorder, pageNumber);
  const thumbnailRef = useMergedRef(ref, itemRef);
  const { canvasRef, size } = usePagePreview({
    document,
    pageNumber,
    width,
    near,
    rotation,
    layers,
  });

  useThumbnailScroll(ref, scrollRoot, active, horizontal);

  const pageSize = size ?? rotateSize(placeholderSize, rotation);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the listbox handles the keys for the focused option, as in the ARIA listbox pattern
    <div
      ref={thumbnailRef}
      {...getStyles('thumbnail')}
      {...(reorder.enabled ? getReorderItemProps(dragState) : undefined)}
      role="option"
      aria-selected={active}
      aria-label={labels.thumbnailLabel(pageNumber)}
      tabIndex={active ? 0 : -1}
      data-page-number={pageNumber}
      data-active={active || undefined}
      onClick={(event) => !reorder.isDragClick(event) && onSelect(pageNumber)}
    >
      {reorder.enabled && (
        <span ref={handleRef} {...getStyles('dragHandle')} aria-hidden>
          <DragHandleIcon />
        </span>
      )}
      {actions.map((Action, index) => (
        <Action key={index} page={pageNumber} />
      ))}
      <span
        {...getStyles('thumbnailImage', {
          style: { width, height: (pageSize.height / pageSize.width) * width },
        })}
      >
        {near && <canvas ref={canvasRef} {...getStyles('canvas')} aria-hidden />}
      </span>
      <span {...getStyles('thumbnailLabel')} aria-hidden>
        {pageNumber}
      </span>
    </div>
  );
}

/** Memoised: on a page turn only the thumbnails that become or stop being current render again */
const PdfThumbnail = React.memo(PdfThumbnailView);

export interface PdfThumbnailsProps {
  document: PDFDocumentProxy;
  placeholderSize: PdfPageSize;
  currentPage: number;
  rotation: PdfRotation;
  layers?: PdfLayersState;
  orientation: ThumbnailsOrientation;
  onSelect: (pageNumber: number) => void;

  /** Width of a thumbnail in a side rail, half of it in a strip above or below the pages */
  width?: number;

  /** className, style, classNames and styles of the `thumbnails` element */
  stylesOptions?: GetStylesApiOptions;

  /** Other props of the `thumbnails` element */
  elementProps?: BoxProps & ElementProps<'div'>;
  rootRef?: React.Ref<HTMLDivElement>;
}

/** The thumbnail actions of the extensions, the same array while the extensions are */
function useThumbnailActions() {
  const extensions = useDocViewerExtensions();
  return useMemo(
    () =>
      extensions.flatMap((extension) =>
        extension.thumbnail?.action ? [extension.thumbnail.action] : []
      ),
    [extensions]
  );
}

/** Reorder, select and delete wiring of the strip, with the same functions on every render */
function useThumbnailsList({
  numPages,
  horizontal,
  scrollRoot,
  onSelect,
}: {
  numPages: number;
  horizontal: boolean;
  scrollRoot: HTMLElement | null;
  onSelect: (pageNumber: number) => void;
}) {
  const edits = use(PdfThumbnailEditsContext);
  const order = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages]
  );
  const { list: reorder, getItemState } = useReorderList({
    container: scrollRoot,
    layout: horizontal ? 'horizontal' : 'vertical',
    order,
    onReorder: (page, toIndex) => edits!.onReorder(page, toIndex),
    enabled: !!edits,
  });
  const select = useCallbackRef(onSelect);
  const remove = useCallbackRef((page: number) => edits!.onDelete!(page));
  const deletePage = edits?.onDelete ? remove : undefined;
  const handleKeyDown = useThumbnailKeys({
    numPages,
    horizontal,
    onSelect: select,
    onDelete: deletePage,
  });
  return { reorder, getItemState, select, deletePage, handleKeyDown };
}

/**
 * The thumbnails strip. An extension's setup can make thumbnails drag to reorder and delete pages
 * (PdfThumbnailEditsContext); its thumbnail actions show on each thumbnail
 */
function PdfThumbnailsView({
  document,
  placeholderSize,
  currentPage,
  rotation,
  layers,
  orientation,
  onSelect,
  width: railWidth,
  stylesOptions,
  elementProps,
  rootRef,
}: PdfThumbnailsProps) {
  const { getStyles, labels, thumbnailWidth } = useDocViewerPageContext();
  const actions = useThumbnailActions();
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const mergedRef = useMergedRef(rootRef, setScrollRoot);
  const { onKeyDown, ...others } = elementProps ?? {};

  const horizontal = orientation === 'horizontal';
  const base = railWidth ?? thumbnailWidth;
  const width = horizontal ? Math.round(base / 2) : base;
  const { reorder, getItemState, select, deletePage, handleKeyDown } = useThumbnailsList({
    numPages: document.numPages,
    horizontal,
    scrollRoot,
    onSelect,
  });

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- options are the tab stops (roving tabindex), as in the ARIA listbox pattern
    <Box
      ref={mergedRef}
      {...getStyles('thumbnails', stylesOptions)}
      __vars={{ '--doc-viewer-thumbnails-width': railWidth ? rem(railWidth) : undefined }}
      {...others}
      role="listbox"
      aria-label={labels.pagesLabel}
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      aria-keyshortcuts={deletePage ? 'Delete Backspace' : undefined}
      data-orientation={orientation}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        handleKeyDown(event);
      }}
    >
      {Array.from({ length: document.numPages }, (_, index) => (
        <PdfThumbnail
          key={index + 1}
          document={document}
          pageNumber={index + 1}
          placeholderSize={placeholderSize}
          active={currentPage === index + 1}
          rotation={rotation}
          layers={layers}
          orientation={orientation}
          width={width}
          scrollRoot={scrollRoot}
          reorder={reorder}
          dragState={getItemState(index + 1, index)}
          onSelect={select}
          actions={actions}
        />
      ))}
    </Box>
  );
}

/** Memoised: a zoom or a scroll that does not change the current page leaves the strip alone */
export const PdfThumbnails = React.memo(PdfThumbnailsView);
