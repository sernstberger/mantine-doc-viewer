import { createSafeContext, GetStylesApi } from '@mantine/core';
import type { DocViewerFactory } from './DocViewer';

export interface DocViewerContextValue {
  getStyles: GetStylesApi<DocViewerFactory>;
  src: string;
  fileName: string | undefined;
  withToolbar: boolean | undefined;
  toolbarSection: React.ReactNode;
  pdfWorkerSrc: string | undefined;
  defaultThumbnailsOpened: boolean | undefined;
}

export const [DocViewerProvider, useDocViewerContext] = createSafeContext<DocViewerContextValue>(
  'DocViewer component was not found in the tree'
);
