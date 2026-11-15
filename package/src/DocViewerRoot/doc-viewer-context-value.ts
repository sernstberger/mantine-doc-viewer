import type { DocViewerContextValue } from '../doc-viewer.context';
import type { DocViewerStore } from '../doc-viewer.store';
import type { DocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import { DOC_VIEWER_SIZES } from '../utils/sizes';
import type { DocViewerRootProps } from './DocViewerRoot';
import type { DocViewerLayoutConfig } from './layout-context';
import type { useDocViewerSession } from './use-doc-viewer-session';
import { useShallowStable } from './use-shallow-stable';

interface DocViewerContextParts {
  props: DocViewerRootProps;
  layout: DocViewerLayoutConfig;
  getStyles: DocViewerContextValue['getStyles'];
  session: ReturnType<typeof useDocViewerSession>;
  events: DocViewerContextValue['events'];
  store: DocViewerStore;
  adapters: DocViewerAdapters;
}

/** The context value the views read, from Root's props and the layout of `DocViewer` */
export function buildDocViewerContextValue(parts: DocViewerContextParts): DocViewerContextValue {
  const { props, layout, getStyles, session, events, store, adapters } = parts;
  return {
    getStyles,
    store,
    pdfAdapter: adapters.pdf,
    src: props.src,
    type: session.type,
    mimeType: props.mimeType,
    fileName: session.fileName,
    keepView: props.keepView,
    labels: session.labels,
    locale: props.locale,
    autoHeight: !!props.autosize,
    toolbarControls: layout.toolbarControls,
    defaultPageLayout: props.defaultPageLayout,
    pageLayout: props.pageLayout,
    size: DOC_VIEWER_SIZES[props.size!] ?? DOC_VIEWER_SIZES.sm,
    color: props.color,
    unstyled: props.unstyled,
    controller: session.controller,
    events,
    page: props.page,
    defaultPage: props.defaultPage,
    zoom: props.zoom,
    defaultZoom: props.defaultZoom!,
    withFullscreen: layout.toolbarControls?.fullscreen !== false,
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
  return useShallowStable(buildDocViewerContextValue(parts));
}
