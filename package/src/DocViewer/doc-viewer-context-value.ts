import type { DocViewerProps } from './DocViewer';
import type { DocViewerContextValue } from './DocViewer.context';
import { DOC_VIEWER_SIZES } from './sizes';
import { useShallowStable } from './use-shallow-stable';
import type { useDocViewerSession } from './use-doc-viewer-session';
import type { useResolvedProps } from './use-resolved-props';

interface DocViewerContextParts {
  props: DocViewerProps;
  getStyles: DocViewerContextValue['getStyles'];
  resolved: ReturnType<typeof useResolvedProps>;
  session: ReturnType<typeof useDocViewerSession>;
  events: DocViewerContextValue['events'];
}

/** The context value the views read: the props, with the resolved and session state laid over them */
export function buildDocViewerContextValue(parts: DocViewerContextParts): DocViewerContextValue {
  const { props, getStyles, resolved, session, events } = parts;
  return {
    getStyles,
    src: props.src,
    type: session.type,
    mimeType: props.mimeType,
    fileName: session.fileName,
    alt: props.alt,
    keepView: props.keepView,
    labels: session.labels,
    locale: props.locale,
    withToolbar: props.withToolbar,
    toolbarHidden: session.tapToggle.hidden,
    autoHeight: props.height === 'auto',
    toolbarControls: props.toolbarControls,
    toolbarSection: props.toolbarSection,
    toolbarStartSection: props.toolbarStartSection,
    toolbarSubtitle: props.toolbarSubtitle,
    renderToolbarTitle: props.renderToolbarTitle,
    renderPageOverlay: props.renderPageOverlay,
    autoAdvance: session.playing,
    pdfWorkerSrc: props.pdfWorkerSrc,
    pdfOptions: props.pdfOptions,
    maxCanvasPixels: props.maxCanvasPixels!,
    defaultThumbnailsOpened: props.defaultThumbnailsOpened,
    defaultPageLayout: resolved.defaultPageLayout,
    pageLayout: resolved.pageLayout,
    thumbnailsPosition: resolved.thumbnailsPosition,
    defaultThumbnailsPosition: props.defaultThumbnailsPosition,
    onThumbnailsPositionChange: props.onThumbnailsPositionChange,
    maxTextSize: props.maxTextSize!,
    language: props.language,
    size: DOC_VIEWER_SIZES[resolved.size] ?? DOC_VIEWER_SIZES.sm,
    color: props.color,
    thumbnailWidth: resolved.thumbnailWidth,
    tooltipProps: props.tooltipProps,
    codeHighlightProps: props.codeHighlightProps,
    controller: session.controller,
    events,
    page: props.page,
    defaultPage: props.defaultPage,
    defaultZoom: props.defaultZoom!,
    withPrint: props.withPrint,
    withDownload: props.withDownload,
    withFullscreen: props.withFullscreen,
    withPageEditing: props.withPageEditing,
    compactPageEditor: props.compactPageEditor,
    withPageTurning: props.withPageTurning,
    withScrollSnap: props.withScrollSnap,
    withScroll: props.withScroll,
    onSave: props.onSave,
    markup: {
      withMarkup: props.withMarkup,
      markupTools: props.markupTools,
      markupTool: props.markupTool,
      defaultMarkupTool: props.defaultMarkupTool,
      onMarkupToolChange: props.onMarkupToolChange,
      markup: props.markup,
      defaultMarkup: props.defaultMarkup,
      onMarkupChange: props.onMarkupChange,
      markupColor: props.markupColor,
      markupWidth: props.markupWidth,
      markupFontSize: props.markupFontSize,
    },
    fullscreen: session.fullscreen.fullscreen,
    toggleFullscreen: session.fullscreen.toggle,
  };
}

/**
 * The context value, the same object while every field (and every markup prop) is the same: each
 * page and thumbnail reads the context, so a new object would render all of them again whenever
 * the viewer or its parent renders
 */
export function useDocViewerContextValue(parts: DocViewerContextParts): DocViewerContextValue {
  const value = buildDocViewerContextValue(parts);
  const markup = useShallowStable(value.markup);
  return useShallowStable({ ...value, markup });
}
