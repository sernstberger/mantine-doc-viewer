import { useCallbackRef } from '@mantine/hooks';
import type { DocViewerContextValue, DocViewerSaveHandler } from '../doc-viewer.context';
import { updateDocViewerStateAction, type DocViewerStore } from '../doc-viewer.store';
import type { DocViewerExtension } from '../doc-viewer.types';
import type { DocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import type { DocViewerMarkupOptions } from '../DocViewerMarkup/markup-extension';
import type { DocViewerPageEditorOptions } from '../DocViewerPageEditor/page-editor-extension';
import { DOC_VIEWER_SIZES } from '../utils/sizes';
import { MAX_CANVAS_PIXELS } from '../utils/render-page';
import type { DocViewerRootProps } from './DocViewerRoot';
import { getSaveHandler } from './get-save-handler';
import type { DocViewerLayoutConfig } from './layout-context';
import type { useDocViewerSession } from './use-doc-viewer-session';
import { useShallowStable } from './use-shallow-stable';

export const DEFAULT_THUMBNAILS_WIDTH = 112;
export const DEFAULT_MAX_TEXT_SIZE = 2_000_000;

/** Options of the extension with this name, undefined when it is not in `extensions` */
export function getExtensionOptions<T>(extensions: DocViewerExtension[] | undefined, name: string) {
  return extensions?.find((extension) => extension.name === name)?.options as T | undefined;
}

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

/** The context value the views read, from Root's props, the layout of `DocViewer` and the extensions */
export function buildDocViewerContextValue(parts: DocViewerContextParts): DocViewerContextValue {
  const { props, layout, getStyles, session, events, store, adapters, thumbnails } = parts;
  const { toolbarProps, pagesProps, textProps } = layout;
  const editor = getExtensionOptions<DocViewerPageEditorOptions>(props.extensions, 'page-editor');
  const markup = getExtensionOptions<DocViewerMarkupOptions>(props.extensions, 'markup');

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
    withPageEditing: !!editor,
    withThumbnailEditing: editor?.withThumbnailEditing !== false,
    compactPageEditor: editor?.compact,
    withPageTurning: pagesProps?.withPageTurning,
    withScrollSnap: pagesProps?.withScrollSnap,
    withScroll: pagesProps?.withScroll,
    onSave: getSaveHandler({ editor, markup, fileName: session.fileName }),
    markup: {
      withMarkup: !!markup,
      markupTools: markup?.tools,
      markupTool: markup?.tool,
      defaultMarkupTool: markup?.defaultTool,
      onMarkupToolChange: markup?.onToolChange,
      markup: markup?.value,
      defaultMarkup: markup?.defaultValue,
      onMarkupChange: markup?.onChange,
      markupColor: markup?.color,
      markupWidth: markup?.width,
      markupFontSize: markup?.fontSize,
    },
    fullscreen: session.fullscreen.fullscreen,
    toggleFullscreen: session.fullscreen.toggle,
  };
}

/**
 * The context value, the same object while every field (and every markup option) is the same:
 * each page and thumbnail reads the context, so a new object would render all of them again
 * whenever the viewer or its parent renders
 */
export function useDocViewerContextValue(parts: DocViewerContextParts): DocViewerContextValue {
  const value = buildDocViewerContextValue(parts);
  const markup = useShallowStable(value.markup);
  const save = useCallbackRef<DocViewerSaveHandler>((bytes, info) => value.onSave!(bytes, info));
  const onThumbnailsOpenedChange = useCallbackRef(value.onThumbnailsOpenedChange!);
  const onThumbnailsPositionChange = useCallbackRef(value.onThumbnailsPositionChange!);
  return useShallowStable({
    ...value,
    markup,
    onSave: value.onSave && save,
    onThumbnailsOpenedChange,
    onThumbnailsPositionChange,
  });
}
