import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useCallbackRef, useMergedRef } from '@mantine/hooks';
import React, { useMemo, useState } from 'react';
import { useDocViewerPageContext } from '../DocViewer.context';
import { DragHandleIcon } from '../icons';
import { initialOrder } from './page-edits';
import { PdfThumbnailDelete } from './PdfThumbnailDelete';
import { PdfRotation, rotateSize } from './render-page';
import type { PdfPageSize } from './use-pdf-document';
import type { PdfLayersState } from './use-pdf-layers';
import { useNearViewport } from './use-near-viewport';
import { usePagePreview } from './use-page-preview';
import { useThumbnailKeys } from './use-thumbnail-keys';
import { useThumbnailScroll } from './use-thumbnail-scroll';
import {
  getReorderItemProps,
  type ReorderItemState,
  type ReorderList,
  useReorderItem,
  useReorderList,
} from './use-reorder-drag';

export type ThumbnailsOrientation = 'vertical' | 'horizontal';

export { getNextThumbnailPage, getThumbnailsPerView } from './thumbnail-keys';

interface PdfThumbnailProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  placeholderSize: PdfPageSize;
  active: boolean;
  rotation: PdfRotation;
  layers?: PdfLayersState;
  orientation: ThumbnailsOrientation;
  scrollRoot: HTMLElement | null;
  reorder: ReorderList;
  dragState: ReorderItemState;
  onSelect: (pageNumber: number) => void;
  onDelete?: (pageNumber: number) => void;
}

function PdfThumbnailView({
  document,
  pageNumber,
  placeholderSize,
  active,
  rotation,
  layers,
  orientation,
  scrollRoot,
  reorder,
  dragState,
  onSelect,
  onDelete,
}: PdfThumbnailProps) {
  const { getStyles, labels, thumbnailWidth } = useDocViewerPageContext();
  const horizontal = orientation === 'horizontal';
  // Half size in the strip above or below the pages
  const width = horizontal ? Math.round(thumbnailWidth / 2) : thumbnailWidth;
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
    // An option in the thumbnails listbox: the listbox handles the keys for the focused option
    // (Enter and Space show its page, arrows move), as in the ARIA listbox pattern
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      ref={thumbnailRef}
      {...getStyles('thumbnail')}
      {...(reorder.enabled ? getReorderItemProps(dragState) : undefined)}
      role="option"
      aria-selected={active}
      aria-label={labels.thumbnail(pageNumber)}
      // One tab stop for the whole list: the current page. Arrow keys move from there
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
      {onDelete && <PdfThumbnailDelete pageNumber={pageNumber} onDelete={onDelete} />}
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
  /** Reorders the document by dragging thumbnails; without it thumbnails do not drag */
  onReorder?: (pageNumber: number, toIndex: number) => void;
  /** Adds a delete button to each thumbnail, and makes Delete remove the focused page */
  onDelete?: (pageNumber: number) => void;
}

export function PdfThumbnails({
  document,
  placeholderSize,
  currentPage,
  rotation,
  layers,
  orientation,
  onSelect,
  onReorder,
  onDelete,
}: PdfThumbnailsProps) {
  const { getStyles, labels } = useDocViewerPageContext();
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  const numPages = document.numPages;
  const horizontal = orientation === 'horizontal';
  const order = useMemo(() => initialOrder(numPages), [numPages]);
  const { list: reorder, getItemState } = useReorderList({
    container: scrollRoot,
    layout: horizontal ? 'horizontal' : 'vertical',
    order,
    // Only called when dragging is enabled, which needs onReorder
    onReorder: (page, toIndex) => onReorder!(page, toIndex),
    enabled: !!onReorder,
  });

  // The same functions on every render, so thumbnails skip renders their own props do not need
  const select = useCallbackRef(onSelect);
  // Only called when there is a delete button, which needs onDelete
  const remove = useCallbackRef((page: number) => onDelete!(page));
  // The last page stays: no delete button, and Delete does nothing
  const deletePage = numPages > 1 && onDelete ? remove : undefined;
  const handleKeyDown = useThumbnailKeys({
    numPages,
    horizontal,
    onSelect: select,
    onDelete: deletePage,
  });

  return (
    // Focus moves between the options (roving tabindex: the current page is the tab stop), so
    // the listbox itself does not take focus, as in the ARIA listbox pattern
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      ref={setScrollRoot}
      {...getStyles('thumbnails')}
      role="listbox"
      aria-label={labels.pages}
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      aria-keyshortcuts={deletePage ? 'Delete Backspace' : undefined}
      data-orientation={orientation}
      onKeyDown={handleKeyDown}
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
          scrollRoot={scrollRoot}
          reorder={reorder}
          dragState={getItemState(index + 1, index)}
          onSelect={select}
          onDelete={deletePage}
        />
      ))}
    </div>
  );
}
