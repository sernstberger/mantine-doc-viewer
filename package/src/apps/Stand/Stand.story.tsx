import { ActionIcon, useMatches } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import {
  DocViewer,
  useDocViewer,
  useDocViewerStore,
  type DocViewerOutlineItem,
  type DocViewerPageLayout,
} from '../../index';
import { createMarkupExtension, saveMarkup, type DocViewerMark } from '../../markup';
import classes from './Stand.module.css';

export default {
  title: 'Apps/Stand',
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

function StandScreen() {
  const [drawer, setDrawer] = useState<boolean | null>(null);
  // Closed on arrival: the score takes the whole screen until the setlist is asked for
  const drawerOpened = drawer ?? false;
  const [store, viewer] = useDocViewer();
  // The pages on the stand, so the setlist can mark the section being played
  const { spread } = useDocViewerStore(store);
  const [sections, setSections] = useState<DocViewerOutlineItem[]>([]);
  // One page at a time on a phone, a spread from Mantine's sm breakpoint (48em) up; the
  // page being played stays in view when the screen changes
  const pageLayout = useMatches<DocViewerPageLayout>({ base: 'horizontal', sm: 'two-page' });
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
      saveMarkup(store);
    }
    setPencil(!pencil);
  };

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
                          (section.page !== null && spread.pages.includes(section.page)) ||
                          undefined
                        }
                        onClick={() => section.page && viewer.goToPage(section.page)}
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

        <div className={classes.hint}>Tap the page edges, swipe, or press the pedal to turn.</div>
      </aside>

      {/* On a phone the setlist covers the score; tapping the dimmed score puts it away */}
      <button
        type="button"
        className={classes.scrim}
        aria-label="Hide setlist"
        tabIndex={-1}
        onClick={() => setDrawer(false)}
      />

      <main className={classes.reader}>
        <DocViewer.Root
          src="/stories/nocturne.pdf"
          fileName="Lantern Hour"
          store={store}
          size="xs"
          color="yellow"
          radius={0}
          // Ivory paper, so the score glows against the aubergine stage
          pageBackground="#FBF8F1"
          pageLayout={pageLayout}
          // A whole page (a phone) or spread (a tablet) fills the screen, however it is held
          defaultZoom="fit-page"
          onDocumentLoad={() => viewer.getOutline().then(setSections)}
          extensions={[
            // Pencil: soft graphite on the ivory paper, thin enough for fingering numbers
            createMarkupExtension({
              tool: pencil ? 'pen' : null,
              value: pencilMarks,
              onChange: setPencilMarks,
              color: '#6f6873',
              width: 1.1,
              onDocumentChange: () => setSavedNote('Saved with the piece'),
            }),
          ]}
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
        >
          {/* A thin strip: the title, the page and full screen, nothing else on stage */}
          <DocViewer.Toolbar
            tooltipProps={{ openDelay: 600, position: 'bottom' }}
            // The setlist toggle sits at the start of the toolbar
            leftSection={
              <>
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
              </>
            }
          >
            <DocViewer.PageControls />

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
            <DocViewer.FullscreenButton />
          </DocViewer.Toolbar>
          <DocViewer.Main>
            {/* Spreads turn from the screen edges, a swipe, or a Bluetooth pedal (it sends arrow keys), and scrolling stops on whole spreads */}
            <DocViewer.Pages gap="xl" withPageTurning withScrollSnap />
          </DocViewer.Main>
        </DocViewer.Root>
      </main>
    </div>
  );
}

/**
 * A pianist reads a nocturne on a tablet on the music stand: the score is the whole screen, the
 * toolbar is a thin strip, and pages turn from the screen edges or the arrow keys.
 */
export function Stand() {
  return <StandScreen />;
}

Stand.storyName = 'Stand';
Stand.parameters = {
  docs: {
    description: {
      story:
        'A pianist reads a nocturne on a tablet on the music stand: the score is the whole screen, the toolbar is a thin strip, and pages turn from the screen edges or the arrow keys.',
    },
  },
};
