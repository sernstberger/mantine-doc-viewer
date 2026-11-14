import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useState } from 'react';
import { loadPdfJs, PdfJsModule, PdfWorkerNotConfiguredError } from './load-pdfjs';

export interface PdfPageSize {
  width: number;
  height: number;
}

export type PdfDocumentState =
  | { status: 'loading' }
  | { status: 'error'; error: Error; reason: 'worker' | 'load' }
  | { status: 'ready'; pdfjs: PdfJsModule; document: PDFDocumentProxy; firstPageSize: PdfPageSize };

/** Loads a PDF and the size of its first page, which is used as the placeholder size for every page */
export function usePdfDocument(src: string, workerSrc: string | undefined): PdfDocumentState {
  const [state, setState] = useState<PdfDocumentState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => Promise<void>) | undefined;
    setState({ status: 'loading' });

    loadPdfJs(workerSrc)
      .then(async (pdfjs) => {
        if (cancelled) {
          return;
        }

        const task = pdfjs.getDocument({ url: src });
        destroy = () => task.destroy();
        const document = await task.promise;
        const firstPage = await document.getPage(1);
        const { width, height } = firstPage.getViewport({ scale: 1 });

        if (!cancelled) {
          setState({ status: 'ready', pdfjs, document, firstPageSize: { width, height } });
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
  }, [src, workerSrc]);

  return state;
}
