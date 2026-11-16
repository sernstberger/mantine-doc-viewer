import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { type KeyboardEvent, type ReactNode, useEffect, useState } from 'react';
import {
  DocViewer,
  useDocViewer,
  useDocViewerContext,
  useDocViewerStore,
  useDocViewerText,
  useDocViewerView,
  type DocViewerLoadInfo,
  type DocViewerState,
} from '../../index';
import classes from './Locker.module.css';
import { pdfConsole } from '../../test-utils/pdf-console';

export default {
  title: 'Apps/Locker',
  parameters: { layout: 'fullscreen', ...pdfConsole },
};

/* -------------------------------------------------------------------------- */
/* Files                                                                      */
/* -------------------------------------------------------------------------- */

/** The colour system: one colour per kind of file, used in the list, the preview and the viewer */
type Kind = 'pdf' | 'image' | 'code' | 'sheet' | 'doc';

const KIND_LABEL: Record<Kind, string> = {
  pdf: 'PDF document',
  image: 'Image',
  code: 'Code',
  sheet: 'Spreadsheet',
  doc: 'Document',
};

/** Mantine colour that the viewer uses for focus rings and active states */
const KIND_VIEWER_COLOR: Record<Kind, string> = {
  pdf: 'red',
  image: 'violet',
  code: 'gray',
  sheet: 'green',
  doc: 'blue',
};

interface DriveFile {
  id: string;
  src: string;
  name: string;
  kind: Kind;
  owner: string;
  modified: string;
  modifiedLong: string;
  size: string;
}

const FILES: DriveFile[] = [
  {
    id: 'recap',
    src: '/stories/quarterly-report.pdf',
    name: 'Q3 quarterly report.pdf',
    kind: 'pdf',
    owner: 'Marcus Webb',
    modified: 'Today, 9:41',
    modifiedLong: 'today at 9:41',
    size: '17 KB',
  },
  {
    id: 'press-kit',
    src: '/sample.pdf',
    name: 'Press kit.pdf',
    kind: 'pdf',
    owner: 'Priya Raman',
    modified: 'Yesterday',
    modifiedLong: 'yesterday at 4:12 PM',
    size: '5 KB',
  },
  {
    id: 'hero',
    src: '/sample-image.svg',
    name: 'Hero artwork.svg',
    kind: 'image',
    owner: 'Dana Okafor',
    modified: 'Nov 11',
    modifiedLong: 'Nov 11 at 2:30 PM',
    size: '1 KB',
  },
  {
    id: 'notes',
    src: '/sample.md',
    name: 'Launch notes.md',
    kind: 'doc',
    owner: 'Priya Raman',
    modified: 'Nov 10',
    modifiedLong: 'Nov 10 at 11:05 AM',
    size: '1 KB',
  },
  {
    id: 'revenue',
    src: '/sample.csv',
    name: 'Regional revenue.csv',
    kind: 'sheet',
    owner: 'Marcus Webb',
    modified: 'Nov 7',
    modifiedLong: 'Nov 7 at 5:48 PM',
    size: '1 KB',
  },
  {
    id: 'manifest',
    src: '/sample.json',
    name: 'Asset manifest.json',
    kind: 'code',
    owner: 'Leo Brandt',
    modified: 'Nov 5',
    modifiedLong: 'Nov 5 at 10:20 AM',
    size: '1 KB',
  },
  {
    id: 'attachments',
    src: '/sample.ts',
    name: 'group-attachments.ts',
    kind: 'code',
    owner: 'Leo Brandt',
    modified: 'Oct 29',
    modifiedLong: 'Oct 29 at 3:15 PM',
    size: '1 KB',
  },
];

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

const GLYPHS: Record<Kind, ReactNode> = {
  pdf: (
    <>
      <path d="M4.5 2.5h5l3 3v8h-8z" />
      <path d="M9.5 2.5v3h3M6.5 8.5h4M6.5 11h4" />
    </>
  ),
  image: (
    <>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" />
      <circle cx="6" cy="6.8" r="1" />
      <path d="M3 12l3.5-3 2.5 2 2-1.5 3 2.5" />
    </>
  ),
  code: <path d="M6 5L3 8l3 3M10 5l3 3-3 3" />,
  sheet: (
    <>
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M2.5 9.8h11M6.2 3v10" />
    </>
  ),
  doc: <path d="M3.5 4.5h9M3.5 7.5h9M3.5 10.5h5.5" />,
};

