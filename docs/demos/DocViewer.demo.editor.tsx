import { Stack, Text } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import { createPageEditorExtension } from 'mantine-doc-viewer/editor';
import React, { useState } from 'react';
import { asset } from './_assets';

const code = `
import { useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { DocViewer } from 'mantine-doc-viewer';
import { createPageEditorExtension } from 'mantine-doc-viewer/editor';

function Demo() {
  const [message, setMessage] = useState('Edit pages, then press Save');
  const [extensions] = useState(() => [
    createPageEditorExtension({
      onDocumentChange: (bytes, { reason, pages }) =>
        setMessage(\`\${reason}: \${bytes.byteLength} bytes, \${pages.length} pages\`),
    }),
  ]);

  return (
    <Stack>
      <Text size="sm">{message}</Text>
      <DocViewer src="/sample.pdf" extensions={extensions} defaultThumbnailsOpened h={440} />
    </Stack>
  );
}
`;

function Demo() {
  const [message, setMessage] = useState('Edit pages, then press Save');
  const [extensions] = useState(() => [
    createPageEditorExtension({
      onDocumentChange: (bytes, { reason, pages }) =>
        setMessage(`${reason}: ${bytes.byteLength} bytes, ${pages.length} pages`),
    }),
  ]);

  return (
    <Stack>
      <Text size="sm">{message}</Text>
      <DocViewer
        src={asset('sample.pdf')}
        extensions={extensions}
        defaultThumbnailsOpened
        h={440}
      />
    </Stack>
  );
}

export const editor: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
