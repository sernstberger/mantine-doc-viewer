import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import React from 'react';

const code = `
import { DocViewer } from 'mantine-doc-viewer';

function Demo() {
  return <DocViewer src="/sample-image.svg" h={400} />;
}
`;

const basePath = process.env.NODE_ENV === 'production' ? '/mantine-doc-viewer' : '';

function Demo() {
  return <DocViewer src={`${basePath}/sample-image.svg`} h={400} />;
}

export const usage: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
