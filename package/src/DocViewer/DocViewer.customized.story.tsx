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
import c from './DocViewer.customized.story.module.css';

export default { title: 'DocViewer/Customized' };

/* -------------------------------------------------------------------------- */
/* 1. Contract review                                                         */
/* -------------------------------------------------------------------------- */

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
  // Sections come from the PDF's own outline
  const [sections, setSections] = useState<{ label: string; page: number }[]>([]);
  const [status, setStatus] = useState<Status>('in-review');
  const [comments, setComments] = useState([
    { id: 1, page: 7, text: 'Net 60 is too long, ask for net 30.' },
    { id: 2, page: 18, text: 'Liability cap should be mutual.' },
  ]);
  const [draft, setDraft] = useState('');

  return (
    <Group className={c.ledgerScope} align="stretch" wrap="nowrap" p="md" gap="lg">
      <DocViewer
        src="/sample-50.pdf"
        fileName="Master services agreement.pdf"
        pdfWorkerSrc={pdfWorkerSrc}
        controllerRef={controller}
        page={page}
        onPageChange={setPage}
        onDocumentLoad={async (info: DocViewerLoadInfo) => {
          setNumPages(info.numPages ?? 0);
          const outline = (await controller.current?.getOutline()) ?? [];
          setSections(
            outline.flatMap((item) =>
              item.page === null ? [] : [{ label: item.title, page: item.page }]
            )
          );
        }}
        defaultThumbnailsOpened
        color="#b08d57"
        matchColor="#f3d9a4"
        activeMatchColor="#b08d57"
        thumbnailWidth={96}
        withFullscreen={false}
        style={{ flex: 1 }}
        h="calc(100vh - 2rem)"
        // Pages follow the Mantine colour scheme too, inverted in dark mode
        pageColorScheme="auto"
        classNames={{
          root: c.ledgerRoot,
          toolbar: c.ledgerToolbar,
          title: c.ledgerTitle,
          control: c.ledgerControl,
          pageIndicator: c.ledgerPageIndicator,
          body: c.ledgerBody,
          page: c.ledgerPage,
          thumbnails: c.ledgerThumbnails,
          thumbnail: c.ledgerThumbnail,
          thumbnailImage: c.ledgerThumbnailImage,
          thumbnailLabel: c.ledgerThumbnailLabel,
          search: c.ledgerSearch,
        }}
        toolbarSection={
          <Group gap="xs" wrap="nowrap">
            <Badge
              color={STATUS_COLORS[status]}
              variant="filled"
              radius={0}
              style={{ flexShrink: 0 }}
            >
              {status}
            </Badge>
            <Button
              size="compact-xs"
              radius={0}
              color="#b08d57"
              c="#1d2a44"
              disabled={status === 'approved'}
              onClick={() => setStatus('approved')}
            >
              Approve
            </Button>
          </Group>
        }
      />

      <Stack w={320} gap="md">
        <Paper className={c.ledgerPanel} p="sm">
          <Text className={c.ledgerHeading}>Jump to section</Text>
          {sections.map((section) => (
            <NavLink
              key={section.page}
              label={section.label}
              description={`Page ${section.page}`}
              active={
                page >= section.page &&
                page < (sections.find((s) => s.page > section.page)?.page ?? Infinity)
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

        <Paper className={c.ledgerPanel} p="sm" style={{ flex: 1, minHeight: 0 }}>
          <Text className={c.ledgerHeading}>Comments</Text>
          <ScrollArea h={260}>
            <Stack gap="xs">
              {comments.map((comment) => (
                <Card key={comment.id} withBorder radius={0} padding="xs" bg="transparent">
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
    <Box className={c.magazineScope}>
      <Container size="sm" py={64}>
        <Text className={c.magazineKicker}>Field notes · Engineering</Text>
        <Title order={1} className={c.magazineHeadline}>
          What we learned from fifty pages of specs
        </Title>
        <Text className={c.magazineLead} mb="lg" inherit>
          The first thing we noticed is that nobody reads the appendix. Here is the report as
          published, laid straight into the article like prints on a desk. Hover a page to
          straighten it.
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
          // No border, no grey background, no shadows
          variant="plain"
          pageGap="xl"
          classNames={{
            root: c.magazineRoot,
            body: c.magazineBody,
            pages: c.magazinePages,
            page: c.magazinePage,
          }}
        />

        <blockquote className={c.magazinePullQuote}>
          “Every spec had an appendix. Not one reviewer opened it.”
        </blockquote>

        <Text mb="xl" inherit>
          Charts work too, and an image gets the same treatment, framed like a print:
        </Text>

        <figure className={c.magazineFigure}>
          <DocViewer
            src="/sample-image.svg"
            withToolbar={false}
            variant="plain"
            h={320}
            classNames={{ root: c.magazineRoot, body: c.magazineFigureBody }}
          />
          {/* MISSING: with no toolbar there is no way to open the file full screen / zoom for readers; a floating overlay button (`withOverlayControls`) */}
          <figcaption className={c.magazineCaption}>Figure 1. Sample image.</figcaption>
        </figure>
      </Container>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Mobile compact                                                          */
/* -------------------------------------------------------------------------- */

export function MobileCompact() {
  return (
    <Box className={c.glassScope}>
      <Box className={c.glassPhone}>
        <DocViewer
          src="/sample-50.pdf"
          fileName="Boarding pass.pdf"
          pdfWorkerSrc={pdfWorkerSrc}
          // Bigger touch targets on a real phone, compact in a desktop window showing the mock-up
          size={{ base: 'md', sm: 'xs' }}
          color="violet"
          defaultThumbnailsOpened
          defaultThumbnailsPosition="bottom"
          thumbnailWidth={{ base: 64, sm: 72 }}
          pageGap={{ base: 'sm', sm: 'md' }}
          withPrint={false}
          withFullscreen={false}
          // Only what fits a phone
          toolbarControls={{
            rotate: false,
            layout: false,
            outline: false,
            info: false,
            presentation: false,
            search: false,
          }}
          classNames={{
            root: c.glassRoot,
            toolbar: c.glassToolbar,
            title: c.glassTitle,
            control: c.glassControl,
            pageIndicator: c.glassPageIndicator,
            body: c.glassBody,
            page: c.glassPage,
            thumbnails: c.glassThumbnails,
            thumbnail: c.glassThumbnail,
            thumbnailImage: c.glassThumbnailImage,
          }}
          // MISSING: a tap-to-toggle toolbar for touch screens.
          // MISSING: `thumbnailsPosition` as a responsive value (left on desktop, bottom on phones).
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
    <Box className={c.neonScope}>
      <Group justify="space-between" mb="xl">
        <Title order={1} className={c.neonHeading}>
          Museum der Zukunft
        </Title>
        <Button
          size="lg"
          radius="xl"
          className={c.neonButton}
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
        pageBackground="#fffaf2"
        // A public screen has no keyboard
        toolbarControls={{ search: false, info: false, editPages: false }}
        classNames={{
          root: c.neonRoot,
          toolbar: c.neonToolbar,
          title: c.neonTitle,
          control: c.neonControl,
          body: c.neonBody,
          page: c.neonPage,
          thumbnails: c.neonThumbnails,
          thumbnail: c.neonThumbnail,
          thumbnailImage: c.neonThumbnailImage,
        }}
        // MISSING: kiosk behaviours: `autoAdvance={{ interval: 15000 }}` (slideshow), `idleTimeout` + `onIdle` to reset to page 1 / zoom fit,
        //          a controlled `fullscreen` prop (browsers need a gesture, but the app should own the state), and swipe-to-turn-page.
        // MISSING: a locale prop for the number formats the viewer uses.
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
    <Stack className={c.brutalScope} gap="lg">
      <Group gap="sm">
        <Button size="xs" className={c.brutalButton} onClick={() => controller.current?.download()}>
          Download {selected.name}
        </Button>
        <Button size="xs" className={c.brutalButton} onClick={() => controller.current?.print()}>
          Print
        </Button>
        <Button
          size="xs"
          className={c.brutalButton}
          onClick={() => controller.current?.toggleFullscreen()}
        >
          Full screen
        </Button>
        {/* MISSING: `controller.canPrint` / `controller.type`: print does nothing for some types, the app cannot know to disable the button */}
        <ActionIcon
          className={c.brutalButton}
          aria-label="Zoom in"
          onClick={() => controller.current?.zoomIn()}
        >
          +
        </ActionIcon>
        <ActionIcon
          className={c.brutalButton}
          aria-label="Zoom out"
          onClick={() => controller.current?.zoomOut()}
        >
          -
        </ActionIcon>
      </Group>

      <Group align="stretch" wrap={isNarrow ? 'wrap' : 'nowrap'} gap="xl">
        <Paper className={c.brutalBox} w={isNarrow ? '100%' : 240} p={0}>
          {FILES.map((file) => (
            <NavLink
              className={c.brutalFile}
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
            radius={0}
            color="dark"
            classNames={{
              root: `${c.brutalBox} ${c.brutalRoot}`,
              toolbar: c.brutalToolbar,
              title: c.brutalTitle,
              control: c.brutalControl,
              body: c.brutalBody,
              page: c.brutalPage,
              text: c.brutalText,
            }}
            onDocumentLoad={(info) =>
              setStatus(
                `Loaded ${selected.name} (${info.type}${info.numPages ? `, ${info.numPages} pages` : ''}${info.width ? `, ${info.width}x${info.height}px` : ''})`
              )
            }
            onDocumentError={(error) =>
              setStatus(`Failed to load ${selected.name}: ${error.message}`)
            }
          />
          <Text className={c.brutalStatus} role="status" mt="xs" w="fit-content">
            {status}
          </Text>
          {/* MISSING: onDocumentLoad gives no byte size / mime / title metadata (PDF info dictionary, text length, line count) for the status line */}
        </Stack>
      </Group>
    </Stack>
  );
}
