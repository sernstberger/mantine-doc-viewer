import type { DocViewerPdfJsOptions } from '../package/src/DocViewerAdapterProvider/adapters/pdfjs-adapter';
import { createTestPdfAdapter, testMarkdownAdapter } from './adapters';

/** The test doubles of pdf.js and react-markdown for the legacy helper, mapped in jest.config.cjs */
export function createLegacyPdfAdapter(
  workerSrc: string | undefined,
  options: (src: string) => DocViewerPdfJsOptions | undefined
) {
  return createTestPdfAdapter(workerSrc, options);
}

export const legacyMarkdownAdapter = testMarkdownAdapter;
