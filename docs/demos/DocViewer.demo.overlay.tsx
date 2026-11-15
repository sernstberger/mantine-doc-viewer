import { Badge } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { DocViewer, DocViewerPageOverlayInfo } from 'mantine-doc-viewer';
import React from 'react';
import { asset } from './_assets';

const code = `
import { Badge } from '@mantine/core';
import { DocViewer, DocViewerPageOverlayInfo } from 'mantine-doc-viewer';

function renderPageOverlay({ pageNumber, scale }: DocViewerPageOverlayInfo) {
  return (
    <Badge
      color="red"
      style={{ position: 'absolute', top: 24 * scale, right: 24 * scale }}
    >
      Comment on page {pageNumber}
    </Badge>
  );
}

function Demo() {
  return (
    <DocViewer
      src="/sample.pdf"
      pagesProps={{ renderPageOverlay }}
      h={500}
    />
  );
}
`;

function renderPageOverlay({ pageNumber, scale }: DocViewerPageOverlayInfo) {
  return (
    <Badge color="red" style={{ position: 'absolute', top: 24 * scale, right: 24 * scale }}>
      Comment on page {pageNumber}
    </Badge>
  );
}

function Demo() {
  return <DocViewer src={asset('sample.pdf')} pagesProps={{ renderPageOverlay }} h={500} />;
}

export const overlay: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
