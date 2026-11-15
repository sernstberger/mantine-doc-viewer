import type * as PdfJs from 'pdfjs-dist';
import { importPdfJs } from './import-pdfjs';

export type PdfJsModule = typeof PdfJs;

let pdfjsPromise: Promise<PdfJsModule> | null = null;

/**
 * Loads pdf.js on first use so that apps that never open a PDF never download it.
 * The worker must come from the same pdf.js version as the main module,
 * so `workerSrc` is set by the app and only applied when it has not been set yet.
 */
export function loadPdfJs(workerSrc: string | undefined): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = importPdfJs().catch((error) => {
      pdfjsPromise = null;
      throw error;
    });
  }

  return pdfjsPromise.then((pdfjs) => {
    if (workerSrc && pdfjs.GlobalWorkerOptions.workerSrc !== workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    }

    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      throw new PdfWorkerNotConfiguredError();
    }

    return pdfjs;
  });
}

export class PdfWorkerNotConfiguredError extends Error {
  constructor() {
    super(
      '[mantine-doc-viewer] pdf.js worker is not configured. Set the `pdfWorkerSrc` prop on DocViewer, or set it once for the whole app with theme default props.'
    );
    this.name = 'PdfWorkerNotConfiguredError';
  }
}
