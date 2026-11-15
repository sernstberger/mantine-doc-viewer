import { Button, Group, Stack } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { DocViewer, useDocViewer } from 'mantine-doc-viewer';
import React from 'react';
import { asset } from './_assets';

const code = `
import { Button, Group, Stack } from '@mantine/core';
import { DocViewer, useDocViewer } from 'mantine-doc-viewer';

function Demo() {
  const [store, viewer] = useDocViewer();

  return (
    <Stack>
      <Group>
        <Button variant="default" onClick={() => viewer.openSearch('page 2')}>
          Search for "page 2"
        </Button>
        <Button variant="default" onClick={() => viewer.highlight({ text: 'Line 3', page: 3 })}>
          Highlight a line on page 3
        </Button>
        <Button variant="default" onClick={() => viewer.clearHighlight()}>
          Clear highlight
        </Button>
      </Group>

      <DocViewer.Root src="/sample.pdf" store={store} h={460}>
        <DocViewer.Toolbar>
          <DocViewer.OutlineButton />
          <DocViewer.InfoButton />
          <DocViewer.SearchButton />
        </DocViewer.Toolbar>
        <DocViewer.Search inputProps={{ placeholder: 'Find in document' }} />
        <DocViewer.Main />
      </DocViewer.Root>
    </Stack>
  );
}
`;

function Demo() {
  const [store, viewer] = useDocViewer();

  return (
    <Stack>
      <Group>
        <Button variant="default" onClick={() => viewer.openSearch('page 2')}>
          Search for "page 2"
        </Button>
        <Button variant="default" onClick={() => viewer.highlight({ text: 'Line 3', page: 3 })}>
          Highlight a line on page 3
        </Button>
        <Button variant="default" onClick={() => viewer.clearHighlight()}>
          Clear highlight
        </Button>
      </Group>

      <DocViewer.Root src={asset('sample.pdf')} store={store} h={460}>
        <DocViewer.Toolbar>
          <DocViewer.OutlineButton />
          <DocViewer.InfoButton />
          <DocViewer.SearchButton />
        </DocViewer.Toolbar>
        <DocViewer.Search inputProps={{ placeholder: 'Find in document' }} />
        <DocViewer.Main />
      </DocViewer.Root>
    </Stack>
  );
}

export const search: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
