import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useMergedRef } from '@mantine/hooks';
import React, { useEffect, useMemo, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { DragHandleIcon } from '../icons';
import { initialOrder } from './page-edits';
import { PdfRotation, rotateSize } from './render-page';
import type { PdfPageSize } from './use-pdf-document';
import type { PdfLayersState } from './use-pdf-layers';
import { useNearViewport } from './use-near-viewport';
import { usePagePreview } from './use-page-preview';
import { ReorderList, useReorderItem, useReorderList } from './use-reorder-drag';

export type ThumbnailsOrientation = 'vertical' | 'horizontal';

/** How many thumbnails fit in the rail, at least one */
export function getThumbnailsPerView(railSize: number, thumbnailSize: number) {
  return Math.max(1, Math.floor(railSize / (thumbnailSize || 1)));
}

/** Page a listbox key moves to from `page`, kept within the document, or null for other keys */
export function getNextThumbnailPage(
  key: string,
  page: number,
  numPages: number,
  perView: number
): number | null {
  const moves: Record<string, number> = {
    ArrowDown: page + 1,
    ArrowRight: page + 1,
    ArrowUp: page - 1,
    ArrowLeft: page - 1,
    PageDown: page + perView,
    PageUp: page - perView,
    Home: 1,
    End: numPages,
  };
  return key in moves ? Math.min(Math.max(moves[key], 1), numPages) : null;
}

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
  onSelect: (pageNumber: number) => void;
}

function PdfThumbnail({
  document,
  pageNumber,
  placeholderSize,
  active,
  rotation,
  layers,
  orientation,
  scrollRoot,
  reorder,
  onSelect,
}: PdfThumbnailProps) {
  const { getStyles, labels, thumbnailWidth } = useDocViewerContext();
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

  // Keep the active thumbnail visible, scrolling only the sidebar
  useEffect(() => {
    const node = ref.current;
    if (!active || !node || !scrollRoot) {
      return;
    }

    if (horizontal) {
      const left = node.offsetLeft;
      const right = left + node.offsetWidth;
      if (left < scrollRoot.scrollLeft || right > scrollRoot.scrollLeft + scrollRoot.clientWidth) {
        scrollRoot.scrollTo({ left: left - scrollRoot.clientWidth / 2 + node.offsetWidth / 2 });
      }
      return;
    }

    const top = node.offsetTop;
    const bottom = top + node.offsetHeight;
    if (top < scrollRoot.scrollTop || bottom > scrollRoot.scrollTop + scrollRoot.clientHeight) {
      scrollRoot.scrollTo({ top: top - scrollRoot.clientHeight / 2 + node.offsetHeight / 2 });
    }
  }, [active, scrollRoot, ref, horizontal]);

  const pageSize = size ?? rotateSize(placeholderSize, rotation);

  return (
    <div
      ref={thumbnailRef}
      {...getStyles('thumbnail')}
      {...(reorder.enabled ? reorder.getItemProps(pageNumber, pageNumber - 1) : undefined)}
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

interface PdfThumbnailsProps {
  document: PDFDocumentProxy;
  placeholderSize: PdfPageSize;
  currentPage: number;
  rotation: PdfRotation;
  layers?: PdfLayersState;
  orientation: ThumbnailsOrientation;
  onSelect: (pageNumber: number) => void;
  /** Reorders the document by dragging thumbnails; without it thumbnails do not drag */
  onReorder?: (pageNumber: number, toIndex: number) => void;
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
}: PdfThumbnailsProps) {
  const { getStyles, labels } = useDocViewerContext();
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  const numPages = document.numPages;
  const horizontal = orientation === 'horizontal';
  const order = useMemo(() => initialOrder(numPages), [numPages]);
  const reorder = useReorderList({
    container: scrollRoot,
    layout: horizontal ? 'horizontal' : 'vertical',
    order,
    // Only called when dragging is enabled, which needs onReorder
    onReorder: (page, toIndex) => onReorder!(page, toIndex),
    enabled: !!onReorder,
  });

  // Listbox keys, with selection following focus: moving to a thumbnail shows its page
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const root = event.currentTarget;
    const option = (event.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    const page = Number(option?.dataset.pageNumber);
    if (!page) {
      return;
    }

    // Page Up and Page Down move by the number of thumbnails that fit in the rail
    const perView = getThumbnailsPerView(
      horizontal ? root.clientWidth : root.clientHeight,
      horizontal ? option!.offsetWidth : option!.offsetHeight
    );
    const next = getNextThumbnailPage(event.key, page, numPages, perView);

    if (next === null) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(page);
      }
      return;
    }

    event.preventDefault();
    onSelect(next);
    root.querySelector<HTMLElement>(`[data-page-number="${next}"]`)?.focus();
  };

  return (
    <div
      ref={setScrollRoot}
      {...getStyles('thumbnails')}
      role="listbox"
      aria-label={labels.pages}
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
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
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
