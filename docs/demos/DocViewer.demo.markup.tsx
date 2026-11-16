import { Stack, Text } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import { createMarkupExtension } from 'mantine-doc-viewer/markup';
import { useState } from 'react';
import { asset } from './_assets';

const code = `
import { Stack, Text } from '@mantine/core';
import { DocViewer } from 'mantine-doc-viewer';
import { createMarkupExtension } from 'mantine-doc-viewer/markup';

function Demo() {
  const [marks, setMarks] = useState(0);
  const [extensions] = useState(() => [
    createMarkupExtension({
      tools: ['highlight', 'pen', 'text', 'cloud'],
      color: 'red',
      onChange: (value) => setMarks(value.length),
    }),
  ]);

  return (
    <Stack>
      <Text size="sm">{marks} marks. Pick a tool in the markup bar and draw on the page.</Text>
      <DocViewer src="/sample.pdf" extensions={extensions} h={440} />
    </Stack>
  );
}
`;

function Demo() {
  const [marks, setMarks] = useState(0);
  const [extensions] = useState(() => [
    createMarkupExtension({
      tools: ['highlight', 'pen', 'text', 'cloud'],
      color: 'red',
      onChange: (value) => setMarks(value.length),
    }),
  ]);

  return (
    <Stack>
      <Text size="sm">{marks} marks. Pick a tool in the markup bar and draw on the page.</Text>
      <DocViewer src={asset('sample.pdf')} extensions={extensions} h={440} />
    </Stack>
  );
}

export const markup: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
