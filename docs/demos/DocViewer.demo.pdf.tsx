import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import React from 'react';

const code = `
import { DocViewer } from 'mantine-doc-viewer';

const pdfWorkerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

function Demo() {
  return <DocViewer src="/sample.pdf" pdfWorkerSrc={pdfWorkerSrc} h={600} />;
}
`;

const pdfWorkerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
const basePath = process.env.NODE_ENV === 'production' ? '/mantine-doc-viewer' : '';

function Demo() {
  return <DocViewer src={`${basePath}/sample.pdf`} pdfWorkerSrc={pdfWorkerSrc} h={600} />;
}

export const pdf: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
