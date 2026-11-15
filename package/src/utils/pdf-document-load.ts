import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import { PdfWorkerNotConfiguredError } from '../DocViewerAdapterProvider/adapters/pdfjs-adapter';

type LoadOptions = Omit<DocumentInitParameters, 'url' | 'data' | 'range'>;

/**
 * Only the parts of the file needed for the pages on screen are downloaded, when the server
 * supports range requests. pdf.js otherwise keeps fetching the whole file in the background.
 * Searching still reads every page
 */
export const DEFAULT_PDF_LOAD_OPTIONS: LoadOptions = {
  disableAutoFetch: true,
  // pdf.js only stops pre-fetching when streaming is off too
  disableStream: true,
};

/** The parameters for `getDocument`: the defaults, then the caller's options, then the source */
export function buildLoadParameters(
  options: LoadOptions | undefined,
  src: string,
  data: Uint8Array | null | undefined
): DocumentInitParameters {
  return {
    ...DEFAULT_PDF_LOAD_OPTIONS,
    ...options,
    // pdf.js takes ownership of the buffer it is given, so it gets a copy
    ...(data ? { data: data.slice() } : { url: src }),
  };
}

/** The error state for a failed load: a missing worker is a setup mistake, the rest a bad file */
export function toErrorState(error: Error) {
  const reason = error instanceof PdfWorkerNotConfiguredError ? 'worker' : 'load';
  return { status: 'error', error, reason } as const;
}

/** pdf.js asks again with reason 2 when the password was wrong */
export function isIncorrectPassword(reason: number) {
  return reason === 2;
}

/** Title from the document information, undefined when there is none or it cannot be read */
export async function getPdfTitle(document: PDFDocumentProxy) {
  try {
    const { info } = await document.getMetadata();
    const title = (info as Record<string, unknown>).Title;
    return typeof title === 'string' && title.trim() ? title.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** Size of the first page at scale 1, used as the placeholder size for every page */
export async function readFirstPageSize(document: PDFDocumentProxy) {
  const firstPage = await document.getPage(1);
  const { width, height } = firstPage.getViewport({ scale: 1 });
  return { width, height };
}
