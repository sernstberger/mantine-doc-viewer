import { SegmentedControl, Stack, Text } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { DocViewer, DocViewerPageLayout, DocViewerZoom } from 'mantine-doc-viewer';
import React, { useState } from 'react';
import { asset } from './_assets';

const code = `
import { useState } from 'react';
import { SegmentedControl, Stack, Text } from '@mantine/core';
import { DocViewer, DocViewerPageLayout, DocViewerZoom } from 'mantine-doc-viewer';

function parseZoom(value: string): DocViewerZoom {
  return Number.isNaN(Number(value)) ? (value as DocViewerZoom) : Number(value);
}

function Demo() {
  const [zoom, setZoom] = useState<DocViewerZoom>('fit');
  const [scale, setScale] = useState(1);
  const [layout, setLayout] = useState<DocViewerPageLayout>('single');

  return (
    <Stack>
      <SegmentedControl
        value={String(zoom)}
        onChange={(value) => setZoom(parseZoom(value))}
        data={[
          { label: 'Fit width', value: 'fit' },
          { label: 'Fit page', value: 'fit-page' },
          { label: '100%', value: '1' },
          { label: '200%', value: '2' },
        ]}
      />
      <SegmentedControl
        value={layout}
        onChange={(value) => setLayout(value as DocViewerPageLayout)}
        data={['single', 'two-page', 'two-page-cover', 'horizontal', 'wrapped']}
      />
      <Text size="sm">Scale: {Math.round(scale * 100)}%</Text>

      <DocViewer
        src="/sample.pdf"
        zoom={zoom}
        onZoomChange={(value, details) => {
          setZoom(value);
          setScale(details.scale);
        }}
        pageLayout={layout}
        onPageLayoutChange={setLayout}
        h={440}
      />
    </Stack>
  );
}
`;

function parseZoom(value: string): DocViewerZoom {
  return Number.isNaN(Number(value)) ? (value as DocViewerZoom) : Number(value);
}

function Demo() {
  const [zoom, setZoom] = useState<DocViewerZoom>('fit');
  const [scale, setScale] = useState(1);
  const [layout, setLayout] = useState<DocViewerPageLayout>('single');

  return (
    <Stack>
      <SegmentedControl
        value={String(zoom)}
        onChange={(value) => setZoom(parseZoom(value))}
        data={[
          { label: 'Fit width', value: 'fit' },
          { label: 'Fit page', value: 'fit-page' },
          { label: '100%', value: '1' },
          { label: '200%', value: '2' },
        ]}
      />
      <SegmentedControl
        value={layout}
        onChange={(value) => setLayout(value as DocViewerPageLayout)}
        data={['single', 'two-page', 'two-page-cover', 'horizontal', 'wrapped']}
      />
      <Text size="sm">Scale: {Math.round(scale * 100)}%</Text>

      <DocViewer
        src={asset('sample.pdf')}
        zoom={zoom}
        onZoomChange={(value, details) => {
          setZoom(value);
          setScale(details.scale);
        }}
        pageLayout={layout}
        onPageLayoutChange={setLayout}
        h={440}
      />
    </Stack>
  );
}

export const zoom: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
