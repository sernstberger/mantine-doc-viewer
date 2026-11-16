import { Button, Group, Stack, Text } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import { createMarkupExtension, type DocViewerMark } from 'mantine-doc-viewer/markup';
import { useState } from 'react';
import { asset } from './_assets';

const code = `
import { useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { DocViewer } from 'mantine-doc-viewer';
import { createMarkupExtension, type DocViewerMark } from 'mantine-doc-viewer/markup';

function Demo() {
  const [marks, setMarks] = useState<DocViewerMark[]>([]);
  const markup = createMarkupExtension({
    tools: ['highlight', 'pen', 'text', 'cloud'],
    color: 'red',
    value: marks,
    onChange: setMarks,
  });

  return (
    <Stack>
      <Group>
        <Text size="sm">{marks.length} marks. Pick a tool in the markup bar and draw on the page.</Text>
        <Button size="xs" variant="default" disabled={marks.length === 0} onClick={() => setMarks([])}>
          Clear
        </Button>
      </Group>
      <DocViewer src="/sample.pdf" extensions={[markup]} h={440} />
    </Stack>
  );
}
`;

function Demo() {
  const [marks, setMarks] = useState<DocViewerMark[]>([]);
  const markup = createMarkupExtension({
    tools: ['highlight', 'pen', 'text', 'cloud'],
    color: 'red',
    value: marks,
    onChange: setMarks,
  });

  return (
    <Stack>
      <Group>
        <Text size="sm">
          {marks.length} marks. Pick a tool in the markup bar and draw on the page.
        </Text>
        <Button
          size="xs"
          variant="default"
          disabled={marks.length === 0}
          onClick={() => setMarks([])}
        >
          Clear
        </Button>
      </Group>
      <DocViewer src={asset('sample.pdf')} extensions={[markup]} h={440} />
    </Stack>
  );
}

export const markup: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
