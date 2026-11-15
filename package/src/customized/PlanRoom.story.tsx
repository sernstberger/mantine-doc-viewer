import { ActionIcon, Button, Drawer, Popover, TextInput, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useRef, useState } from 'react';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';
import type { DocViewerController } from '../hooks/use-controller-registry';
import type { DocViewerMark } from '../utils/markup';
import classes from './PlanRoom.module.css';

export default {
  title: 'DocViewer/Apps/Plan room (construction plans)',
  parameters: { layout: 'fullscreen' },
};

type Discipline = 'G' | 'A' | 'S' | 'M' | 'E';

interface Sheet {
  number: string;
  title: string;
  discipline: Discipline;
  /** Page of plan-set.pdf */
  page: number;
  note?: string;
}

const DISCIPLINES: Record<Discipline, string> = {
  G: 'General',
  A: 'Architectural',
  S: 'Structural',
  M: 'Mechanical',
  E: 'Electrical',
};

// The set as the app's database knows it; page numbers follow the PDF
const SHEETS: Sheet[] = [
  { number: 'G-001', title: 'Cover sheet and drawing index', discipline: 'G', page: 1 },
  { number: 'A-101', title: 'Level 1 floor plan', discipline: 'A', page: 2 },
  { number: 'A-102', title: 'Level 2 floor plan', discipline: 'A', page: 3 },
  { number: 'A-201', title: 'Exterior elevations', discipline: 'A', page: 4 },
  { number: 'A-301', title: 'Building section and wall section', discipline: 'A', page: 5 },
  { number: 'S-101', title: 'Foundation plan', discipline: 'S', page: 6 },
  {
    number: 'S-201',
    title: 'Level 2 framing and slab pour plan',
    discipline: 'S',
    page: 7,
    note: 'Pour 1 today',
  },
  { number: 'S-301', title: 'Typical structural details', discipline: 'S', page: 8 },
  { number: 'M-101', title: 'Level 1 mechanical plan', discipline: 'M', page: 9 },
  { number: 'E-101', title: 'Level 1 lighting and power plan', discipline: 'E', page: 10 },
];

const START_PAGE = 7;

interface Rfi {
  number: number;
  page: number;
  /** Where the pin points, in PDF points from the sheet's top-left */
  x: number;
  y: number;
  status: 'open' | 'answered';
  question: string;
  from: string;
}

// RFIs live in the app's database with their thread and status, so they are pins over the
// sheet, not marks in the PDF: answering one changes the pin, the drawing stays as issued
const RFIS: Rfi[] = [
  {
    number: 112,
    page: 7,
    x: 500,
    y: 300,
    status: 'open',
    question:
      'Pour joint at grid 3: bulkhead over the beam or offset 2 ft? Detail 4/S-301 shows both.',
    from: 'Keller Concrete, 13 Nov',
  },
  {
    number: 108,
    page: 7,
    x: 890,
    y: 150,
    status: 'answered',
    question: 'Slab edge at Stair 1: angle size for the pour stop?',
    from: 'Answered by Halvorsen Structural, 9 Nov',
  },
];

// A revision cloud the field engineer drew this morning around the stair opening
const FIELD_MARKUP: DocViewerMark[] = [
  {
    type: 'cloud',
    id: 'cloud-stair',
    page: 7,
    color: '#e03131',
    width: 2,
    rect: { x: 742, y: 108, width: 160, height: 220 },
  },
  {
    type: 'text',
    id: 'note-stair',
    page: 7,
    color: '#e03131',
    x: 742,
    y: 336,
    text: 'Confirm opening size\nwith elevator sub',
    fontSize: 10,
  },
];

/**
 * A site superintendent on a tablet, mid pour, needs the framing sheet fast and big. The index
 * on the left is the app; the viewer scrolls sideways through the sheets like a rolled-out set.
 */
