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
import type { DocType } from './detect-doc-type';
import type { ControllerImplementation, DocViewerEvents, DocViewerZoom } from './controller';
import type { DocViewerLabels } from './labels';
import type { DocViewerRenderPageOverlay } from './pdf/page-overlay';
import type { PdfLoadOptions } from './pdf/use-pdf-document';
import type { DocViewerSizeConfig } from './sizes';

export interface DocViewerContextValue {
  getStyles: GetStylesApi<DocViewerFactory>;
  src: string;
  type: DocType;
  mimeType: string | undefined;
  fileName: string | undefined;
  alt: string | undefined;
  labels: DocViewerLabels;
  withToolbar: boolean | undefined;
  toolbarControls: Partial<Record<DocViewerControl, boolean>> | undefined;
  toolbarSection: React.ReactNode;
  renderPageOverlay: DocViewerRenderPageOverlay | undefined;
  pdfWorkerSrc: string | undefined;
  pdfOptions: PdfLoadOptions | undefined;
  maxCanvasPixels: number;
  defaultThumbnailsOpened: boolean | undefined;
  defaultPageLayout: DocViewerPageLayout | undefined;
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
  defaultZoom: DocViewerZoom;
  withPrint: boolean | undefined;
  withDownload: boolean | undefined;
  withFullscreen: boolean | undefined;
  withPageEditing: boolean | undefined;
  onSave:
    | ((
        bytes: Uint8Array,
        info: { reason: 'save' | 'extract' | 'reorder'; pages: number[] }
      ) => void | Promise<void>)
    | undefined;
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
