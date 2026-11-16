import { ActionIcon, Table } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import {
  DocViewer,
  useDocViewerContext,
  useDocViewerText,
  useDocViewerView,
} from 'mantine-doc-viewer';
import { useEffect, useState } from 'react';
import { asset } from './_assets';

const code = `
import { useEffect, useState } from 'react';
import { ActionIcon, Table } from '@mantine/core';
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

function CsvView({ totals }: { totals: boolean }) {
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
  const foot = head.map((_, column) => {
    const values = body.map((row) => Number(row[column]));
    return column === 0 ? 'Total' : values.some(Number.isNaN) ? '' : String(values.reduce((a, b) => a + b));
  });

  return (
    <DocViewer.Body>
      <Table data={{ head, body, foot: totals ? foot : undefined }} striped />
    </DocViewer.Body>
  );
}

function SummaryButton({ onClick, pressed }: { onClick: () => void; pressed: boolean }) {
  const { getControlProps } = useDocViewerContext();

  return (
    <ActionIcon {...getControlProps(pressed)} aria-label="Totals" aria-pressed={pressed} onClick={onClick}>
      Σ
    </ActionIcon>
  );
}

function Demo() {
  const [totals, setTotals] = useState(false);

  return (
    <DocViewer.Root src="/sample.csv" h={340}>
      <DocViewer.Toolbar>
        <SummaryButton pressed={totals} onClick={() => setTotals((value) => !value)} />
      </DocViewer.Toolbar>
      <CsvView totals={totals} />
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

function CsvView({ totals }: { totals: boolean }) {
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
  const foot = head.map((_, column) => {
    const values = body.map((row) => Number(row[column]));
    return column === 0
      ? 'Total'
      : values.some(Number.isNaN)
        ? ''
        : String(values.reduce((a, b) => a + b));
  });

  return (
    <DocViewer.Body>
      <Table data={{ head, body, foot: totals ? foot : undefined }} striped />
    </DocViewer.Body>
  );
}

function SummaryButton({ onClick, pressed }: { onClick: () => void; pressed: boolean }) {
  const { getControlProps } = useDocViewerContext();

  return (
    <ActionIcon
      {...getControlProps(pressed)}
      aria-label="Totals"
      aria-pressed={pressed}
      onClick={onClick}
    >
      Σ
    </ActionIcon>
  );
}

function Demo() {
  const [totals, setTotals] = useState(false);

  return (
    <DocViewer.Root src={asset('sample.csv')} h={340}>
      <DocViewer.Toolbar>
        <SummaryButton pressed={totals} onClick={() => setTotals((value) => !value)} />
      </DocViewer.Toolbar>
      <CsvView totals={totals} />
    </DocViewer.Root>
  );
}

export const view: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
