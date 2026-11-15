import { Button, Group, Stack, Text } from '@mantine/core';
import React, { useState } from 'react';
import { DocViewer, useDocViewer } from '../index';
import {
  createMarkupExtension,
  DocViewerMarkupBar,
  DocViewerMarkupButton,
  saveMarkup,
  setMarkupTool,
  type DocViewerMark,
} from '../markup';

export default { title: 'DocViewerMarkup' };

export function Usage() {
  const [marks, setMarks] = useState<DocViewerMark[]>([]);

  return (
    <Stack p={40} gap="sm">
      <Text size="sm">
        {marks.length} {marks.length === 1 ? 'mark' : 'marks'}
      </Text>
      <DocViewer
        src="/sample.pdf"
        extensions={[createMarkupExtension({ onChange: setMarks })]}
        h={600}
      />
    </Stack>
  );
}

export function StoreApi() {
  const [store] = useDocViewer();
  const [saved, setSaved] = useState('Nothing saved yet');

  return (
    <Stack p={40} gap="sm">
      <Group gap="xs">
        <Button size="xs" variant="default" onClick={() => setMarkupTool('highlight', store)}>
          Highlight
        </Button>
        <Button size="xs" variant="default" onClick={() => setMarkupTool(null, store)}>
          Put the tool down
        </Button>
        <Button size="xs" variant="default" onClick={() => saveMarkup(store)}>
          Save
        </Button>
        <Text size="sm">{saved}</Text>
      </Group>
      <DocViewer
        src="/sample.pdf"
        store={store}
        extensions={[
          createMarkupExtension({
            onDocumentChange: (bytes, { pages }) =>
              setSaved(`${bytes.length} bytes, marks on pages ${pages.join(', ')}`),
          }),
        ]}
        h={600}
      />
    </Stack>
  );
}

export function Composition() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer.Root
        src="/sample.pdf"
        extensions={[createMarkupExtension({ tools: ['highlight', 'text', 'rectangle'] })]}
        h={600}
      >
        <DocViewer.Toolbar>
          <DocViewer.Title />
          <DocViewer.PageControls />
          <DocViewer.ZoomControls />
          <DocViewerMarkupButton />
        </DocViewer.Toolbar>
        <DocViewerMarkupBar />
        <DocViewer.Main>
          <DocViewer.Pages />
        </DocViewer.Main>
      </DocViewer.Root>
    </div>
  );
}
