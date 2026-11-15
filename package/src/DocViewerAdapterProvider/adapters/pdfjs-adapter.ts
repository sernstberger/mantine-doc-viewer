import type * as PdfJs from 'pdfjs-dist';

export type PdfJsModule = typeof PdfJs;

/** The pdf.js module as the viewer uses it, typed by its shape */
export interface DocViewerPdfEngine {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (...args: any[]) => unknown;
}

/** Options for pdf.js `getDocument`, see the pdf.js `DocumentInitParameters` */
export interface DocViewerPdfJsOptions {
  password?: string;
  withCredentials?: boolean;
  httpHeaders?: Record<string, string>;
  cMapUrl?: string;
  cMapPacked?: boolean;
  disableRange?: boolean;
  disableStream?: boolean;
  disableAutoFetch?: boolean;
  [option: string]: unknown;
}

export interface DocViewerPdfAdapter {
  /** Loads the engine; the adapter loads it once */
  load: () => Promise<DocViewerPdfEngine>;

  /** `getDocument` options for a document, read when it starts loading */
  getOptions?: (src: string) => DocViewerPdfJsOptions | undefined;
}

export interface CreatePdfJsAdapterOptions {
  /** Url of the pdf.js worker (`build/pdf.worker.min.mjs` of the pdf.js package), from the same pdf.js version as the module */
  workerSrc?: string;

  /** Options for `getDocument`, or a function that returns them for a document, for example per-document headers */
  options?: DocViewerPdfJsOptions | ((src: string) => DocViewerPdfJsOptions | undefined);
}

export class PdfWorkerNotConfiguredError extends Error {
  constructor() {
    super(
      '[mantine-doc-viewer] pdf.js worker is not configured. Pass `workerSrc` to createPdfJsAdapter, or set pdfjs.GlobalWorkerOptions.workerSrc yourself.'
    );
    this.name = 'PdfWorkerNotConfiguredError';
  }
}

/**
 * PDF engine for `DocViewerAdapterProvider`, with pdf.js loaded by the app through a dynamic
 * import of the pdf.js package. pdf.js is imported on first use, so an app that never opens a PDF
 * never downloads it
 */
export function createPdfJsAdapter(
  load: () => Promise<unknown>,
  { workerSrc, options }: CreatePdfJsAdapterOptions = {}
): DocViewerPdfAdapter {
  let module: Promise<PdfJsModule> | null = null;

  return {
    load: () => {
      module ??= (load() as Promise<PdfJsModule>).catch((error) => {
        module = null;
        throw error;
      });

      return module.then((pdfjs) => {
        if (workerSrc && pdfjs.GlobalWorkerOptions.workerSrc !== workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        }

        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          throw new PdfWorkerNotConfiguredError();
        }

        return pdfjs as unknown as DocViewerPdfEngine;
      });
    },
    getOptions: (src) => (typeof options === 'function' ? options(src) : options),
  };
}
