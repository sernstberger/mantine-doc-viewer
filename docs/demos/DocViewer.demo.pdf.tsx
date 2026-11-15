import { MantineDemo } from '@mantinex/demo';
import { createPdfJsAdapter, DocViewer, DocViewerAdapterProvider } from 'mantine-doc-viewer';
import React from 'react';

const code = `
import { createPdfJsAdapter, DocViewer, DocViewerAdapterProvider } from 'mantine-doc-viewer';

const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
const pdfAdapter = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc });

function Demo() {
  return (
    <DocViewerAdapterProvider pdf={pdfAdapter}>
      <DocViewer src="/sample.pdf" h={600} />
    </DocViewerAdapterProvider>
  );
}
`;

const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
const pdfAdapter = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc });
const basePath = process.env.NODE_ENV === 'production' ? '/mantine-doc-viewer' : '';

function Demo() {
  return (
    <DocViewerAdapterProvider pdf={pdfAdapter}>
      <DocViewer src={`${basePath}/sample.pdf`} h={600} />
    </DocViewerAdapterProvider>
  );
}

export const pdf: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
