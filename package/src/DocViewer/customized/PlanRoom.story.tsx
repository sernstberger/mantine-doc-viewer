import { Button, TextInput, UnstyledButton } from '@mantine/core';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useRef, useState } from 'react';
import { DocViewer } from '../DocViewer';
import type { DocViewerController } from '../controller';
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

/**
 * A site superintendent on a tablet, mid pour, needs the framing sheet fast and big. The index
 * on the left is the app; the viewer scrolls sideways through the sheets like a rolled-out set.
 */
export function PlanRoom() {
  const controller = useRef<DocViewerController>(null);
  const [page, setPage] = useState(START_PAGE);
  const [query, setQuery] = useState('');

  // Keep the current sheet in view in the index, also when the page changes by scrolling
  const currentRow = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    currentRow.current?.scrollIntoView({ block: 'nearest' });
  }, [page]);

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
  };

  return (
    <div className={classes.app} data-mantine-color-scheme="dark">
      <nav className={classes.index} aria-label="Sheet index">
        <header className={classes.header}>
          <h1 className={classes.project}>Millbrook Medical Office</h1>
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
                <path
                  d="M12 12l4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
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
          {!visible.length && (
            <p className={classes.none}>No sheet matches &ldquo;{query}&rdquo;.</p>
          )}
        </div>

        <footer className={classes.footer}>
          <span className={classes.synced} aria-hidden />
          Synced 6:12 am. Works offline.
        </footer>
      </nav>

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
          withPageEditing={false}
          withFullscreen={false}
          toolbarControls={{ thumbnails: false, presentation: false, info: false, layout: false }}
          tooltipProps={{ position: 'bottom' }}
          classNames={{
            root: classes.root,
            toolbar: classes.toolbar,
            title: classes.title,
            control: classes.control,
            pageIndicator: classes.pageIndicator,
            zoomLevel: classes.zoomLevel,
            search: classes.search,
            searchInput: classes.searchInput,
            searchCount: classes.searchCount,
            body: classes.body,
            page: classes.sheetPage,
          }}
          // MISSING: a toolbar slot or a title render prop, so the title can be the current sheet ("S-201 Level 2 framing") instead of the file name.
          // MISSING: markup layer (cloud a revision, pin an RFI on the sheet) and saving it back to the set.
          // MISSING: a measure tool that uses the sheet's scale, and a way to calibrate it.
          // MISSING: overlaying two revisions of a sheet to see what changed.
        />
      </main>
    </div>
  );
}
