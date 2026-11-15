import { SegmentedControl, Stack } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import React, { useState } from 'react';
import { asset } from './_assets';

const code = `
import { useState } from 'react';
import { SegmentedControl, Stack } from '@mantine/core';
import { DocViewer } from 'mantine-doc-viewer';

const files = [
  { label: 'PDF', value: '/sample.pdf' },
  { label: 'Image', value: '/sample-image.svg' },
  { label: 'Markdown', value: '/sample.md' },
  { label: 'JSON', value: '/sample.json' },
  { label: 'Code', value: '/sample.ts' },
  { label: 'Text', value: '/sample.csv' },
];

function Demo() {
  const [src, setSrc] = useState(files[0].value);

  return (
    <Stack>
      <SegmentedControl data={files} value={src} onChange={setSrc} />
      <DocViewer src={src} h={420} />
    </Stack>
  );
}
`;

const files = [
  { label: 'PDF', value: 'sample.pdf' },
  { label: 'Image', value: 'sample-image.svg' },
  { label: 'Markdown', value: 'sample.md' },
  { label: 'JSON', value: 'sample.json' },
  { label: 'Code', value: 'sample.ts' },
  { label: 'Text', value: 'sample.csv' },
];

function Demo() {
  const [file, setFile] = useState(files[0].value);

  return (
    <Stack>
      <SegmentedControl data={files} value={file} onChange={setFile} />
      <DocViewer src={asset(file)} h={420} />
    </Stack>
  );
}

export const types: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