export function PlanRoom() {
  const controller = useRef<DocViewerController>(null);
  const [page, setPage] = useState(START_PAGE);
  const [query, setQuery] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Keep the current sheet in view in the index, also when the page changes by scrolling
  const currentRow = useRef<HTMLButtonElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    currentRow.current?.scrollIntoView({ block: 'nearest' });
  }, [page, drawerOpen]);

  const currentSheet = SHEETS.find((sheet) => sheet.page === page);
  const needle = query.trim().toLowerCase();
  const visible = SHEETS.filter(
    (sheet) =>
      !needle ||
      sheet.number.toLowerCase().includes(needle) ||
      sheet.number.replace('-', '').toLowerCase().includes(needle.replace('-', '')) ||
      sheet.title.toLowerCase().includes(needle)
  );

  const openSheet = (sheet: Sheet) => {
    setPage(sheet.page);
    controller.current?.goToPage(sheet.page);
    setDrawerOpen(false);
  };

  // The same index as a column on a tablet and as a drawer on a phone (same pixel as the CSS)
  const phone = useMediaQuery('(max-width: 47.99375em)') ?? false;

  const index = (
    <>
      <header className={classes.header}>
        {/* Takes the drawer's initial focus, so a phone's keyboard stays down */}
        <h1 className={classes.project} tabIndex={-1} data-autofocus>
          Millbrook Medical Office
        </h1>
        <p className={classes.issue}>Issued for construction, 12 October 2026</p>
      </header>

      <div className={classes.tools}>
        <TextInput
          classNames={{ input: classes.filterInput, section: classes.filterIcon }}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          // Enter opens the first match, so "s2" and Enter is all it takes mid pour
          onKeyDown={(event) => {
            if (event.key === 'Enter' && visible[0]) {
              openSheet(visible[0]);
            }
          }}
          placeholder="Find a sheet"
          aria-label="Find a sheet"
          size="md"
          leftSection={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          }
        />
        <Button
          variant="default"
          size="md"
          classNames={{ root: classes.textSearch }}
          onClick={() => controller.current?.openSearch()}
        >
          Search drawing text
        </Button>
      </div>

      <div className={classes.sheets}>
        {(Object.keys(DISCIPLINES) as Discipline[]).map((discipline) => {
          const group = visible.filter((sheet) => sheet.discipline === discipline);
          if (!group.length) {
            return null;
          }
          return (
            <section key={discipline} className={classes.group} data-discipline={discipline}>
              <h2 className={classes.groupTitle}>
                {DISCIPLINES[discipline]}
                <span className={classes.groupCount}>{group.length}</span>
              </h2>
              {group.map((sheet) => (
                <UnstyledButton
                  key={sheet.number}
                  ref={sheet.page === page ? currentRow : undefined}
                  className={classes.sheet}
                  data-discipline={sheet.discipline}
                  data-current={sheet.page === page || undefined}
                  aria-current={sheet.page === page ? 'page' : undefined}
                  onClick={() => openSheet(sheet)}
                >
                  <span className={classes.number}>{sheet.number}</span>
                  <span className={classes.sheetTitle}>{sheet.title}</span>
                  {sheet.note && <span className={classes.note}>{sheet.note}</span>}
                </UnstyledButton>
              ))}
            </section>
          );
        })}
        {!visible.length && <p className={classes.none}>No sheet matches &ldquo;{query}&rdquo;.</p>}
      </div>

      <footer className={classes.footer}>
        <span className={classes.synced} aria-hidden />
        {savedAt ? `Markup saved to rev C at ${savedAt}.` : 'Synced 6:12 am. Works offline.'}
      </footer>
    </>
  );

  return (
    <div className={classes.app} data-mantine-color-scheme="dark">
      {!phone && (
        <nav className={classes.index} aria-label="Sheet index">
          {index}
        </nav>
      )}
      <Drawer
        opened={phone && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size="min(86vw, 344px)"
        padding={0}
        withCloseButton={false}
        transitionProps={{
          onEntered: () => currentRow.current?.scrollIntoView({ block: 'center' }),
        }}
        classNames={{ content: `${classes.theme} ${classes.drawer}`, body: classes.drawerBody }}
        aria-label="Sheet index"
      >
        <nav className={classes.index} aria-label="Sheet index">
          {index}
        </nav>
      </Drawer>

      <main className={classes.viewer}>
        <DocViewer
          src="/stories/plan-set.pdf"
          fileName="Plan set, rev C"
          pdfWorkerSrc={pdfWorkerSrc}
          controllerRef={controller}
          size="lg"
          color="gray"
          radius={0}
          pageGap="xl"
          defaultPageLayout="horizontal"
          defaultZoom="fit"
          defaultPage={START_PAGE}
          onPageChange={setPage}
          // Clouds, pen and notes in red, the way markup is done on a printed set
          withMarkup
          markupTools={['cloud', 'pen', 'text']}
          markupColor="#e03131"
          markupWidth={2}
          markupFontSize={10}
          defaultMarkup={FIELD_MARKUP}
          onSave={(_bytes, { reason }) => {
            if (reason === 'annotate') {
              setSavedAt(
                new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              );
            }
          }}
          renderPageOverlay={({ pageNumber, scale }) =>
            RFIS.filter((rfi) => rfi.page === pageNumber).map((rfi) => (
              <Popover
                key={rfi.number}
                position="bottom-start"
                width={280}
                withinPortal={false}
                shadow="md"
              >
                <Popover.Target>
                  <UnstyledButton
                    className={classes.rfiPin}
                    data-status={rfi.status}
                    style={{ left: rfi.x * scale, top: rfi.y * scale }}
                    aria-label={`RFI ${rfi.number}, ${rfi.status}`}
                  >
                    RFI {rfi.number}
                  </UnstyledButton>
                </Popover.Target>
                <Popover.Dropdown className={classes.rfiCard}>
                  <div className={classes.rfiHead}>
                    <span className={classes.rfiNumber}>RFI {rfi.number}</span>
                    <span className={classes.rfiStatus} data-status={rfi.status}>
                      {rfi.status === 'open' ? 'Open' : 'Answered'}
                    </span>
                  </div>
                  <p className={classes.rfiQuestion}>{rfi.question}</p>
                  <p className={classes.rfiFrom}>{rfi.from}</p>
                </Popover.Dropdown>
              </Popover>
            ))
          }
          withPageEditing={false}
          withFullscreen={false}
          toolbarStartSection={
            phone ? (
              <ActionIcon
                variant="default"
                size={40}
                className={classes.indexButton}
                aria-label="Sheets"
                onClick={() => setDrawerOpen(true)}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path
                    d="M3 5h14M3 10h14M3 15h14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </ActionIcon>
            ) : undefined
          }
          // One toolbar row on a phone: keep the sheet, pages, zoom and search
          toolbarControls={{
            thumbnails: false,
            presentation: false,
            info: false,
            layout: false,
            zoom: !phone,
            outline: !phone,
            rotate: !phone,
            print: !phone,
            download: !phone,
          }}
          tooltipProps={{ position: 'bottom' }}
          classNames={{
            root: classes.root,
            toolbar: classes.toolbar,
            heading: classes.heading,
            controls: classes.controls,
            title: classes.title,
            subtitle: classes.subtitle,
            control: classes.control,
            pageIndicator: classes.pageIndicator,
            zoomLevel: classes.zoomLevel,
            search: classes.search,
            searchInput: classes.searchInput,
            searchCount: classes.searchCount,
            body: classes.body,
            page: classes.sheetPage,
            markupBar: classes.markupBar,
          }}
          // The title is the sheet in view, not the file name
          renderToolbarTitle={() =>
            currentSheet
              ? phone
                ? currentSheet.number
                : `${currentSheet.number} ${currentSheet.title}`
              : 'Plan set'
          }
          toolbarSubtitle={phone ? undefined : 'Plan set, rev C'}
          // MISSING: a measure tool that uses the sheet's scale, and a way to calibrate it.
          // MISSING: overlaying two revisions of a sheet to see what changed.
        />
      </main>
    </div>
  );
}
