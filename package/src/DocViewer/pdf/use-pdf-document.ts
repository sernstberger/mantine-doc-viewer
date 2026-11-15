import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import { useEffect, useRef, useState } from 'react';
import { loadPdfJs, PdfJsModule, PdfWorkerNotConfiguredError } from './load-pdfjs';

export interface PdfPageSize {
  width: number;
  height: number;
}

export type PdfDocumentState =
  | { status: 'loading' }
  | { status: 'password'; incorrect: boolean; submit: (password: string) => void }
  | { status: 'error'; error: Error; reason: 'worker' | 'load' }
  | {
      status: 'ready';
      pdfjs: PdfJsModule;
      document: PDFDocumentProxy;
      firstPageSize: PdfPageSize;

      /** Size of the file in bytes, when known */
      byteSize: number | undefined;

      /** Title from the document information */
      title: string | undefined;
    };

export type PdfLoadOptions = Omit<DocumentInitParameters, 'url' | 'data' | 'range'>;

/**
 * Only the parts of the file needed for the pages on screen are downloaded, when the server
 * supports range requests. pdf.js otherwise keeps fetching the whole file in the background.
 * Searching still reads every page
 */
export const DEFAULT_PDF_LOAD_OPTIONS: PdfLoadOptions = {
  disableAutoFetch: true,
  // pdf.js only stops pre-fetching when streaming is off too
  disableStream: true,
};

/** Title from the document information, undefined when there is none or it cannot be read */
async function getPdfTitle(document: PDFDocumentProxy) {
  try {
    const { info } = await document.getMetadata();
    const title = (info as Record<string, unknown>).Title;
    return typeof title === 'string' && title.trim() ? title.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** Loads a PDF and the size of its first page, which is used as the placeholder size for every page */
export function usePdfDocument(
  src: string,
  workerSrc: string | undefined,
  options?: PdfLoadOptions,
  /** Bytes to open instead of `src`, such as a document with edited pages */
  data?: Uint8Array | null
): PdfDocumentState {
  const [state, setState] = useState<PdfDocumentState>({ status: 'loading' });

  // Read when a document starts loading, so a new options object every render does not reload it
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => Promise<void>) | undefined;
    setState({ status: 'loading' });

    loadPdfJs(workerSrc)
      .then(async (pdfjs) => {
        if (cancelled) {
          return;
        }

        const task = pdfjs.getDocument({
          ...DEFAULT_PDF_LOAD_OPTIONS,
          ...optionsRef.current,
          // pdf.js takes ownership of the buffer it is given, so it gets a copy
          ...(data ? { data: data.slice() } : { url: src }),
        });
        destroy = () => task.destroy();

        // The size of the file is known once the first bytes arrive
        let total: number | undefined;
        task.onProgress = (progress: { total?: number }) => {
          total = progress.total;
        };

        // pdf.js asks again with reason 2 when the password was wrong
        task.onPassword = (updatePassword: (password: string) => void, reason: number) => {
          if (!cancelled) {
            setState({
              status: 'password',
              incorrect: reason === 2,
              submit: (password) => {
                setState({ status: 'loading' });
                updatePassword(password);
              },
            });
          }
        };

        const document = await task.promise;
        const firstPage = await document.getPage(1);
        const { width, height } = firstPage.getViewport({ scale: 1 });
        const title = await getPdfTitle(document);

        if (!cancelled) {
          setState({
            status: 'ready',
            pdfjs,
            document,
            firstPageSize: { width, height },
            byteSize: data?.byteLength ?? total,
            title,
          });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          const reason = error instanceof PdfWorkerNotConfiguredError ? 'worker' : 'load';
          setState({ status: 'error', error, reason });
        }
      });

    return () => {
      cancelled = true;
      destroy?.().catch(() => {});
    };
  }, [src, workerSrc, data]);

  return state;
}
