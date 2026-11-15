import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import React from 'react';
import { asset } from './_assets';

const code = `
import { DocViewer } from 'mantine-doc-viewer';

function Demo() {
  return (
    <DocViewer
      src="/sample.pdf"
      defaultThumbnailsOpened
      defaultThumbnailsPosition="right"
      defaultPageLayout="two-page-cover"
      pagesProps={{ gap: 'xl', withScrollSnap: true }}
      thumbnailsProps={{ width: 96 }}
      h={500}
    />
  );
}
`;

function Demo() {
  return (
    <DocViewer
      src={asset('sample.pdf')}
      defaultThumbnailsOpened
      defaultThumbnailsPosition="right"
      defaultPageLayout="two-page-cover"
      pagesProps={{ gap: 'xl', withScrollSnap: true }}
      thumbnailsProps={{ width: 96 }}
      h={500}
    />
  );
}

export const pages: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
