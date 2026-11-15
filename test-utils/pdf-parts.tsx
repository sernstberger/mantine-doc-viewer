import { act, waitFor } from '@testing-library/react';
import React, { useMemo } from 'react';
import { createTestPdfAdapter } from './adapters';
import { getDocument, mockPdf } from './mock-pdf';
import type { DocViewerPdfAdapter } from '../package/src/DocViewerAdapterProvider/adapters/pdfjs-adapter';
import { DocViewerAdapterProvider } from '../package/src/DocViewerAdapterProvider/DocViewerAdapterProvider';
import { DocViewerRoot, type DocViewerRootProps } from '../package/src/DocViewerRoot/DocViewerRoot';
import { PdfSessionContext, usePdfSession } from '../package/src/DocViewerRoot/pdf-session-context';
import { getLoaded, type PdfDocumentState } from '../package/src/hooks/pdf/use-pdf-document';

/** An adapter whose engine never loads: the session stays loading and nothing updates after a test ends */
export const PENDING_PDF_ADAPTER: DocViewerPdfAdapter = { load: () => new Promise(() => {}) };

export const TEST_PDF_ADAPTER = createTestPdfAdapter('/worker.mjs');

export const PDF_ROOT_PROPS = { src: '/files/report.pdf', defaultZoom: 1 };

type PdfPartsRootProps = Partial<DocViewerRootProps> & {
  adapter?: DocViewerPdfAdapter;
  children?: React.ReactNode;
};

/** Root over a PDF inside the adapter provider, for rendering one part */
export function PdfPartsRoot({
  adapter = PENDING_PDF_ADAPTER,
  children,
  ...props
}: PdfPartsRootProps) {
  return (
    <DocViewerAdapterProvider pdf={adapter}>
      <DocViewerRoot {...PDF_ROOT_PROPS} {...props}>
        {children}
      </DocViewerRoot>
    </DocViewerAdapterProvider>
  );
}

/** Root over a PDF that loads through the pdf.js test double; wait for the pages before asserting */
export function LoadedPdfRoot({ children, ...props }: PdfPartsRootProps) {
  return (
    <PdfPartsRoot adapter={TEST_PDF_ADAPTER} {...props}>
      {children}
    </PdfPartsRoot>
  );
}

/** Waits until every page of a loaded PDF has its text layer, the sign that the document is shown */
export async function pagesLoaded(container: HTMLElement, numPages: number) {
  await waitFor(() => expect(container.querySelectorAll('.endOfContent')).toHaveLength(numPages));
  await act(async () => {});
}

type ReadyState = Extract<PdfDocumentState, { status: 'ready' }>;

/** Loads the fake pdf.js document once, as the state a loaded session holds. Its pages and attachments never load, so parts show placeholders and nothing updates later */
export async function loadReadyState(options?: Parameters<typeof mockPdf>[0]) {
  getDocument.mockReset();
  mockPdf(options);
  const pdfjs = (await TEST_PDF_ADAPTER.load()) as unknown as ReadyState['pdfjs'];
  const document = await (getDocument as unknown as (parameters: object) => any)({}).promise;
  document.getPage = () => new Promise(() => {});
  document.getAttachments = () => new Promise(() => {});
  const ready: ReadyState = {
    status: 'ready',
    pdfjs,
    document,
    firstPageSize: { width: 612, height: 792 },
    byteSize: undefined,
    title: undefined,
  };
  return ready;
}

function ReadySession({
  getReady,
  children,
}: {
  getReady: () => ReadyState;
  children: React.ReactNode;
}) {
  const session = usePdfSession()!;
  const ready = getReady();
  const value = useMemo(() => ({ ...session, loaded: getLoaded(ready) }), [session, ready]);
  return <PdfSessionContext value={value}>{children}</PdfSessionContext>;
}

/** Root whose PDF parts see a loaded document (from `loadReadyState`, called before the tests), for parts that render only after the load */
export function createReadyPdfRoot(getReady: () => ReadyState) {
  return function ReadyPdfRoot({ children, ...props }: PdfPartsRootProps) {
    return (
      <PdfPartsRoot {...props}>
        <ReadySession getReady={getReady}>{children}</ReadySession>
      </PdfPartsRoot>
    );
  };
}
