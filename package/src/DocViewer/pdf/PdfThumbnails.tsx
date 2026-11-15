import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import React, { useEffect, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { renderPageToCanvas } from './render-page';
import type { PdfPageSize } from './use-pdf-document';
import { useNearViewport } from './use-near-viewport';
import { useReleasePage } from './use-release-page';

export type ThumbnailsOrientation = 'vertical' | 'horizontal';

interface PdfThumbnailProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  placeholderSize: PdfPageSize;
  active: boolean;
  orientation: ThumbnailsOrientation;
  scrollRoot: HTMLElement | null;
  onSelect: (pageNumber: number) => void;
}

function PdfThumbnail({
  document,
  pageNumber,
  placeholderSize,
  active,
  orientation,
  scrollRoot,
  onSelect,
}: PdfThumbnailProps) {
  const { getStyles, labels, thumbnailWidth, maxCanvasPixels } = useDocViewerContext();
  const horizontal = orientation === 'horizontal';
  // Half size in the strip above or below the pages
  const width = horizontal ? Math.round(thumbnailWidth / 2) : thumbnailWidth;
  const { ref, near } = useNearViewport<HTMLDivElement>(
    scrollRoot,
    horizontal ? '0px 100%' : '100% 0px'
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<PdfPageSize | null>(null);

  useEffect(() => {
    if (!near) {
      return undefined;
    }

    let cancelled = false;
    let renderTask: RenderTask | undefined;

    document.getPage(pageNumber).then((page) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) {
        return;
      }

      const { width: pageWidth, height } = page.getViewport({ scale: 1 });
      setSize({ width: pageWidth, height });
      renderTask = renderPageToCanvas(page, canvas, width / pageWidth, maxCanvasPixels);
      renderTask.promise.catch(() => {});
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, near, width, maxCanvasPixels]);

  useReleasePage(document, pageNumber, near);

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

  const pageSize = size ?? placeholderSize;

  return (
    <div
      ref={ref}
      {...getStyles('thumbnail')}
      role="option"
      aria-selected={active}
      aria-label={labels.thumbnail(pageNumber)}
      // One tab stop for the whole list: the current page. Arrow keys move from there
      tabIndex={active ? 0 : -1}
      data-page-number={pageNumber}
      data-active={active || undefined}
      onClick={() => onSelect(pageNumber)}
    >
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
  orientation: ThumbnailsOrientation;
  onSelect: (pageNumber: number) => void;
}

export function PdfThumbnails({
  document,
  placeholderSize,
  currentPage,
  orientation,
  onSelect,
}: PdfThumbnailsProps) {
  const { getStyles, labels } = useDocViewerContext();
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  const numPages = document.numPages;
  const horizontal = orientation === 'horizontal';

  // Listbox keys, with selection following focus: moving to a thumbnail shows its page
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const root = event.currentTarget;
    const option = (event.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    const page = Number(option?.dataset.pageNumber);
    if (!page) {
      return;
    }

    // Page Up and Page Down move by the number of thumbnails that fit in the rail
    const size = horizontal ? option!.offsetWidth : option!.offsetHeight;
    const perView = Math.max(
      1,
      Math.floor((horizontal ? root.clientWidth : root.clientHeight) / (size || 1))
    );
    const next = {
      ArrowDown: page + 1,
      ArrowRight: page + 1,
      ArrowUp: page - 1,
      ArrowLeft: page - 1,
      PageDown: page + perView,
      PageUp: page - perView,
      Home: 1,
      End: numPages,
    }[event.key];

    if (next === undefined) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(page);
      }
      return;
    }

    event.preventDefault();
    const target = Math.min(Math.max(next, 1), numPages);
    onSelect(target);
    root.querySelector<HTMLElement>(`[data-page-number="${target}"]`)?.focus();
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
          orientation={orientation}
          scrollRoot={scrollRoot}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
