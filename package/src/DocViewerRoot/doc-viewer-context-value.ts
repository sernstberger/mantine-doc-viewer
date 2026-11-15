import { useCallbackRef } from '@mantine/hooks';
import type { DocViewerContextValue } from '../doc-viewer.context';
import { updateDocViewerStateAction, type DocViewerStore } from '../doc-viewer.store';
import type { DocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import { DOC_VIEWER_SIZES } from '../utils/sizes';
import { MAX_CANVAS_PIXELS } from '../utils/render-page';
import type { DocViewerRootProps } from './DocViewerRoot';
import type { DocViewerLayoutConfig } from './layout-context';
import type { useDocViewerSession } from './use-doc-viewer-session';
import { useShallowStable } from './use-shallow-stable';

export const DEFAULT_THUMBNAILS_WIDTH = 112;
export const DEFAULT_MAX_TEXT_SIZE = 2_000_000;

interface DocViewerContextParts {
  props: DocViewerRootProps;
  layout: DocViewerLayoutConfig;
  getStyles: DocViewerContextValue['getStyles'];
  session: ReturnType<typeof useDocViewerSession>;
  events: DocViewerContextValue['events'];
  store: DocViewerStore;
  adapters: DocViewerAdapters;
  thumbnails: Pick<DocViewerContextValue, 'thumbnailsOpened' | 'thumbnailsPosition'>;
}

/** The context value the views read, from Root's props and the layout of `DocViewer` */
export function buildDocViewerContextValue(parts: DocViewerContextParts): DocViewerContextValue {
  const { props, layout, getStyles, session, events, store, adapters, thumbnails } = parts;
  const { toolbarProps, pagesProps, textProps } = layout;

  return {
    getStyles,
    store,
    pdfAdapter: adapters.pdf,
    src: props.src,
    type: session.type,
    mimeType: props.mimeType,
    fileName: session.fileName,
    alt: layout.imageProps?.alt,
    keepView: props.keepView,
    labels: session.labels,
    locale: props.locale,
    withToolbar: layout.withToolbar ?? true,
    toolbarHidden: session.tapToggle.hidden,
    autoHeight: !!props.autosize,
    toolbarControls: layout.toolbarControls,
    toolbarSection: toolbarProps?.rightSection,
    toolbarStartSection: toolbarProps?.leftSection,
    toolbarTitle: toolbarProps?.title,
    toolbarSubtitle: toolbarProps?.subtitle,
    renderPageOverlay: pagesProps?.renderPageOverlay,
    maxCanvasPixels: pagesProps?.maxCanvasPixels ?? MAX_CANVAS_PIXELS,
    thumbnailsOpened: thumbnails.thumbnailsOpened,
    defaultThumbnailsOpened: undefined,
    onThumbnailsOpenedChange: (opened) =>
      updateDocViewerStateAction({ thumbnailsOpened: opened }, store),
    defaultPageLayout: props.defaultPageLayout,
    pageLayout: props.pageLayout,
    thumbnailsPosition: thumbnails.thumbnailsPosition,
    defaultThumbnailsPosition: undefined,
    onThumbnailsPositionChange: (position) =>
      updateDocViewerStateAction({ thumbnailsPosition: position }, store),
    maxTextSize: textProps?.maxSize ?? DEFAULT_MAX_TEXT_SIZE,
    language: textProps?.language,
    size: DOC_VIEWER_SIZES[props.size!] ?? DOC_VIEWER_SIZES.sm,
    color: props.color,
    thumbnailWidth: layout.thumbnailsProps?.width ?? DEFAULT_THUMBNAILS_WIDTH,
    tooltipProps: toolbarProps?.tooltipProps,
    searchInputProps: layout.searchProps?.inputProps,
    passwordInputProps: pagesProps?.passwordInputProps,
    codeHighlightProps: textProps?.codeHighlightProps,
    controller: session.controller,
    events,
    page: props.page,
    defaultPage: props.defaultPage,
    zoom: props.zoom,
    defaultZoom: props.defaultZoom!,
    withFullscreen: layout.toolbarControls?.fullscreen !== false,
    withPageTurning: pagesProps?.withPageTurning,
    withScrollSnap: pagesProps?.withScrollSnap,
    withScroll: pagesProps?.withScroll,
    fullscreen: session.fullscreen.fullscreen,
    toggleFullscreen: session.fullscreen.toggle,
  };
}

/**
 * The context value, the same object while every field is the same: each page and thumbnail
 * reads the context, so a new object would render all of them again whenever the viewer or its
 * parent renders
 */
export function useDocViewerContextValue(parts: DocViewerContextParts): DocViewerContextValue {
  const value = buildDocViewerContextValue(parts);
  const onThumbnailsOpenedChange = useCallbackRef(value.onThumbnailsOpenedChange!);
  const onThumbnailsPositionChange = useCallbackRef(value.onThumbnailsPositionChange!);
  return useShallowStable({
    ...value,
    onThumbnailsOpenedChange,
    onThumbnailsPositionChange,
  });
}
