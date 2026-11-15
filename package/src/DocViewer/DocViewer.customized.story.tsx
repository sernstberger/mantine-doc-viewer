import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useRef, useState } from 'react';
import type { DocViewerController, DocViewerLoadInfo } from './controller';
import { DocViewer } from './DocViewer';
import { DocViewerToolbar } from './DocViewerToolbar';
import { DocViewerBody, DocViewerRenderer, useDocViewer } from './renderers';
import { useTextDocument } from './text/use-text-document';
import { DocViewerLoading, DocViewerMessage } from './views/MessageView';

export default { title: 'DocViewer/Customized' };

/* -------------------------------------------------------------------------- */
/* 1. Contract review                                                         */
/* -------------------------------------------------------------------------- */

// The outline of the PDF is only readable inside the viewer, so the sections are hard-coded here.
// MISSING: a way to read the outline (`controller.getOutline()` or `onOutlineLoad`) to build external navigation.
const SECTIONS = [
  { label: '1. Definitions', page: 1 },
  { label: '2. Payment terms', page: 7 },
  { label: '3. Liability', page: 18 },
  { label: '4. Termination', page: 31 },
  { label: '5. Signatures', page: 50 },
];

type Status = 'draft' | 'in-review' | 'approved';

const STATUS_COLORS: Record<Status, string> = {
  draft: 'gray',
  'in-review': 'yellow',
  approved: 'green',
};