function FileIcon({ kind, large }: { kind: Kind; large?: boolean }) {
  return (
    <span className={classes.fileIcon} data-kind={kind} data-large={large || undefined} aria-hidden>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[kind]}
      </svg>
    </span>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICONS = {
  download: (
    <Icon>
      <path d="M8 2.5v8M4.8 7.5L8 10.7l3.2-3.2M3 13h10" />
    </Icon>
  ),
  print: (
    <Icon>
      <path d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z" />
    </Icon>
  ),
  expand: (
    <Icon>
      <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5L9 7M2.5 13.5L7 9" />
    </Icon>
  ),
  zoomIn: (
    <Icon>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14M7 5v4M5 7h4" />
    </Icon>
  ),
  zoomOut: (
    <Icon>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14M5 7h4" />
    </Icon>
  ),
  share: (
    <Icon>
      <path d="M6.5 9.5l3-3M5.5 7.5l-1 1a2.4 2.4 0 003.4 3.4l1-1M10.5 8.5l1-1A2.4 2.4 0 008.1 4.1l-1 1" />
    </Icon>
  ),
  folder: (
    <Icon>
      <path d="M2.5 4.5a1 1 0 011-1h3l1.5 1.5h4.5a1 1 0 011 1v6a1 1 0 01-1 1h-9a1 1 0 01-1-1z" />
    </Icon>
  ),
  people: (
    <Icon>
      <circle cx="6" cy="5.5" r="2.2" />
      <path d="M2.2 13c.3-2.2 1.8-3.4 3.8-3.4s3.5 1.2 3.8 3.4M10.5 3.6a2.2 2.2 0 010 4.2M11.5 9.8c1.3.3 2.1 1.4 2.3 3.2" />
    </Icon>
  ),
  clock: (
    <Icon>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3.2l2 1.3" />
    </Icon>
  ),
  chevron: (
    <Icon>
      <path d="M6 4l4 4-4 4" />
    </Icon>
  ),
};

/* -------------------------------------------------------------------------- */
/* CSV renderer, restyled as a sheet                                          */
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

const isNumber = (cell: string) => cell !== '' && !Number.isNaN(Number(cell));

function CsvView() {
  // A custom view reports load / error itself, the built-in views do it for the built-in types only
  const { src } = useDocViewerContext();
  const state = useDocViewerText(src, 2_000_000);
  const view = useDocViewerView();

  useEffect(() => {
    if (state.status === 'ready') {
      view.onLoad({ type: 'text' });
    } else if (state.status === 'error') {
      view.onError(state.error);
    }
  }, [state, view]);

  const rows = state.status === 'ready' ? parseCsv(state.text) : [];
  const numeric = rows[0]?.map((_, index) => rows.slice(1).every((row) => isNumber(row[index])));

  return (
    <>
      {/* The sheet has no tools: no toolbar, the app header already names the file */}
      <DocViewer.Body focusable={state.status === 'ready'}>
        {state.status === 'loading' && <DocViewer.Loading />}
        {(state.status === 'error' || state.status === 'too-large') && (
          <DocViewer.Message withDownload error>
            This file could not be loaded
          </DocViewer.Message>
        )}
        {state.status === 'ready' && (
          <table className={classes.sheet}>
            <thead>
              <tr>
                <th className={classes.sheetCorner} aria-hidden />
                {rows[0].map((cell, index) => (
                  <th key={index} data-numeric={numeric[index] || undefined}>
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th className={classes.sheetRow} scope="row">
                    {rowIndex + 1}
                  </th>
                  {row.map((cell, index) => (
                    <td key={index} data-numeric={numeric[index] || undefined}>
                      {numeric[index] ? Number(cell).toLocaleString('en-US') : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DocViewer.Body>
    </>
  );
}

// The app has its own download, print and full screen buttons, and its own title
// A preview pane is narrow: keep reading controls, leave layout, presentation and info to the full viewer
const TOOLBAR_CONTROLS = {
  fullscreen: false,
  print: false,
  download: false,
  title: false,
  layout: false,
  presentation: false,
  info: false,
  editPages: false,
};
const TOOLTIP_PROPS = { openDelay: 400, position: 'bottom' as const };
const TOOLBAR_PROPS = { tooltipProps: TOOLTIP_PROPS };
const VIEWER_CLASSES = {
  root: classes.viewer,
  toolbar: classes.viewerToolbar,
  control: classes.viewerControl,
  pageIndicator: classes.viewerIndicator,
  zoomLevel: classes.viewerIndicator,
  body: classes.viewerBody,
  page: classes.viewerPage,
  text: classes.viewerText,
  code: classes.viewerCode,
  markdown: classes.viewerMarkdown,
  search: classes.viewerSearch,
  thumbnails: classes.viewerThumbnails,
  thumbnail: classes.viewerThumbnail,
};

/* -------------------------------------------------------------------------- */
/* App                                                                        */
/* -------------------------------------------------------------------------- */

function describe(status: DocViewerState['status']) {
  if (status === 'error') {
    return { status: 'error', text: 'Preview unavailable' };
  }
  if (status === 'ready') {
    return { status: 'ready', text: 'Preview ready' };
  }
  return { status: 'loading', text: 'Loading preview' };
}

/** Size as the viewer measured it, for the files whose size it knows: PDFs and text */
function measuredSize(info: DocViewerLoadInfo | undefined) {
  const bytes = info?.byteSize;
  if (bytes === undefined) {
    return null;
  }
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dimensions(info: DocViewerLoadInfo | undefined) {
  if (info?.numPages) {
    return `${info.numPages} ${info.numPages === 1 ? 'page' : 'pages'}`;
  }
  if (info?.width && info.height) {
    return `${info.width.toLocaleString('en-US')} × ${info.height.toLocaleString('en-US')} px`;
  }
  return null;
}

/**
 * A team drive, Shared / Brand launch: pick a file, preview it beside the list, and download or
 * print from the app's own buttons through the controller.
 */
export function Locker() {
  const [store, viewer] = useDocViewer();
  const { status: loadStatus, info, canPrint } = useDocViewerStore(store);
  const [selectedId, setSelectedId] = useState(FILES[0].id);
  const [toast, setToast] = useState<string | null>(null);
  const selected = FILES.find((file) => file.id === selectedId)!;
  const { status, text } = describe(loadStatus);
  const facts = dimensions(info ?? undefined);
  const measured = measuredSize(info ?? undefined);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (step) {
      event.preventDefault();
      const next = FILES[FILES.findIndex((file) => file.id === selectedId) + step];
      if (next) {
        setSelectedId(next.id);
        document.getElementById(`locker-row-${next.id}`)?.focus();
      }
    }
  };

  return (
    <div className={classes.app}>
      <nav className={classes.nav} aria-label="Drive">
        <div className={classes.brand}>
          <span className={classes.brandMark} aria-hidden />
          Locker
        </div>
        <ul className={classes.navList}>
          <li>
            <a className={classes.navItem} href="#my-files" onClick={(e) => e.preventDefault()}>
              {ICONS.folder}
              My files
            </a>
          </li>
          <li>
            <a
              className={classes.navItem}
              href="#shared"
              aria-current="page"
              onClick={(e) => e.preventDefault()}
            >
              {ICONS.people}
              Shared
            </a>
          </li>
          <li>
            <a className={classes.navItem} href="#recent" onClick={(e) => e.preventDefault()}>
              {ICONS.clock}
              Recent
            </a>
          </li>
        </ul>
        <div className={classes.storage}>
          <div className={classes.storageBar} aria-hidden>
            <span style={{ width: '62%' }} />
          </div>
          <div className={classes.storageText}>62 GB of 100 GB used</div>
        </div>
      </nav>

      <section className={classes.list} aria-label="Files">
        <header className={classes.listHeader}>
          <nav aria-label="Breadcrumb" className={classes.breadcrumb}>
            <span>Shared</span>
            {ICONS.chevron}
            <strong aria-current="page">Brand launch</strong>
          </nav>
          <span className={classes.count}>{FILES.length} files</span>
        </header>

        <div className={classes.tableWrap}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" className={classes.colOwner}>
                  Owner
                </th>
                <th scope="col" className={classes.colModified}>
                  Modified
                </th>
                <th scope="col" className={classes.colSize}>
                  Size
                </th>
              </tr>
            </thead>
            <tbody>
              {FILES.map((file) => (
                <tr
                  key={file.id}
                  className={classes.row}
                  data-kind={file.kind}
                  data-selected={file.id === selectedId || undefined}
                  onClick={() => setSelectedId(file.id)}
                >
                  <td>
                    <button
                      id={`locker-row-${file.id}`}
                      type="button"
                      className={classes.rowButton}
                      aria-pressed={file.id === selectedId}
                      tabIndex={file.id === selectedId ? 0 : -1}
                      onFocus={() => setSelectedId(file.id)}
                      onKeyDown={onKeyDown}
                    >
                      <FileIcon kind={file.kind} />
                      <span className={classes.fileName}>{file.name}</span>
                    </button>
                  </td>
                  <td className={classes.colOwner}>
                    <span className={classes.owner}>
                      <span className={classes.avatar} aria-hidden>
                        {file.owner[0]}
                      </span>
                      {file.owner}
                    </span>
                  </td>
                  <td className={classes.colModified}>{file.modified}</td>
                  <td className={classes.colSize}>{file.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className={classes.preview} data-kind={selected.kind} aria-label="Preview">
        <header className={classes.previewHeader}>
          <FileIcon kind={selected.kind} large />
          <div className={classes.previewTitle}>
            <h2>{selected.name}</h2>
            <p>
              {selected.owner} edited {selected.modifiedLong}
            </p>
          </div>
          <div className={classes.actions}>
            <Button
              size="xs"
              radius={6}
              className={classes.share}
              leftSection={ICONS.share}
              onClick={() => setToast('Link copied to clipboard')}
            >
              Share
            </Button>
            <Tooltip label="Download" {...TOOLTIP_PROPS}>
              <ActionIcon
                className={classes.action}
                aria-label="Download"
                onClick={() => {
                  viewer.download();
                  setToast(`Downloading ${selected.name}`);
                }}
              >
                {ICONS.download}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Print" {...TOOLTIP_PROPS}>
              <ActionIcon
                className={classes.action}
                aria-label="Print"
                // Spreadsheets and other files the viewer cannot print leave the button off
                disabled={!canPrint}
                onClick={() => {
                  void viewer.print();
                }}
              >
                {ICONS.print}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Full screen" {...TOOLTIP_PROPS}>
              <ActionIcon
                className={classes.action}
                aria-label="Full screen"
                onClick={() => {
                  void viewer.toggleFullscreen();
                }}
              >
                {ICONS.expand}
              </ActionIcon>
            </Tooltip>
          </div>
        </header>

        <div className={classes.viewerWrap}>
          <DocViewer
            src={selected.src}
            fileName={selected.name}
            store={store}
            color={KIND_VIEWER_COLOR[selected.kind]}
            size="sm"
            radius={0}
            variant="plain"
            // The app has its own download, print and full screen buttons
            toolbarControls={TOOLBAR_CONTROLS}
            toolbarProps={TOOLBAR_PROPS}
            classNames={VIEWER_CLASSES}
          >
            {selected.name.endsWith('.csv') ? <CsvView /> : null}
          </DocViewer>
        </div>

        <footer className={classes.details}>
          <div className={classes.chips}>
            <span className={classes.kindChip} data-kind={selected.kind}>
              {KIND_LABEL[selected.kind]}
            </span>
            {facts && <span>{facts}</span>}
            <span>{measured ?? selected.size}</span>
          </div>
          <span className={classes.status} data-status={status} role="status">
            {text}
          </span>
          <div className={classes.zoom}>
            <Tooltip label="Zoom out" {...TOOLTIP_PROPS}>
              <ActionIcon
                className={classes.action}
                aria-label="Zoom out"
                onClick={() => viewer.zoomOut()}
              >
                {ICONS.zoomOut}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Zoom in" {...TOOLTIP_PROPS}>
              <ActionIcon
                className={classes.action}
                aria-label="Zoom in"
                onClick={() => viewer.zoomIn()}
              >
                {ICONS.zoomIn}
              </ActionIcon>
            </Tooltip>
          </div>
        </footer>
      </aside>

      {toast && (
        <div className={classes.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

Locker.storyName = 'Locker';
Locker.parameters = {
  docs: {
    description: {
      story:
        "A team drive, Shared / Brand launch: pick a file, preview it beside the list, and download or print from the app's own buttons through the controller.",
    },
  },
};
