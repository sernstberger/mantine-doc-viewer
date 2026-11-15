import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import { useEffect, useRef, useState } from 'react';
import { loadPdfJs, PdfJsModule } from './load-pdfjs';
import {
  buildLoadParameters,
  DEFAULT_PDF_LOAD_OPTIONS,
  getPdfTitle,
  isIncorrectPassword,
  readFirstPageSize,
  toErrorState,
} from './pdf-document-load';

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

/** The loaded state (null while loading or failed), its document, and its page count */
export function getLoaded(state: PdfDocumentState) {
  const ready = state.status === 'ready' ? state : null;
  return { ready, document: ready?.document ?? null, numPages: ready?.document.numPages ?? 0 };
}

export type DocViewerPdfOptions = Omit<DocumentInitParameters, 'url' | 'data' | 'range'>;

export { DEFAULT_PDF_LOAD_OPTIONS };

/** Loads a PDF and the size of its first page, which is used as the placeholder size for every page */
export function usePdfDocument(
  src: string,
  workerSrc: string | undefined,
  options?: DocViewerPdfOptions,
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

        const task = pdfjs.getDocument(buildLoadParameters(optionsRef.current, src, data));
        destroy = () => task.destroy();

        // The size of the file is known once the first bytes arrive
        let total: number | undefined;
        task.onProgress = (progress: { total?: number }) => {
          total = progress.total;
        };

        task.onPassword = (updatePassword: (password: string) => void, reason: number) => {
          if (!cancelled) {
            setState({
              status: 'password',
              incorrect: isIncorrectPassword(reason),
              submit: (password) => {
                setState({ status: 'loading' });
                updatePassword(password);
              },
            });
          }
        };

        const document = await task.promise;
        const firstPageSize = await readFirstPageSize(document);
        const title = await getPdfTitle(document);

        if (!cancelled) {
          setState({
            status: 'ready',
            pdfjs,
            document,
            firstPageSize,
            byteSize: data?.byteLength ?? total,
            title,
          });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState(toErrorState(error));
        }
      });

    return () => {
      cancelled = true;
      destroy?.().catch(() => {});
    };
  }, [src, workerSrc, data]);

  return state;
}

/** Logs why the worker failed, as that is a setup mistake for the developer, not the reader */
export function useLogWorkerError(state: PdfDocumentState) {
  useEffect(() => {
    if (state.status === 'error' && state.reason === 'worker') {
      // eslint-disable-next-line no-console
      console.error(state.error.message);
    }
  }, [state]);
}
