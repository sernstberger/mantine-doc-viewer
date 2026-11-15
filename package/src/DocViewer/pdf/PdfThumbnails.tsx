import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import React, { useEffect, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { renderPageToCanvas } from './render-page';
import type { PdfPageSize } from './use-pdf-document';
import { useNearViewport } from './use-near-viewport';

/** Width of thumbnail images in px, in the side rail */
export const THUMBNAIL_WIDTH = 112;

/** Width of thumbnail images in px, in the strip above or below the pages */
export const STRIP_THUMBNAIL_WIDTH = 56;

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
  const { getStyles, labels } = useDocViewerContext();
  const horizontal = orientation === 'horizontal';
  const width = horizontal ? STRIP_THUMBNAIL_WIDTH : THUMBNAIL_WIDTH;
  const { ref, near } = useNearViewport<HTMLButtonElement>(
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
      renderTask = renderPageToCanvas(page, canvas, width / pageWidth);
      renderTask.promise.catch(() => {});
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, near, width]);

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
    <button
      ref={ref}
      type="button"
      {...getStyles('thumbnail')}
      onClick={() => onSelect(pageNumber)}
      // One tab stop for the whole list, arrow keys move between pages
      tabIndex={active ? 0 : -1}
      aria-label={labels.goToPage(pageNumber)}
      aria-current={active ? 'page' : undefined}
      data-active={active || undefined}
    >
      <span
        {...getStyles('thumbnailImage', {
          style: { width, height: (pageSize.height / pageSize.width) * width },
        })}
      >
        {near && <canvas ref={canvasRef} {...getStyles('canvas')} aria-hidden />}
      </span>
      <span {...getStyles('thumbnailLabel')}>{pageNumber}</span>
    </button>
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    const next = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: buttons.length - 1,
    }[event.key];

    if (index !== -1 && next !== undefined && buttons[next]) {
      event.preventDefault();
      buttons[next].focus();
    }
  };

  return (
    <nav
      ref={setScrollRoot}
      {...getStyles('thumbnails')}
      aria-label={labels.pages}
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
    </nav>
  );
}
