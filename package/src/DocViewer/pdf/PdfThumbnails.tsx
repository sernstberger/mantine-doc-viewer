import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import React, { useEffect, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { renderPageToCanvas } from './render-page';
import type { PdfPageSize } from './use-pdf-document';
import { useNearViewport } from './use-near-viewport';

/** Width of thumbnail images in px */
export const THUMBNAIL_WIDTH = 112;

interface PdfThumbnailProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  placeholderSize: PdfPageSize;
  active: boolean;
  scrollRoot: HTMLElement | null;
  onSelect: (pageNumber: number) => void;
}

function PdfThumbnail({
  document,
  pageNumber,
  placeholderSize,
  active,
  scrollRoot,
  onSelect,
}: PdfThumbnailProps) {
  const { getStyles } = useDocViewerContext();
  const { ref, near } = useNearViewport<HTMLButtonElement>(scrollRoot, '100% 0px');
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

      const { width, height } = page.getViewport({ scale: 1 });
      setSize({ width, height });
      renderTask = renderPageToCanvas(page, canvas, THUMBNAIL_WIDTH / width);
      renderTask.promise.catch(() => {});
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, near]);

  // Keep the active thumbnail visible, scrolling only the sidebar
  useEffect(() => {
    const node = ref.current;
    if (!active || !node || !scrollRoot) {
      return;
    }

    const top = node.offsetTop;
    const bottom = top + node.offsetHeight;
    if (top < scrollRoot.scrollTop || bottom > scrollRoot.scrollTop + scrollRoot.clientHeight) {
      scrollRoot.scrollTo({ top: top - scrollRoot.clientHeight / 2 + node.offsetHeight / 2 });
    }
  }, [active, scrollRoot, ref]);

  const pageSize = size ?? placeholderSize;

  return (
    <button
      ref={ref}
      type="button"
      {...getStyles('thumbnail')}
      onClick={() => onSelect(pageNumber)}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={active ? 'page' : undefined}
      data-active={active || undefined}
    >
      <span
        {...getStyles('thumbnailImage', {
          style: { height: (pageSize.height / pageSize.width) * THUMBNAIL_WIDTH },
        })}
      >
        {near && <canvas ref={canvasRef} {...getStyles('canvas')} />}
      </span>
      <span {...getStyles('thumbnailLabel')}>{pageNumber}</span>
    </button>
  );
}

interface PdfThumbnailsProps {
  document: PDFDocumentProxy;
  placeholderSize: PdfPageSize;
  currentPage: number;
  onSelect: (pageNumber: number) => void;
}

export function PdfThumbnails({
  document,
  placeholderSize,
  currentPage,
  onSelect,
}: PdfThumbnailsProps) {
  const { getStyles } = useDocViewerContext();
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  return (
    <nav ref={setScrollRoot} {...getStyles('thumbnails')} aria-label="Pages">
      {Array.from({ length: document.numPages }, (_, index) => (
        <PdfThumbnail
          key={index + 1}
          document={document}
          pageNumber={index + 1}
          placeholderSize={placeholderSize}
          active={currentPage === index + 1}
          scrollRoot={scrollRoot}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}
