import React from 'react';
import { createTestPdfAdapter, testMarkdownAdapter } from './adapters';
import { DocViewer } from '../package/src/DocViewer';
import { DocViewerAdapterProvider } from '../package/src/DocViewerAdapterProvider/DocViewerAdapterProvider';
import type { DocViewerPdfAdapter } from '../package/src/DocViewerAdapterProvider/adapters/pdfjs-adapter';
import type { DocViewerProps } from '../package/src/DocViewerBase';

export const TEST_VIEWER_PDF_ADAPTER = createTestPdfAdapter('/worker.mjs');

export interface TestDocViewerProps extends DocViewerProps {
  /** Replaces the pdf.js test double, for options, failures or a worker that never loads */
  pdfAdapter?: DocViewerPdfAdapter;
}

/** The public `DocViewer` inside an adapter provider holding the pdf.js and react-markdown test doubles */
export function TestDocViewer({ pdfAdapter = TEST_VIEWER_PDF_ADAPTER, ...props }: TestDocViewerProps) {
  return (
    <DocViewerAdapterProvider pdf={pdfAdapter} markdown={testMarkdownAdapter}>
      <DocViewer {...props} />
    </DocViewerAdapterProvider>
  );
}
