import { type DocViewerPdfJsOptions } from '../package/src/DocViewerAdapterProvider/adapters/pdfjs-adapter';
import type { DocViewerMarkdownAdapter } from '../package/src/DocViewerAdapterProvider/adapters/react-markdown-adapter';
/** A pdf.js adapter over the pdfjs-dist test double, see test-utils/pdfjs-dist.mock.ts */
export declare function createTestPdfAdapter(workerSrc?: string, options?: DocViewerPdfJsOptions | ((src: string) => DocViewerPdfJsOptions | undefined)): import("../package/src").DocViewerPdfAdapter;
/** A markdown adapter with the react-markdown test double, see test-utils/import-markdown.mock.tsx */
export declare const testMarkdownAdapter: DocViewerMarkdownAdapter;
