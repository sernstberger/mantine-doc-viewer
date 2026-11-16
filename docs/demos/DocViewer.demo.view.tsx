import { Table } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import {
  DocViewer,
  useDocViewerContext,
  useDocViewerText,
  useDocViewerView,
} from 'mantine-doc-viewer';
import { useEffect } from 'react';
import { asset } from './_assets';

const code = `
import { Table } from '@mantine/core';
import {
  DocViewer,
  useDocViewerContext,
  useDocViewerText,
  useDocViewerView,
} from 'mantine-doc-viewer';

function parseCsv(text: string) {
  return text
    .trim()
    .split('\\n')
    .map((line) => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((cell) => cell.replace(/"/g, '')));
}

function CsvView() {
  const { src } = useDocViewerContext();
  const { onLoad, onError } = useDocViewerView();
  const state = useDocViewerText(src, 1_000_000);

  useEffect(() => {
    if (state.status === 'ready') {
      onLoad({ byteSize: state.size });
    }
    if (state.status === 'error') {
      onError(state.error);
    }
  }, [state, onLoad, onError]);

  if (state.status !== 'ready') {
    return <DocViewer.Message error={state.status === 'error'}>Cannot show this file</DocViewer.Message>;
  }

  const [head, ...body] = parseCsv(state.text);

  return (
    <DocViewer.Body>
      <Table data={{ head, body }} striped />
    </DocViewer.Body>
  );
}

function Demo() {
  return (
    <DocViewer.Root src="/sample.csv" h={340}>
      <DocViewer.Toolbar />
      <CsvView />
    </DocViewer.Root>
  );
}
`;

function parseCsv(text: string) {
  return text
    .trim()
    .split('\n')
    .map((line) =>
      line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((cell) => cell.replace(/"/g, ''))
    );
}

function CsvView() {
  const { src } = useDocViewerContext();
  const { onLoad, onError } = useDocViewerView();
  const state = useDocViewerText(src, 1_000_000);

  useEffect(() => {
    if (state.status === 'ready') {
      onLoad({ byteSize: state.size });
    }
    if (state.status === 'error') {
      onError(state.error);
    }
  }, [state, onLoad, onError]);

  if (state.status !== 'ready') {
    return (
      <DocViewer.Message error={state.status === 'error'}>Cannot show this file</DocViewer.Message>
    );
  }

  const [head, ...body] = parseCsv(state.text);

  return (
    <DocViewer.Body>
      <Table data={{ head, body }} striped />
    </DocViewer.Body>
  );
}

function Demo() {
  return (
    <DocViewer.Root src={asset('sample.csv')} h={340}>
      <DocViewer.Toolbar />
      <CsvView />
    </DocViewer.Root>
  );
}

export const view: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
