import { createSafeContext, GetStylesApi } from '@mantine/core';
import type { DocViewerFactory, DocViewerThumbnailsPosition } from './DocViewer';
import type { DocViewerLabels } from './labels';

export interface DocViewerContextValue {
  getStyles: GetStylesApi<DocViewerFactory>;
  src: string;
  fileName: string | undefined;
  alt: string | undefined;
  labels: DocViewerLabels;
  withToolbar: boolean | undefined;
  toolbarSection: React.ReactNode;
  pdfWorkerSrc: string | undefined;
  defaultThumbnailsOpened: boolean | undefined;
  thumbnailsPosition: DocViewerThumbnailsPosition | undefined;
  defaultThumbnailsPosition: DocViewerThumbnailsPosition | undefined;
  onThumbnailsPositionChange: ((position: DocViewerThumbnailsPosition) => void) | undefined;
  maxTextSize: number;
  language: string | undefined;
}

export const [DocViewerProvider, useDocViewerContext] = createSafeContext<DocViewerContextValue>(
  'DocViewer component was not found in the tree'
);

/** Name of the document for the toolbar title and the scroll area's screen reader name */
export function useDocumentTitle() {
  const { fileName, labels } = useDocViewerContext();
  return fileName ?? labels.document;
}
