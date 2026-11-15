import { ActionIcon } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DocViewer } from '../DocViewer';
import type { DocViewerController, DocViewerOutlineItem } from '../controller';
import type { DocViewerMark } from '../pdf/markup';
import classes from './Stand.module.css';

export default {
  title: 'DocViewer/Apps/Stand (sheet music reader)',
  parameters: { layout: 'fullscreen' },
};

interface Piece {
  title: string;
  composer: string;
  tempo: string;
  key: string;
  /** Only the first piece has a score on this device */
  downloaded?: boolean;
}

const SETLIST: Piece[] = [
  {
    title: 'Lantern Hour',
    composer: 'Iris Calloway',
    tempo: 'Andante sostenuto',
    key: 'D-flat major, 6/8',
    downloaded: true,
  },
  {
    title: 'Prelude in E minor, Op. 28 No. 4',
    composer: 'Frédéric Chopin',
    tempo: 'Largo',
    key: 'E minor, 4/4',
  },
  {
    title: 'Gnossienne No. 1',
    composer: 'Erik Satie',
    tempo: 'Lent',
    key: 'F minor, no bar lines',
  },
  {
    title: 'Clair de lune',
    composer: 'Claude Debussy',
    tempo: 'Andante très expressif',
    key: 'D-flat major, 9/8',
  },
  {
    title: 'Arabesque No. 1',
    composer: 'Claude Debussy',
    tempo: 'Andantino con moto',
    key: 'E major, 4/4',
  },
];

/** The first page of the spread a page is on: spreads are 1-2, 3-4, 5-6 */
const spreadStart = (page: number) => page - ((page - 1) % 2);

/**
 * A pianist reads a nocturne on a tablet on the music stand: the score is the whole screen, the
 * toolbar is a thin strip, and pages turn from the screen edges or the arrow keys.
 */
