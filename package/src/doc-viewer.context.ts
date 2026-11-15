import type {
  DocViewerControl,
  DocViewerFactory,
  DocViewerPageLayout,
  DocViewerPasswordInputProps,
  DocViewerSearchInputProps,
  DocViewerThumbnailsPosition,
} from './DocViewerRoot/DocViewerRoot';
import type { CodeHighlightProps } from '@mantine/code-highlight';
import {
  createSafeContext,
  type GetStylesApi,
  type MantineColor,
  type TooltipProps,
} from '@mantine/core';
import type { DocViewerType } from './utils/get-doc-viewer-type';
import type {
  ControllerImplementation,
  DocViewerEvents,
  DocViewerZoom,
} from './hooks/use-controller-registry';
import type { DocViewerLabels } from './default-labels';
import type { DocViewerAutoAdvance } from './utils/kiosk';
import type { DocViewerRenderPageOverlay } from './utils/page-overlay';
import type { DocViewerPageTurning } from './utils/spreads';
import type { DocViewerPdfOptions } from './hooks/pdf/use-pdf-document';
import type { DocViewerRenderToolbarTitle } from './DocViewerToolbar/ToolbarView';
import type { DocViewerMarkupProps } from './hooks/pdf/use-markup';
import type { DocViewerSizeConfig } from './utils/sizes';
import { createElement } from 'react';
import { useShallowStable } from './DocViewerRoot/use-shallow-stable';

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
  thumbnailsOpened: boolean | undefined;
  defaultThumbnailsOpened: boolean | undefined;
  onThumbnailsOpenedChange: ((opened: boolean) => void) | undefined;
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
  searchInputProps: DocViewerSearchInputProps | undefined;
  passwordInputProps: DocViewerPasswordInputProps | undefined;
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

const [DocViewerFullProvider, useDocViewerContext] = createSafeContext<DocViewerContextValue>(
  'DocViewer component was not found in the tree'
);
export { useDocViewerContext };

/**
 * What pages, thumbnails and page tiles read. These rarely change, unlike the rest of the context
 * (the controlled page, zoom, fullscreen, the toolbar's tap toggle), so a memoised page only
 * renders again when its own props change
 */
export type DocViewerPageContextValue = Pick<
  DocViewerContextValue,
  'getStyles' | 'labels' | 'maxCanvasPixels' | 'renderPageOverlay' | 'thumbnailWidth'
>;

const [DocViewerPageProvider, useDocViewerPageContext] =
  createSafeContext<DocViewerPageContextValue>('DocViewer component was not found in the tree');
export { useDocViewerPageContext };

/** Provides the context, and the part of it pages read as a context of its own */
export function DocViewerProvider({
  value,
  children,
}: {
  value: DocViewerContextValue;
  children: React.ReactNode;
}) {
  const { getStyles, labels, maxCanvasPixels, renderPageOverlay, thumbnailWidth } = value;
  const pageValue = useShallowStable({
    getStyles,
    labels,
    maxCanvasPixels,
    renderPageOverlay,
    thumbnailWidth,
  });
  return createElement(
    DocViewerFullProvider,
    { value },
    createElement(DocViewerPageProvider, { value: pageValue }, children)
  );
}

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