export function ContractReview() {
  const controller = useRef<DocViewerController>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState<Status>('in-review');
  const [comments, setComments] = useState([
    { id: 1, page: 7, text: 'Net 60 is too long, ask for net 30.' },
    { id: 2, page: 18, text: 'Liability cap should be mutual.' },
  ]);
  const [draft, setDraft] = useState('');

  return (
    <Group align="stretch" wrap="nowrap" p="md" gap="md">
      <DocViewer
        src="/sample-50.pdf"
        fileName="Master services agreement.pdf"
        pdfWorkerSrc={pdfWorkerSrc}
        controllerRef={controller}
        page={page}
        onPageChange={setPage}
        onDocumentLoad={(info: DocViewerLoadInfo) => setNumPages(info.numPages ?? 0)}
        defaultThumbnailsOpened
        color="indigo"
        radius="md"
        withFullscreen={false}
        style={{ flex: 1 }}
        h="85vh"
        // Dark mode: the body and chrome follow the Mantine colour scheme already, the pages stay white.
        // MISSING: a `pageBackground` prop and a dark-mode page treatment (invert / tint pages) so contracts are readable at night.
        styles={{
          toolbar: { borderBottomColor: 'var(--mantine-color-indigo-light)' },
        }}
        toolbarSection={
          <Group gap="xs" wrap="nowrap">
            <Badge color={STATUS_COLORS[status]} variant="light" style={{ flexShrink: 0 }}>
              {status}
            </Badge>
            <Button
              size="compact-xs"
              variant="default"
              disabled={status === 'approved'}
              onClick={() => setStatus('approved')}
            >
              Approve
            </Button>
          </Group>
        }
      />

      <Stack w={320} gap="sm">
        <Paper withBorder p="sm">
          <Text fw={600} size="sm" mb="xs">
            Jump to section
          </Text>
          {SECTIONS.map((section) => (
            <NavLink
              key={section.page}
              label={section.label}
              description={`Page ${section.page}`}
              active={
                page >= section.page &&
                page < (SECTIONS.find((s) => s.page > section.page)?.page ?? Infinity)
              }
              onClick={() => controller.current?.goToPage(section.page)}
            />
          ))}
        </Paper>

        <Group gap="xs" justify="space-between">
          <Text size="sm">
            Page {page} / {numPages || '…'}
          </Text>
          <Group gap={4}>
            <Button
              size="compact-xs"
              variant="default"
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              Prev
            </Button>
            <Button
              size="compact-xs"
              variant="default"
              onClick={() => setPage(Math.min(numPages || 1, page + 1))}
            >
              Next
            </Button>
          </Group>
        </Group>

        <Paper withBorder p="sm" style={{ flex: 1, minHeight: 0 }}>
          <Text fw={600} size="sm" mb="xs">
            Comments
          </Text>
          <ScrollArea h={260}>
            <Stack gap="xs">
              {comments.map((comment) => (
                <Card key={comment.id} withBorder padding="xs">
                  <Text size="xs" c="dimmed">
                    {/* MISSING: anchoring comments to a position on the page (page overlay slot / coordinates -> scroll) */}
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      onClick={() => controller.current?.goToPage(comment.page)}
                    >
                      Page {comment.page}
                    </Button>
                  </Text>
                  <Text size="sm">{comment.text}</Text>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
          <Divider my="sm" />
          {/* MISSING: onTextSelect(text, page, rects) so a lawyer can select a clause and comment on it */}
          <Textarea
            size="xs"
            placeholder={`Comment on page ${page}`}
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
          />
          <Group justify="space-between" mt="xs">
            <Button
              size="compact-xs"
              variant="default"
              onClick={() => controller.current?.openSearch('liability')}
            >
              Find "liability"
            </Button>
            <Button
              size="compact-xs"
              disabled={!draft.trim()}
              onClick={() => {
                setComments([...comments, { id: Date.now(), page, text: draft.trim() }]);
                setDraft('');
              }}
            >
              Add
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Group>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Embedded article                                                        */
/* -------------------------------------------------------------------------- */

export function EmbeddedArticle() {
  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="md">
        What we learned from fifty pages of specs
      </Title>
      <Text mb="lg">
        The first thing we noticed is that nobody reads the appendix. Here is the first page of the
        report as published, embedded straight into the article:
      </Text>

      <DocViewer
        src="/sample.pdf"
        pdfWorkerSrc={pdfWorkerSrc}
        withToolbar={false}
        radius={0}
        // `h` is required: the viewer has no auto height.
        // MISSING: `height="auto"` / `autoHeight` so the viewer grows to the pages and the article scrolls instead.
        h={620}
        defaultZoom="fit"
        // No border, no grey background, no shadows, transparent pages:
        // MISSING: `variant="unstyled"` or `withBorder={false}` / `withShadow={false}` / `pageBackground` props, this takes four selectors.
        vars={() => ({ root: { '--doc-viewer-page-background': 'transparent' } })}
        styles={{
          root: { border: 0, background: 'transparent', minHeight: 0 },
          body: { background: 'transparent' },
          page: { boxShadow: 'none' },
        }}
      />

      <Text mt="lg" mb="lg">
        Charts work too, and an image gets the same treatment:
      </Text>

      <DocViewer
        src="/sample-image.svg"
        withToolbar={false}
        h={320}
        styles={{
          root: { border: 0, background: 'transparent' },
          body: { background: 'transparent' },
        }}
      />
      {/* MISSING: with no toolbar there is no way to open the file full screen / zoom for readers; a floating overlay button (`withOverlayControls`) */}
      <Text mt="lg" c="dimmed" size="sm">
        Figure 1. Sample image.
      </Text>
    </Container>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Mobile compact                                                          */
/* -------------------------------------------------------------------------- */

export function MobileCompact() {
  return (
    <Box p="md" bg="var(--mantine-color-gray-2)" mih="100vh">
      <Box w={375} mx="auto" style={{ borderRadius: 24, overflow: 'hidden' }}>
        <DocViewer
          src="/sample-50.pdf"
          fileName="Boarding pass.pdf"
          pdfWorkerSrc={pdfWorkerSrc}
          size="xs"
          radius={0}
          defaultThumbnailsOpened
          defaultThumbnailsPosition="bottom"
          thumbnailWidth={72}
          pageGap="xs"
          withPrint={false}
          withFullscreen={false}
          // Thumbnails, zoom, rotate, layout, outline and search are always in the toolbar, it wraps onto two lines at 375px.
          // MISSING: `controls={{ zoom: false, rotate: false, layout: false, outline: false, thumbnails: true, search: false }}`
          //          (or a `hiddenControls` array) to drop toolbar buttons that do not fit a phone.
          // MISSING: pinch-to-zoom on touch (only buttons are available) and a `touch` friendly tap-to-toggle toolbar.
          // MISSING: responsive props (`size={{ base: 'xs', sm: 'sm' }}`) so the same element adapts to the viewport.
          // MISSING: `thumbnailsPosition` as a responsive value (left on desktop, bottom on phones).
          h={560}
        />
      </Box>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Branded kiosk                                                           */
/* -------------------------------------------------------------------------- */

const GERMAN_LABELS = {
  document: 'Dokument',
  image: 'Bild',
  download: 'Herunterladen',
  downloadFile: 'Datei herunterladen',
  print: 'Drucken',
  fullscreen: 'Vollbild',
  exitFullscreen: 'Vollbild beenden',
  loading: 'Dokument wird geladen',
  zoomIn: 'Vergrößern',
  zoomOut: 'Verkleinern',
  resetZoom: 'Zoom auf 100 % zurücksetzen',
  fitToWidth: 'An Breite anpassen',
  fitToView: 'An Ansicht anpassen',
  rotate: 'Drehen',
  pageThumbnails: 'Seitenvorschau',
  showPages: 'Seiten anzeigen',
  hidePages: 'Seiten ausblenden',
  pages: 'Seiten',
  outline: 'Inhaltsverzeichnis',
  noOutline: 'Dieses Dokument hat kein Inhaltsverzeichnis',
  pageLayout: 'Seitenlayout',
  layoutSingle: 'Einzelseiten',
  layoutTwoPage: 'Zwei Seiten',
  layoutTwoPageCover: 'Zwei Seiten, Titelseite einzeln',
  layoutHorizontal: 'Horizontal scrollen',
  layoutWrapped: 'Umbrochen',
  passwordRequired: 'Dieses PDF ist passwortgeschützt',
  passwordIncorrect: 'Das Passwort ist falsch',
  password: 'Passwort',
  unlock: 'Öffnen',
  thumbnailsPosition: 'Position der Seitenleiste',
  left: 'Links',
  right: 'Rechts',
  top: 'Oben',
  bottom: 'Unten',
  previousPage: 'Vorherige Seite',
  nextPage: 'Nächste Seite',
  pageOf: (page: number, total: number) => `Seite ${page} von ${total}`,
  thumbnail: (page: number) => `Seite ${page}`,
  linkToPage: (page: number) => `Zu Seite ${page}`,
  search: 'Suchen',
  searchDocument: 'Dokument durchsuchen',
  searching: 'Suche läuft …',
  noMatches: 'Keine Treffer',
  matchOf: (match: number, total: number) => `${match} von ${total}`,
  matchOnPage: (match: number, total: number, page: number) =>
    `Treffer ${match} von ${total}, Seite ${page}`,
  previousMatch: 'Vorheriger Treffer',
  nextMatch: 'Nächster Treffer',
  closeSearch: 'Suche schließen',
  matchCase: 'Groß-/Kleinschreibung',
  wholeWords: 'Ganze Wörter',
  matchAccents: 'Akzente beachten',
  pdfWorkerMissing: 'PDF-Vorschau ist nicht eingerichtet',
  pdfError: 'Dieses PDF konnte nicht geöffnet werden',
  imageError: 'Dieses Bild konnte nicht geladen werden',
  textError: 'Diese Datei konnte nicht geladen werden',
  unsupported: 'Für diesen Dateityp ist keine Vorschau verfügbar',
};

export function BrandedKiosk() {
  const controller = useRef<DocViewerController>(null);

  return (
    <Box bg="var(--mantine-color-grape-9)" p="xl" mih="100vh">
      <Group justify="space-between" mb="md">
        <Title order={2} c="white">
          Museum der Zukunft
        </Title>
        <Button
          size="lg"
          color="grape"
          variant="white"
          onClick={() => controller.current?.toggleFullscreen()}
        >
          Vollbild
        </Button>
      </Group>

      <DocViewer
        src="/sample-50.pdf"
        fileName="Ausstellungsführer"
        pdfWorkerSrc={pdfWorkerSrc}
        controllerRef={controller}
        labels={GERMAN_LABELS}
        size="xl"
        color="grape"
        matchColor="pink.3"
        activeMatchColor="pink.7"
        pageGap={48}
        radius="xl"
        defaultThumbnailsOpened
        defaultPageLayout="two-page-cover"
        thumbnailWidth={140}
        // A kiosk is not for taking files home.
        withDownload={false}
        withPrint={false}
        // Stops visitors leaving the kiosk through links in the PDF.
        onLinkClick={(_url, event) => event.preventDefault()}
        tooltipProps={{ position: 'bottom', withArrow: true }}
        h="80vh"
        // Presentation feel: dark stage, warm pages.
        // MISSING: `pageBackground` prop; `--doc-viewer-page-background` is read by the CSS but never set by `vars` / props.
        vars={() => ({ root: { '--doc-viewer-page-background': '#fffaf2' } })}
        styles={{ body: { background: 'var(--mantine-color-grape-8)' }, root: { border: 0 } }}
        // MISSING: kiosk behaviours: `autoAdvance={{ interval: 15000 }}` (slideshow), `idleTimeout` + `onIdle` to reset to page 1 / zoom fit,
        //          `defaultFullscreen` / `fullscreen` controlled prop (browsers need a gesture, but the app should own the state),
        //          `withSearch={false}` / hide controls a public screen has no keyboard for, and a `touch` swipe-to-turn-page.
        // MISSING: labels for `markdownView`, `tooLarge` etc. are required in `labels` type only as Partial, fine, but there is no
        //          locale prop for number / date formats used by the viewer.
      />
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. File manager preview                                                    */
/* -------------------------------------------------------------------------- */

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
  // A custom renderer reports load / error itself, the built-in views do it for the built-in types only.
  // MISSING: custom renderers could be given `onLoad` / `onError` helpers instead of reaching into `events`.
  const { events } = useDocViewer();
  const state = useTextDocument(src, 2_000_000);

  useEffect(() => {
    if (state.status === 'ready') {
      events.onDocumentLoad({ type: 'text' });
    } else if (state.status === 'error') {
      events.onDocumentError(state.error);
    }
  }, [state.status, events]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = state.status === 'ready' ? parseCsv(state.text) : [];

  return (
    <>
      <DocViewerToolbar />
      <DocViewerBody focusable={state.status === 'ready'}>
        {state.status === 'loading' && <DocViewerLoading />}
        {(state.status === 'error' || state.status === 'too-large') && (
          <DocViewerMessage withDownload error>
            This file could not be loaded
          </DocViewerMessage>
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
      </DocViewerBody>
    </>
  );
}

const csvRenderer: DocViewerRenderer = {
  test: (file) => file.mimeType === 'text/csv' || !!file.fileName?.endsWith('.csv'),
  render: (file) => <CsvView src={file.src} />,
};

const FILES = [
  { name: 'sample.pdf', src: '/sample.pdf', kind: 'PDF' },
  { name: 'sample-image.svg', src: '/sample-image.svg', kind: 'Image' },
  { name: 'sample.md', src: '/sample.md', kind: 'Markdown' },
  { name: 'sample.ts', src: '/sample.ts', kind: 'Code' },
  { name: 'sample.json', src: '/sample.json', kind: 'JSON' },
  { name: 'sample.csv', src: '/sample.csv', kind: 'CSV' },
];

export function FileManagerPreview() {
  const controller = useRef<DocViewerController>(null);
  const [selected, setSelected] = useState(FILES[0]);
  const [status, setStatus] = useState('Loading…');
  const isNarrow = useMediaQuery('(max-width: 700px)');

  // Resets before the new file loads. MISSING: a `onDocumentLoadStart` event (or `loading` state) to avoid this manual reset.
  const select = (file: (typeof FILES)[number]) => {
    setSelected(file);
    setStatus('Loading…');
  };

  return (
    <Stack p="md" gap="sm">
      <Group gap="xs">
        <Button size="xs" variant="default" onClick={() => controller.current?.download()}>
          Download {selected.name}
        </Button>
        <Button size="xs" variant="default" onClick={() => controller.current?.print()}>
          Print
        </Button>
        <Button size="xs" variant="default" onClick={() => controller.current?.toggleFullscreen()}>
          Full screen
        </Button>
        {/* MISSING: `controller.canPrint` / `controller.type`: print does nothing for some types, the app cannot know to disable the button */}
        <ActionIcon
          variant="subtle"
          aria-label="Zoom in"
          onClick={() => controller.current?.zoomIn()}
        >
          +
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          aria-label="Zoom out"
          onClick={() => controller.current?.zoomOut()}
        >
          -
        </ActionIcon>
      </Group>

      <Group align="stretch" wrap={isNarrow ? 'wrap' : 'nowrap'} gap="md">
        <Paper withBorder w={isNarrow ? '100%' : 240} p="xs">
          {FILES.map((file) => (
            <NavLink
              key={file.name}
              label={file.name}
              description={file.kind}
              active={file.name === selected.name}
              onClick={() => select(file)}
            />
          ))}
        </Paper>

        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <DocViewer
            src={selected.src}
            fileName={selected.name}
            pdfWorkerSrc={pdfWorkerSrc}
            controllerRef={controller}
            renderers={[csvRenderer]}
            // The two download / print buttons are in the app, so hide the built-in ones.
            withDownload={false}
            withPrint={false}
            withFullscreen={false}
            h="70vh"
            onDocumentLoad={(info) =>
              setStatus(
                `Loaded ${selected.name} (${info.type}${info.numPages ? `, ${info.numPages} pages` : ''}${info.width ? `, ${info.width}x${info.height}px` : ''})`
              )
            }
            onDocumentError={(error) =>
              setStatus(`Failed to load ${selected.name}: ${error.message}`)
            }
          />
          <Text size="xs" c="dimmed" role="status">
            {status}
          </Text>
          {/* MISSING: onDocumentLoad gives no byte size / mime / title metadata (PDF info dictionary, text length, line count) for the status line */}
        </Stack>
      </Group>
    </Stack>
  );
}
