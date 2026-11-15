import { useElementSize, useMergedRef } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import type { DocViewerContextValue } from '../DocViewer.context';
import { getPageSize, getViewScale, isTwoPages, nextRotation, scrollsWindow } from './geometry';
import type { PdfRotation } from './render-page';
import type { getLoaded } from './use-pdf-document';
import { usePageLayout } from './use-page-layout';
import { usePagesGutter } from './use-pages-gutter';
import { usePresentation } from './use-presentation';
import { useThumbnailsPanel } from './use-thumbnails-panel';
import type { DocViewerZoom } from '../controller';
import { useZoomSetting } from '../use-zoom-setting';
import { fromPdfZoom, toPdfZoom, type PdfZoom } from './zoom';

/** The loaded state of a PDF, its document and its page count, as `getLoaded` gives them */
export type PdfLoaded = ReturnType<typeof getLoaded>;

/** Gap between two pages side by side, read from the CSS since `pageGap` sets it */
function useColumnGap(pages: HTMLElement | null, twoPages: boolean) {
  const [columnGap, setColumnGap] = useState(16);

  useEffect(() => {
    if (pages && twoPages) {
      setColumnGap(parseFloat(getComputedStyle(pages).columnGap) || 0);
    }
  }, [pages, twoPages]);

  return columnGap;
}

/**
 * How the PDF sits on screen: zoom, page layout, rotation, the thumbnails strip, the scroll
 * area and its size, a presentation, and the scale all of that gives the pages
 */
export function usePdfViewGeometry(context: DocViewerContextValue, ready: PdfLoaded['ready']) {
  const { layout, setLayout } = usePageLayout({
    controlled: context.pageLayout,
    defaultLayout: context.defaultPageLayout,
    onChange: context.events.onPageLayoutChange,
  });
  const [rotation, setRotation] = useState<PdfRotation>(0);
  const thumbnailsPanel = useThumbnailsPanel(context);

  const [pagesNode, setPagesNode] = useState<HTMLDivElement | null>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const { ref: bodyRef, width: bodyWidth, height: bodyHeight } = useElementSize<HTMLDivElement>();
  const setBodyRef = useMergedRef(bodyRef, setScrollRoot);

  const columnGap = useColumnGap(pagesNode, isTwoPages(layout));
  const gutter = usePagesGutter(pagesNode, bodyWidth);
  const pageSize = getPageSize(ready?.firstPageSize, rotation);
  const presentation = usePresentation({
    fullscreen: context.fullscreen,
    toggleFullscreen: context.toggleFullscreen,
    body: scrollRoot,
  });
  const { presenting } = presentation;
  const viewport = scrollsWindow(context.autoHeight, context.fullscreen, presenting);
  /** The scale a zoom gives the pages in the view as it is now */
  const scaleOf = (setting: DocViewerZoom) =>
    getViewScale({
      ready: !!ready,
      presenting,
      pageSize,
      zoom: toPdfZoom(setting),
      layout,
      bodyWidth,
      bodyHeight,
      columnGap,
      gutter,
      autoHeight: viewport,
    });
  const zoomSetting = useZoomSetting({
    value: context.zoom,
    defaultValue: context.defaultZoom,
    ready: !!ready,
    scaleOf,
    onZoomChange: context.events.onZoomChange,
  });
  const { scale } = zoomSetting;

  return {
    zoom: toPdfZoom(zoomSetting.zoom),
    setZoom: (zoom: PdfZoom) => zoomSetting.setZoom(fromPdfZoom(zoom)),
    layout,
    setLayout,
    rotation,
    rotate: () => setRotation(nextRotation),
    thumbnailsPanel,
    pagesNode,
    setPagesNode,
    scrollRoot,
    setBodyRef,
    bodyWidth,
    columnGap,
    pageSize,
    presentation,
    presenting,
    viewport,
    // A document is open for reading: loaded, and not shown as a presentation
    reading: !!ready && !presenting,
    scale,
    horizontal: layout === 'horizontal',
  };
}

export type PdfViewGeometry = ReturnType<typeof usePdfViewGeometry>;