export function Stand() {
  const [drawer, setDrawer] = useState<boolean | null>(null);
  // Closed on arrival: the score takes the whole screen until the setlist is asked for
  const drawerOpened = drawer ?? false;
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [sections, setSections] = useState<DocViewerOutlineItem[]>([]);
  const controller = useRef<DocViewerController>(null);
  const [pencil, setPencil] = useState(false);
  const [pencilMarks, setPencilMarks] = useState<DocViewerMark[]>([]);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  useEffect(() => {
    if (!savedNote) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setSavedNote(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [savedNote]);

  // Putting the pencil down writes the marks into the score, so they travel with the piece
  const togglePencil = () => {
    if (pencil && pencilMarks.length > 0) {
      controller.current?.saveMarkup();
    }
    setPencil(!pencil);
  };

  // A spread should fill the screen: zoom so that two Letter pages fit the reader, width or height
  const { ref: readerRef, width, height } = useElementSize<HTMLElement>();
  useEffect(() => {
    if (numPages > 0 && width > 0 && height > 0) {
      const byWidth = (width - 64) / (612 * 2 + 32);
      const byHeight = (height - 34 - 40) / 792;
      controller.current?.setZoom(Math.max(0.3, Math.min(byWidth, byHeight)));
    }
  }, [numPages, width, height]);

  const first = spreadStart(page);
  const last = Math.min(first + 1, numPages || first + 1);
  const turn = useCallback(
    (direction: 1 | -1) => {
      const target = spreadStart(page) + direction * 2;
      if (target >= 1 && target <= (numPages || 1)) {
        controller.current?.goToPage(target);
      }
    },
    [page, numPages]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        turn(1);
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        turn(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn]);

  return (
    <div className={classes.stage} data-drawer={drawerOpened || undefined}>
      <aside className={classes.drawer} aria-label="Setlist" inert={!drawerOpened}>
        <div className={classes.drawerHeader}>
          <div className={classes.rehearsal}>Thursday rehearsal</div>
          <div className={classes.venue}>Wren Hall, 7:30 pm</div>
        </div>

        <ol className={classes.setlist}>
          {SETLIST.map((piece) => (
            <li
              key={piece.title}
              className={classes.piece}
              data-current={piece.downloaded || undefined}
            >
              <div className={classes.pieceTitle}>{piece.title}</div>
              <div className={classes.pieceComposer}>{piece.composer}</div>
              <div className={classes.pieceMeta}>
                <span>{piece.tempo}</span>
                <span>{piece.key}</span>
              </div>
              {piece.downloaded ? (
                <ul className={classes.sections}>
                  {(sections.length > 0
                    ? sections
                    : [{ title: 'Theme', page: 1, url: null, items: [] }]
                  ).map((section) => (
                    <li key={section.title}>
                      <button
                        type="button"
                        className={classes.section}
                        data-active={
                          section.page !== null && section.page >= first && section.page <= last
                            ? true
                            : undefined
                        }
                        onClick={() => section.page && controller.current?.goToPage(section.page)}
                      >
                        <span>{section.title}</span>
                        <span className={classes.sectionPage}>p. {section.page}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={classes.offline}>Not on this iPad yet</div>
              )}
            </li>
          ))}
        </ol>

        <div className={classes.hint}>Tap the page edges or use the arrow keys to turn.</div>
      </aside>

      <main ref={readerRef} className={classes.reader}>
        <ActionIcon
          className={classes.drawerToggle}
          variant="transparent"
          size="lg"
          aria-label={drawerOpened ? 'Hide setlist' : 'Show setlist'}
          aria-expanded={drawerOpened}
          onClick={() => setDrawer(!drawerOpened)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M4 5.5h12M4 10h12M4 14.5h7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </ActionIcon>

        <DocViewer
          src="/stories/nocturne.pdf"
          fileName="Lantern Hour"
          pdfWorkerSrc={pdfWorkerSrc}
          controllerRef={controller}
          size="xs"
          color="yellow"
          radius={0}
          // Ivory paper, so the score glows against the aubergine stage
          pageBackground="#FBF8F1"
          pageGap="xl"
          defaultPageLayout="two-page"
          defaultZoom={0.6}
          // A thin strip: the title, the page and full screen, nothing else on stage
          toolbarControls={{
            thumbnails: false,
            zoom: false,
            rotate: false,
            layout: false,
            outline: false,
            info: false,
            presentation: false,
            search: false,
            print: false,
            download: false,
          }}
          onDocumentLoad={(info) => {
            setNumPages(info.numPages ?? 0);
            controller.current?.getOutline().then(setSections);
          }}
          onPageChange={setPage}
          // Pencil: soft graphite on the ivory paper, thin enough for fingering numbers
          markupTool={pencil ? 'pen' : null}
          markup={pencilMarks}
          onMarkupChange={setPencilMarks}
          markupColor="#6f6873"
          markupWidth={1.1}
          onSave={(_bytes, { reason }) => {
            reason === 'annotate' && setSavedNote('Saved with the piece');
          }}
          toolbarSection={
            <>
              {savedNote && (
                <span className={classes.savedNote} role="status">
                  {savedNote}
                </span>
              )}
              {pencil && (
                <ActionIcon
                  className={classes.control}
                  variant="subtle"
                  size="sm"
                  aria-label="Undo pencil mark"
                  disabled={pencilMarks.length === 0}
                  onClick={() => setPencilMarks(pencilMarks.slice(0, -1))}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path
                      d="M7.5 12L3.5 8l4-4M3.5 8h8a5 5 0 0 1 0 10H9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </ActionIcon>
              )}
              <ActionIcon
                className={classes.control}
                variant="subtle"
                size="sm"
                aria-label="Pencil"
                aria-pressed={pencil}
                data-pressed={pencil || undefined}
                onClick={togglePencil}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path
                    d="M4 16l1-3.5L13.5 4a1.4 1.4 0 0 1 2 0l.5.5a1.4 1.4 0 0 1 0 2L7.5 15 4 16zM12 5.5l2.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </ActionIcon>
            </>
          }
          tooltipProps={{ openDelay: 600, position: 'bottom' }}
          classNames={{
            root: classes.root,
            toolbar: classes.toolbar,
            title: classes.title,
            control: classes.control,
            pageIndicator: classes.pageIndicator,
            body: classes.body,
            pages: classes.pages,
            page: classes.page,
          }}
          // MISSING: a slot in the toolbar for the app's own buttons (the setlist toggle floats over it instead).
          // MISSING: built-in page turning for spreads (tap zones, swipe, pedal keys); the zones below are app code
          // MISSING: a zoom that fits the view height ('fit' only fits the width), so the story computes the scale itself.
          // MISSING: a scroll snap or goToSpread: the viewer scrolls by page and does not know about spreads.
        />

        <button
          type="button"
          className={classes.turn}
          data-side="previous"
          aria-label="Previous page"
          disabled={first <= 1}
          onClick={() => turn(-1)}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <path
              d="M17 6l-8 8 8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className={classes.turn}
          data-side="next"
          aria-label="Next page"
          disabled={numPages > 0 && last >= numPages}
          onClick={() => turn(1)}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <path
              d="M11 6l8 8-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </main>
    </div>
  );
}
