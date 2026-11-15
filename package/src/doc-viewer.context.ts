import { createSafeContext, type GetStylesApi, type MantineColor } from '@mantine/core';
import { createElement } from 'react';
import type { DocViewerLabels } from './default-labels';
import type { DocViewerPdfAdapter } from './DocViewerAdapterProvider/adapters/pdfjs-adapter';
import type { DocViewerRootFactory } from './DocViewerRoot/DocViewerRoot';
import type { DocViewerStore } from './doc-viewer.store';
import type { DocViewerControl, DocViewerPageLayout, DocViewerZoom } from './doc-viewer.types';
import type { ControllerImplementation, DocViewerEvents } from './hooks/use-controller-registry';
import { useShallowStable } from './DocViewerRoot/use-shallow-stable';
import type { DocViewerType } from './utils/get-doc-viewer-type';
import type { DocViewerSizeConfig } from './utils/sizes';

export interface DocViewerContextValue {
  getStyles: GetStylesApi<DocViewerRootFactory>;
  store: DocViewerStore;
  pdfAdapter: DocViewerPdfAdapter | undefined;
  src: string;
  type: DocViewerType;
  mimeType: string | undefined;
  fileName: string | undefined;
  keepView: boolean | undefined;
  labels: DocViewerLabels;
  locale: string | undefined;
  autoHeight: boolean;
  toolbarControls: Partial<Record<DocViewerControl, boolean>> | undefined;
  defaultPageLayout: DocViewerPageLayout | undefined;
  pageLayout: DocViewerPageLayout | undefined;
  size: DocViewerSizeConfig;
  color: MantineColor | undefined;
  controller: React.RefObject<ControllerImplementation>;
  events: Required<DocViewerEvents>;
  page: number | undefined;
  defaultPage: number | undefined;
  zoom: DocViewerZoom | undefined;
  defaultZoom: DocViewerZoom;
  withFullscreen: boolean;
  fullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
}

const [DocViewerFullProvider, useDocViewerContext] = createSafeContext<DocViewerContextValue>(
  'DocViewer.Root component was not found in the tree'
);
export { useDocViewerContext };

/**
 * What pages, thumbnails and page tiles read. These rarely change, unlike the rest of the context
 * (the controlled page, zoom, fullscreen, the toolbar's tap toggle), so a memoised page only
 * renders again when its own props change
 */
export type DocViewerPageContextValue = Pick<DocViewerContextValue, 'getStyles' | 'labels'>;

const [DocViewerPageProvider, useDocViewerPageContext] =
  createSafeContext<DocViewerPageContextValue>(
    'DocViewer.Root component was not found in the tree'
  );
export { useDocViewerPageContext };

/** Provides the context, and the part of it pages read as a context of its own */
export function DocViewerProvider({
  value,
  children,
}: {
  value: DocViewerContextValue;
  children: React.ReactNode;
}) {
  const { getStyles, labels } = value;
  const pageValue = useShallowStable({ getStyles, labels });
  return createElement(
    DocViewerFullProvider,
    { value },
    createElement(DocViewerPageProvider, { value: pageValue }, children)
  );
}

/** Name of the document for the toolbar title and the scroll area's screen reader name */
export function useDocumentTitle() {
  const { fileName, labels } = useDocViewerContext();
  return fileName ?? labels.documentLabel;
}

/** Whether a toolbar control is shown: hidden only when `toolbarControls` sets it to false */
export function useShowControl() {
  const { toolbarControls } = useDocViewerContext();
  return (control: DocViewerControl) => toolbarControls?.[control] !== false;
}
