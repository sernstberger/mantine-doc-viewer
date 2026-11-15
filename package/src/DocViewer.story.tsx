import { Button, Group, Stack, Table, Text as MantineText } from '@mantine/core';
import React, { useState } from 'react';
import {
  createPdfJsAdapter,
  DocViewer,
  DocViewerAdapterProvider,
  useDocViewer,
  useDocViewerStore,
  useDocViewerText,
  useDocViewerView,
} from './index';

export default { title: 'DocViewer' };

const pdfAdapterWithoutWorker = createPdfJsAdapter(() => import('pdfjs-dist'));

export function Usage() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.pdf" h={600} />
    </div>
  );
}

export function Controlled() {
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
        <MantineText size="sm">
          Page {page}, zoom {zoom}
        </MantineText>
      </Group>
      <DocViewer
        src="/sample-50.pdf"
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

export function StoreApi() {
  const [store, viewer] = useDocViewer();
  const { page, numPages } = useDocViewerStore(store);

  return (
    <Stack p={40} gap="sm">
      <Group gap="xs">
        <Button size="xs" variant="default" onClick={() => viewer.goToPage(1)}>
          First page
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
          Page {page} of {numPages}
        </MantineText>
      </Group>
      <DocViewer src="/sample-50.pdf" store={store} h={600} />
    </Stack>
  );
}

export function StylesApi() {
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

export function Unstyled() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.pdf" unstyled h={600} />
    </div>
  );
}

export function Composition() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer.Root src="/sample-50.pdf" defaultThumbnailsOpened h={600}>
        <DocViewer.Toolbar>
          <DocViewer.ThumbnailsButton />
          <DocViewer.PageControls />
          <DocViewer.ZoomControls />
          <DocViewer.SearchButton />
          <DocViewer.DownloadButton />
        </DocViewer.Toolbar>
        <DocViewer.Search />
        <DocViewer.Main>
          <DocViewer.Thumbnails />
          <DocViewer.Pages />
        </DocViewer.Main>
      </DocViewer.Root>
    </div>
  );
}

export function WithThumbnails() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.pdf" defaultThumbnailsOpened h={600} />
    </div>
  );
}

export function WithThumbnailsBottom() {
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

export function WithTwoPages() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample-50.pdf" defaultPageLayout="two-page-cover" h={600} />
    </div>
  );
}

export function WithDarkPages() {
  return (
    <div style={{ padding: 40, background: 'var(--mantine-color-dark-7)' }}>
      <DocViewer src="/sample-50.pdf" pageColorScheme="dark" defaultThumbnailsOpened h={600} />
    </div>
  );
}

export function WithTrimmedToolbar() {
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

export function WithOverlayControls() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.pdf" withToolbar={false} withOverlayControls h={500} />
    </div>
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

function CsvView({ src }: { src: string }) {
  const state = useDocViewerText(src, 2_000_000);
  const view = useDocViewerView();

  React.useEffect(() => {
    if (state.status === 'ready') {
      view.onLoad();
    } else if (state.status === 'error') {
      view.onError(state.error);
    }
  }, [state, view]);

  const rows = state.status === 'ready' ? parseCsv(state.text) : [];

  return (
    <>
      <DocViewer.Toolbar />
      <DocViewer.Body focusable={state.status === 'ready'}>
        {state.status === 'loading' && <DocViewer.Loading />}
        {(state.status === 'error' || state.status === 'too-large') && (
          <DocViewer.Message withDownload error>
            This file could not be loaded
          </DocViewer.Message>
        )}
        {state.status === 'ready' && (
          <Table striped withTableBorder bg="var(--mantine-color-body)">
            <Table.Thead>
              <Table.Tr>
                {rows[0].map((cell, index) => (
                  <Table.Th key={index}>{cell}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.slice(1).map((row, rowIndex) => (
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

export function Csv() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.csv" h={400}>
        <CsvView src="/sample.csv" />
      </DocViewer>
    </div>
  );
}
