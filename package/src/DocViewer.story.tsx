import { Button, Group, Stack, Table, Text as MantineText } from '@mantine/core';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useState } from 'react';
import { createPageEditorExtension } from './editor';
import {
  createPdfJsAdapter,
  createReactMarkdownAdapter,
  DocViewer,
  DocViewerAdapterProvider,
  useDocViewer,
  useDocViewerContext,
  useDocViewerText,
} from './index';

const pdfAdapter = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc: pdfWorkerSrc });
const pdfAdapterWithoutWorker = createPdfJsAdapter(() => import('pdfjs-dist'));
const markdownAdapter = createReactMarkdownAdapter(() =>
  Promise.all([import('react-markdown'), import('remark-gfm')])
);

export default {
  title: 'DocViewer',
  decorators: [
    (Story: React.ComponentType) => (
      <DocViewerAdapterProvider pdf={pdfAdapter} markdown={markdownAdapter}>
        <Story />
      </DocViewerAdapterProvider>
    ),
  ],
};

export function Pdf() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.pdf" h={600} />
    </div>
  );
}

export function PdfWithThumbnails() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.pdf" defaultThumbnailsOpened h={600} />
    </div>
  );
}

export function PdfThumbnailsBottom() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer
        src="/sample.pdf"
        defaultThumbnailsOpened
        defaultThumbnailsPosition="bottom"
        h={600}
      />
    </div>
  );
}

function LongPdf({ pages }: { pages: number }) {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src={`/sample-${pages}.pdf`} defaultThumbnailsOpened h={700} />
    </div>
  );
}

export const Pdf50Pages = () => <LongPdf pages={50} />;
export const Pdf500Pages = () => <LongPdf pages={500} />;
export const Pdf1000Pages = () => <LongPdf pages={1000} />;

export function Styled() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer
        src="/sample.pdf"
        defaultThumbnailsOpened
        size="md"
        color="teal"
        radius="lg"
        pagesProps={{ gap: 'xl', matchColor: 'grape', activeMatchColor: 'red' }}
        thumbnailsProps={{ width: 80 }}
        toolbarProps={{ tooltipProps: { position: 'bottom', withArrow: true } }}
        h={600}
      />
    </div>
  );
}

export function PdfWithoutWorker() {
  return (
    <DocViewerAdapterProvider pdf={pdfAdapterWithoutWorker}>
      <div style={{ padding: 40 }}>
        <DocViewer src="/sample.pdf" h={300} />
      </div>
    </DocViewerAdapterProvider>
  );
}

// Logs a console error on purpose (a setup mistake for the developer): e2e/errors.spec.ts covers it
PdfWithoutWorker.parameters = { e2e: { allowConsole: [/pdf\.js worker is not configured/] } };

export function PdfLoadError() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/missing.pdf" h={300} />
    </div>
  );
}
PdfLoadError.parameters = { e2e: { allowConsole: [/404/, /Failed to load/] } };

export function Image() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample-image.svg" h={500} />
    </div>
  );
}

export function ImageSmall() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample-image.svg" w={360} h={280} />
    </div>
  );
}

export function ImageLoadError() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/missing.png" h={300} />
    </div>
  );
}
ImageLoadError.parameters = { e2e: { allowConsole: [/404/, /Failed to load/] } };

export function Markdown() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.md" h={600} />
    </div>
  );
}

export function Code() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.ts" h={500} />
    </div>
  );
}

export function Json() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.json" h={400} />
    </div>
  );
}

export function Text() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.log" h={300} />
    </div>
  );
}

export function TextTooLarge() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.log" textProps={{ maxSize: 100 }} h={300} />
    </div>
  );
}

export function Unsupported() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/files/archive.zip" h={300} />
    </div>
  );
}

