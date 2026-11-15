import {
  createPdfJsAdapter,
  type DocViewerPdfJsOptions,
} from '../package/src/DocViewerAdapterProvider/adapters/pdfjs-adapter';
import type { DocViewerMarkdownAdapter } from '../package/src/DocViewerAdapterProvider/adapters/react-markdown-adapter';
import { importMarkdown } from './import-markdown.mock';
import { importPdfJs } from './import-pdfjs.mock';

/** A pdf.js adapter over the pdfjs-dist test double, see test-utils/pdfjs-dist.mock.ts */
export function createTestPdfAdapter(
  workerSrc?: string,
  options?: DocViewerPdfJsOptions | ((src: string) => DocViewerPdfJsOptions | undefined)
) {
  return createPdfJsAdapter(importPdfJs, { workerSrc, options });
}

/** A markdown adapter with the react-markdown test double, see test-utils/import-markdown.mock.tsx */
export const testMarkdownAdapter: DocViewerMarkdownAdapter = {
  load: () => importMarkdown() as ReturnType<DocViewerMarkdownAdapter['load']>,
};
