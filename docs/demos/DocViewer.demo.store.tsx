import { Button, Group, Stack, Text } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { DocViewer, useDocViewer, useDocViewerStore } from 'mantine-doc-viewer';
import { asset } from './_assets';

const code = `
import { Button, Group, Stack, Text } from '@mantine/core';
import { DocViewer, useDocViewer, useDocViewerStore } from 'mantine-doc-viewer';

function Demo() {
  const [store, viewer] = useDocViewer();
  const { status, page, numPages } = useDocViewerStore(store);

  return (
    <Stack>
      <Group>
        <Button variant="default" onClick={() => viewer.previousSpread()}>
          Previous
        </Button>
        <Button variant="default" onClick={() => viewer.nextSpread()}>
          Next
        </Button>
        <Button variant="default" onClick={() => viewer.goToPage(numPages)}>
          Last page
        </Button>
        <Button variant="default" onClick={() => viewer.rotate()}>
          Rotate
        </Button>
        <Text size="sm">
          {status === 'ready' ? \`Page \${page} of \${numPages}\` : status}
        </Text>
      </Group>

      <DocViewer src="/sample.pdf" store={store} h={440} />
    </Stack>
  );
}
`;

function Demo() {
  const [store, viewer] = useDocViewer();
  const { status, page, numPages } = useDocViewerStore(store);

  return (
    <Stack>
      <Group>
        <Button variant="default" onClick={() => viewer.previousSpread()}>
          Previous
        </Button>
        <Button variant="default" onClick={() => viewer.nextSpread()}>
          Next
        </Button>
        <Button variant="default" onClick={() => viewer.goToPage(numPages)}>
          Last page
        </Button>
        <Button variant="default" onClick={() => viewer.rotate()}>
          Rotate
        </Button>
        <Text size="sm">{status === 'ready' ? `Page ${page} of ${numPages}` : status}</Text>
      </Group>

      <DocViewer src={asset('sample.pdf')} store={store} h={440} />
    </Stack>
  );
}

export const store: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
