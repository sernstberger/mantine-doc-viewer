import { SegmentedControl, Stack } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import {
  createPdfJsAdapter,
  createReactMarkdownAdapter,
  DocViewer,
  DocViewerAdapterProvider,
} from 'mantine-doc-viewer';
import React, { useState } from 'react';
import { asset } from './_assets';

const code = `
import { useState } from 'react';
import { SegmentedControl, Stack } from '@mantine/core';
import {
  createPdfJsAdapter,
  createReactMarkdownAdapter,
  DocViewer,
  DocViewerAdapterProvider,
} from 'mantine-doc-viewer';

const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
const pdf = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc });
const markdown = createReactMarkdownAdapter(() =>
  Promise.all([import('react-markdown'), import('remark-gfm')])
);

function Demo() {
  const [engine, setEngine] = useState('markdown');

  return (
    <Stack>
      <SegmentedControl
        value={engine}
        onChange={setEngine}
        data={[
          { label: 'With the markdown adapter', value: 'markdown' },
          { label: 'Without it', value: 'none' },
        ]}
      />
      <DocViewerAdapterProvider pdf={pdf} markdown={engine === 'markdown' ? markdown : undefined}>
        <DocViewer src="/sample.md" h={400} />
      </DocViewerAdapterProvider>
    </Stack>
  );
}
`;

const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
const pdf = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc });
const markdown = createReactMarkdownAdapter(() =>
  Promise.all([import('react-markdown'), import('remark-gfm')])
);

function Demo() {
  const [engine, setEngine] = useState('markdown');

  return (
    <Stack>
      <SegmentedControl
        value={engine}
        onChange={setEngine}
        data={[
          { label: 'With the markdown adapter', value: 'markdown' },
          { label: 'Without it', value: 'none' },
        ]}
      />
      <DocViewerAdapterProvider pdf={pdf} markdown={engine === 'markdown' ? markdown : undefined}>
        <DocViewer src={asset('sample.md')} h={400} />
      </DocViewerAdapterProvider>
    </Stack>
  );
}

export const adapters: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