export function Controlled() {
  const [store, viewer] = useDocViewer();
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState('');

  return (
    <Stack p={40} gap="sm">
      <Group gap="xs">
        <Button size="xs" variant="default" onClick={() => setPage(1)}>
          First page
        </Button>
        <Button size="xs" variant="default" onClick={() => setPage(50)}>
          Last page
        </Button>
        <Button size="xs" variant="default" onClick={() => viewer.setZoom(1)}>
          100%
        </Button>
        <Button size="xs" variant="default" onClick={() => viewer.openSearch('page 7')}>
          Search "page 7"
        </Button>
        <Button size="xs" variant="default" onClick={() => viewer.print()}>
          Print
        </Button>
        <MantineText size="sm">
          Page {page}, zoom {zoom}
        </MantineText>
      </Group>
      <DocViewer
        src="/sample-50.pdf"
        store={store}
        page={page}
        onPageChange={setPage}
        onZoomChange={(next, { scale }) =>
          setZoom(`${Math.round(scale * 100)}%${typeof next === 'number' ? '' : ` (${next})`}`)
        }
        h={600}
      />
    </Stack>
  );
}

export function TwoPages() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample-50.pdf" defaultPageLayout="two-page-cover" h={600} />
    </div>
  );
}

/** Splits CSV text into rows, with quoted fields */
function parseCsv(text: string) {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) =>
      line
        .match(/("([^"]|"")*"|[^,]*)(,|$)/g)!
        .slice(0, -1)
        .map((cell) => cell.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'))
    );
}

function CsvView() {
  const { src } = useDocViewerContext();
  const state = useDocViewerText(src, 2_000_000);

  return (
    <>
      <DocViewer.Toolbar />
      <DocViewer.Body focusable={state.status === 'ready'}>
        {state.status === 'loading' && <DocViewer.Loading />}
        {state.status !== 'loading' && state.status !== 'ready' && (
          <DocViewer.Message withDownload error>
            This file could not be loaded
          </DocViewer.Message>
        )}
        {state.status === 'ready' && (
          <Table striped withTableBorder bg="var(--mantine-color-body)">
            <Table.Thead>
              <Table.Tr>
                {parseCsv(state.text)[0].map((cell, index) => (
                  <Table.Th key={index}>{cell}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {parseCsv(state.text)
                .slice(1)
                .map((row, rowIndex) => (
                  <Table.Tr key={rowIndex}>
                    {row.map((cell, index) => (
                      <Table.Td key={index}>{cell}</Table.Td>
                    ))}
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        )}
      </DocViewer.Body>
    </>
  );
}

export function CustomRenderer() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.csv" h={400}>
        <CsvView />
      </DocViewer>
    </div>
  );
}

export function PageEditing() {
  const [saved, setSaved] = useState('Nothing saved yet');

  return (
    <Stack p={40} gap="sm">
      <MantineText size="sm" data-testid="saved">
        {saved}
      </MantineText>
      <DocViewer
        src="/sample.pdf"
        extensions={[
          createPageEditorExtension({
            onDocumentChange: (bytes, { reason, pages }) =>
              setSaved(`${reason}: ${bytes.length} bytes, pages ${pages.join(', ')}`),
            onExtract: (bytes, { pages }) =>
              setSaved(`extract: ${bytes.length} bytes, pages ${pages.join(', ')}`),
          }),
        ]}
        defaultThumbnailsOpened
        h={600}
      />
    </Stack>
  );
}

export function Plain() {
  return (
    <div style={{ padding: 40, maxWidth: 720 }}>
      <MantineText mb="sm">
        An article with a PDF embedded in it, with no viewer chrome:
      </MantineText>
      <DocViewer
        src="/sample.pdf"
        variant="plain"
        withToolbar={false}
        pagesProps={{ gap: 'sm' }}
        h={500}
      />
    </div>
  );
}

export function DarkPages() {
  return (
    <div style={{ padding: 40, background: 'var(--mantine-color-dark-7)' }}>
      <DocViewer src="/sample-50.pdf" pageColorScheme="dark" defaultThumbnailsOpened h={600} />
    </div>
  );
}

export function TrimmedToolbar() {
  return (
    <div style={{ padding: 40, width: 420 }}>
      <DocViewer
        src="/sample.pdf"
        size="xs"
        toolbarControls={{
          rotate: false,
          layout: false,
          outline: false,
          info: false,
          presentation: false,
          print: false,
          fullscreen: false,
        }}
        h={500}
      />
    </div>
  );
}
