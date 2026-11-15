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
  scrollRoot,
  reorder,
  dragState,
  onSelect,
  actions,
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
      aria-label={labels.thumbnailLabel(pageNumber)}
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

/**
 * The thumbnails strip. An extension's setup can make thumbnails drag to reorder and delete pages
 * (PdfThumbnailEditsContext); its thumbnail actions show on each thumbnail
 */

export function PdfThumbnails({
  document,
  placeholderSize,
  currentPage,
  rotation,
  layers,
  orientation,
  onSelect,
}: PdfThumbnailsProps) {
  const { getStyles, labels } = useDocViewerPageContext();
  const edits = use(PdfThumbnailEditsContext);
  const actions = useThumbnailActions();
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  const numPages = document.numPages;
  const horizontal = orientation === 'horizontal';
  const order = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages]
  );
  const { list: reorder, getItemState } = useReorderList({
    container: scrollRoot,
    layout: horizontal ? 'horizontal' : 'vertical',
    order,
    // Only called when dragging is enabled, which needs the edits
    onReorder: (page, toIndex) => edits!.onReorder(page, toIndex),
    enabled: !!edits,
  });

  // The same functions on every render, so thumbnails skip renders their own props do not need
  const select = useCallbackRef(onSelect);
  // Only called when the edits can delete
  const remove = useCallbackRef((page: number) => edits!.onDelete!(page));
  const deletePage = edits?.onDelete ? remove : undefined;
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
      aria-label={labels.pagesLabel}
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
          actions={actions}
        />
      ))}
    </div>
  );
}
