export { DocViewer } from './DocViewer/DocViewer';
export type {
  DocViewerProps,
  DocViewerCssVariables,
  DocViewerFactory,
  DocViewerStylesNames,
  DocViewerThumbnailsPosition,
  DocViewerPageLayout,
  DocViewerControl,
  DocViewerVariant,
} from './DocViewer/DocViewer';
export type { DocViewerAutoAdvance } from './DocViewer/kiosk';
export type { DocViewerResponsive } from './DocViewer/responsive';
export { detectDocType } from './DocViewer/detect-doc-type';
export type { DocType, DetectDocTypeInput } from './DocViewer/detect-doc-type';
export { DEFAULT_LABELS as DOC_VIEWER_DEFAULT_LABELS } from './DocViewer/labels';
export type { DocViewerLabels } from './DocViewer/labels';
export { DocViewerToolbar } from './DocViewer/DocViewerToolbar';
export type { DocViewerToolbarProps } from './DocViewer/DocViewerToolbar';
export { DocViewerTooltip } from './DocViewer/controls';
export { DocViewerLoading, DocViewerMessage } from './DocViewer/views/MessageView';
export type { DocViewerMessageProps } from './DocViewer/views/MessageView';
export { DocViewerBody, useDocViewer } from './DocViewer/renderers';
export type { DocViewerBodyProps, DocViewerFile, DocViewerRenderer } from './DocViewer/renderers';
export { useTextDocument } from './DocViewer/text/use-text-document';
export type { TextDocumentState } from './DocViewer/text/use-text-document';
export type { PdfLoadOptions } from './DocViewer/pdf/use-pdf-document';
export type {
  DocViewerRenderToolbarTitle,
  DocViewerToolbarTitleInfo,
} from './DocViewer/DocViewerToolbar';
export type {
  DocViewerPageOverlayInfo,
  DocViewerRenderPageOverlay,
} from './DocViewer/pdf/page-overlay';
export type { DocViewerPageRect } from './DocViewer/pdf/page-points';
export type {
  DocViewerController,
  DocViewerEvents,
  DocViewerGoToPageOptions,
  DocViewerHighlightTarget,
  DocViewerLoadInfo,
  DocViewerLoadStartInfo,
  DocViewerOutlineItem,
  DocViewerReadingProgress,
  DocViewerZoom,
} from './DocViewer/controller';
