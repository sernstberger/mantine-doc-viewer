import type {
  DocViewerControl,
  DocViewerFactory,
  DocViewerPageLayout,
  DocViewerThumbnailsPosition,
} from './DocViewer';
import type { CodeHighlightProps } from '@mantine/code-highlight';
import {
  createSafeContext,
  type GetStylesApi,
  type MantineColor,
  type TooltipProps,
} from '@mantine/core';
import type { DocViewerType } from './detect-doc-type';
import type { ControllerImplementation, DocViewerEvents, DocViewerZoom } from './controller';
import type { DocViewerLabels } from './labels';
import type { DocViewerAutoAdvance } from './kiosk';
import type { DocViewerRenderPageOverlay } from './pdf/page-overlay';
import type { DocViewerPageTurning } from './pdf/spreads';
import type { DocViewerPdfOptions } from './pdf/use-pdf-document';
import type { DocViewerRenderToolbarTitle } from './DocViewerToolbar';
import type { DocViewerMarkupProps } from './pdf/use-markup';
import type { DocViewerSizeConfig } from './sizes';

export interface DocViewerContextValue {
  getStyles: GetStylesApi<DocViewerFactory>;
  src: string;
  type: DocViewerType;
  mimeType: string | undefined;
  fileName: string | undefined;
  alt: string | undefined;
  keepView: boolean | undefined;
  labels: DocViewerLabels;
  locale: string | undefined;
  withToolbar: boolean | undefined;
  toolbarHidden: boolean;
  /** The viewer grows to its content and the window scrolls */
  autoHeight: boolean;
  toolbarControls: Partial<Record<DocViewerControl, boolean>> | undefined;
  toolbarSection: React.ReactNode;
  toolbarStartSection: React.ReactNode;
  toolbarSubtitle: React.ReactNode;
  renderToolbarTitle: DocViewerRenderToolbarTitle | undefined;
  renderPageOverlay: DocViewerRenderPageOverlay | undefined;

  /** Set while the viewer should play: `autoAdvance`, once the viewer is idle when `idleTimeout` is set */
  autoAdvance: DocViewerAutoAdvance | undefined;
  pdfWorkerSrc: string | undefined;
  pdfOptions: DocViewerPdfOptions | undefined;
  maxCanvasPixels: number;
  defaultThumbnailsOpened: boolean | undefined;
  defaultPageLayout: DocViewerPageLayout | undefined;
  pageLayout: DocViewerPageLayout | undefined;
  thumbnailsPosition: DocViewerThumbnailsPosition | undefined;
  defaultThumbnailsPosition: DocViewerThumbnailsPosition | undefined;
  onThumbnailsPositionChange: ((position: DocViewerThumbnailsPosition) => void) | undefined;
  maxTextSize: number;
  language: string | undefined;
  size: DocViewerSizeConfig;
  color: MantineColor | undefined;
  thumbnailWidth: number;
  tooltipProps: Omit<TooltipProps, 'label' | 'children'> | undefined;
  codeHighlightProps: Omit<CodeHighlightProps, 'code' | 'language'> | undefined;
  controller: React.RefObject<ControllerImplementation>;
  events: Required<DocViewerEvents>;
  page: number | undefined;
  defaultPage: number | undefined;
  zoom: DocViewerZoom | undefined;
  defaultZoom: DocViewerZoom;
  withFullscreen: boolean | undefined;
  withPageEditing: boolean | undefined;
  compactPageEditor: boolean | undefined;
  withPageTurning: boolean | DocViewerPageTurning | undefined;
  withScrollSnap: boolean | undefined;
  withScroll: boolean | undefined;
  onSave:
    | ((
        bytes: Uint8Array,
        info: { reason: 'save' | 'extract' | 'reorder' | 'delete' | 'annotate'; pages: number[] }
      ) => void | Promise<void>)
    | undefined;
  markup: DocViewerMarkupProps;
  fullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
}

export const [DocViewerProvider, useDocViewerContext] = createSafeContext<DocViewerContextValue>(
  'DocViewer component was not found in the tree'
);

/** Name of the document for the toolbar title and the scroll area's screen reader name */
export function useDocumentTitle() {
  const { fileName, labels } = useDocViewerContext();
  return fileName ?? labels.document;
}

/** Whether a toolbar control is shown: hidden only when `toolbarControls` sets it to false */
export function useShowControl() {
  const { toolbarControls } = useDocViewerContext();
  return (control: DocViewerControl) => toolbarControls?.[control] !== false;
}
