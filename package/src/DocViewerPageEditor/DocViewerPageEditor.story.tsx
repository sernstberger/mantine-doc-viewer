import { Button, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import {
  closePageEditor,
  createPageEditorExtension,
  DocViewerPageEditorButton,
  openPageEditor,
} from '../editor';
import { DocViewer, useDocViewer } from '../index';

export default { title: 'DocViewerPageEditor' };

function useSaved() {
  const [saved, setSaved] = useState('Nothing saved yet');
  const extension = createPageEditorExtension({
    onDocumentChange: (bytes, { reason, pages }) =>
      setSaved(`${reason}: ${bytes.length} bytes, pages ${pages.join(', ')}`),
    onExtract: (bytes, { pages }) =>
      setSaved(`extract: ${bytes.length} bytes, pages ${pages.join(', ')}`),
  });

  return { saved, extension };
}

export function Usage() {
  const { saved, extension } = useSaved();

  return (
    <Stack p={40} gap="sm">
      <Text size="sm" data-testid="saved">
        {saved}
      </Text>
      <DocViewer src="/sample.pdf" extensions={[extension]} defaultThumbnailsOpened h={600} />
    </Stack>
  );
}

export function StoreApi() {
  const [store] = useDocViewer();

  return (
    <Stack p={40} gap="sm">
      <Group gap="xs">
        <Button size="xs" variant="default" onClick={() => openPageEditor(store)}>
          Open the page editor
        </Button>
        <Button size="xs" variant="default" onClick={() => closePageEditor(store)}>
          Close without saving
        </Button>
      </Group>
      <DocViewer
        src="/sample.pdf"
        store={store}
        extensions={[createPageEditorExtension()]}
        h={600}
      />
    </Stack>
  );
}

export function Composition() {
  const { saved, extension } = useSaved();

  return (
    <Stack p={40} gap="sm">
      <Text size="sm">{saved}</Text>
      <DocViewer.Root src="/sample.pdf" extensions={[extension]} defaultThumbnailsOpened h={600}>
        <DocViewer.Toolbar>
          <DocViewer.PageControls />
          <DocViewer.ZoomControls />
          <DocViewerPageEditorButton />
        </DocViewer.Toolbar>
        <DocViewer.Main>
          <DocViewer.Thumbnails />
          <DocViewer.Pages />
        </DocViewer.Main>
      </DocViewer.Root>
    </Stack>
  );
}
