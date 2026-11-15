import { useIdle, useInterval } from '@mantine/hooks';
import React, { useEffect, useState } from 'react';
import { DocViewer, useDocViewer, useDocViewerStore } from '../../index';
import classes from './Atrium.module.css';

export default {
  title: 'Apps/Atrium',
  parameters: { layout: 'fullscreen' },
};

interface Room {
  number: number;
  title: string;
}

const ROOMS: Room[] = [
  { number: 1, title: 'Der Fluss als Arbeitsplatz' },
  { number: 2, title: 'Hochwasser' },
  { number: 3, title: 'Badeanstalt und Sommer' },
  { number: 4, title: 'Brücken' },
  { number: 5, title: 'Nachtschicht am Hafen' },
];

const FIRST_ROOM_PAGE = 3;
const PAGE_GAP = 20;

/** Time without a touch before the kiosk starts over, and how long each spread shows while it plays */
const IDLE_TIMEOUT = 60_000;
const ATTRACT_INTERVAL = 9_000;

/** Rooms on the open spread; the cover, plan and credits have none */
function roomsOnSpread(pages: number[]) {
  return ROOMS.filter((room) => pages.includes(room.number + FIRST_ROOM_PAGE - 1));
}

/** Text the visitor reads on a kiosk is German, and so is the viewer's own */
const GERMAN_LABELS = {
  documentLabel: 'Dokument',
  imageLabel: 'Bild',
  downloadLabel: 'Herunterladen',
  downloadFileLabel: 'Datei herunterladen',
  printLabel: 'Drucken',
  fullscreenLabel: 'Vollbild',
  exitFullscreenLabel: 'Vollbild beenden',
  loadingLabel: 'Dokument wird geladen',
  zoomInLabel: 'Vergrößern',
  zoomOutLabel: 'Verkleinern',
  resetZoomLabel: 'Zoom auf 100 % zurücksetzen',
  fitToWidthLabel: 'An Breite anpassen',
  fitToViewLabel: 'An Ansicht anpassen',
  rotateLabel: 'Drehen',
  pageThumbnailsLabel: 'Seitenvorschau',
  showPagesLabel: 'Seiten anzeigen',
  hidePagesLabel: 'Seiten ausblenden',
  pagesLabel: 'Seiten',
  outlineLabel: 'Inhaltsverzeichnis',
  noOutlineLabel: 'Dieses Dokument hat kein Inhaltsverzeichnis',
  pageLayoutLabel: 'Seitenlayout',
  layoutSingleLabel: 'Einzelseiten',
  layoutTwoPageLabel: 'Zwei Seiten',
  layoutTwoPageCoverLabel: 'Zwei Seiten, Titelseite einzeln',
  layoutHorizontalLabel: 'Horizontal scrollen',
  layoutWrappedLabel: 'Umbrochen',
  passwordRequiredLabel: 'Dieses PDF ist passwortgeschützt',
  passwordIncorrectLabel: 'Das Passwort ist falsch',
  passwordLabel: 'Passwort',
  unlockLabel: 'Öffnen',
  thumbnailsPositionLabel: 'Position der Seitenleiste',
  leftLabel: 'Links',
  rightLabel: 'Rechts',
  topLabel: 'Oben',
  bottomLabel: 'Unten',
  previousPageLabel: 'Vorherige Seite',
  nextPageLabel: 'Nächste Seite',
  pageOfLabel: (page: number, total: number) => `Seite ${page} von ${total}`,
  thumbnailLabel: (page: number) => `Seite ${page}`,
  linkToPageLabel: (page: number) => `Zu Seite ${page}`,
  searchLabel: 'Suchen',
  searchDocumentLabel: 'Dokument durchsuchen',
  searchingLabel: 'Suche läuft …',
  noMatchesLabel: 'Keine Treffer',
  matchOfLabel: (match: number, total: number) => `${match} von ${total}`,
  matchOnPageLabel: (match: number, total: number, page: number) =>
    `Treffer ${match} von ${total}, Seite ${page}`,
  previousMatchLabel: 'Vorheriger Treffer',
  nextMatchLabel: 'Nächster Treffer',
  closeSearchLabel: 'Suche schließen',
  matchCaseLabel: 'Groß-/Kleinschreibung',
  wholeWordsLabel: 'Ganze Wörter',
  matchAccentsLabel: 'Akzente beachten',
  pdfWorkerMissingLabel: 'PDF-Vorschau ist nicht eingerichtet',
  pdfErrorLabel: 'Dieses PDF konnte nicht geöffnet werden',
  imageErrorLabel: 'Dieses Bild konnte nicht geladen werden',
  textErrorLabel: 'Diese Datei konnte nicht geladen werden',
  unsupportedLabel: 'Für diesen Dateityp ist keine Vorschau verfügbar',
};

// Defined once at module level: the viewer must see the same objects on every render
const TOOLBAR_CONTROLS = {
  // A kiosk is not for taking files home
  download: false,
  print: false,
  title: false,
  thumbnails: false,
  rotate: false,
  layout: false,
  outline: false,
  info: false,
  presentation: false,
  editPages: false,
  search: false,
  fullscreen: false,
};

const TOOLBAR_PROPS = {
  tooltipProps: { position: 'bottom', withArrow: true, openDelay: 0 },
} as const;

// The guide links to its own pages; a link must never take the kiosk anywhere else.
// Visitors swipe the glass or use the arrows beside the guide; scrolling stops on spreads
const PAGES_PROPS = {
  gap: PAGE_GAP,
  matchColor: '#f2c14e',
  activeMatchColor: '#d4a02f',
  withPageTurning: { tapZones: false },
  withScrollSnap: true,
  onLinkClick: (_url: string, event: MouseEvent) => event.preventDefault(),
};

const CLASS_NAMES = {
  root: classes.root,
  toolbar: classes.toolbar,
  controls: classes.controls,
  control: classes.control,
  pageIndicator: classes.pageIndicator,
  zoomLevel: classes.zoomLevel,
  body: classes.body,
  pages: classes.pages,
  page: classes.page,
};

function Arrow({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d={direction === 'previous' ? 'M24 8L12 20l12 12' : 'M16 8l12 12-12 12'}
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="square"
      />
    </svg>
  );
}

/**
 * A touchscreen in the foyer of the Kunsthalle Lindenau shows the guide to the exhibition. The
 * screen is a wayfinding sign: the rooms on the open spread are named in signage type, and big
 * arrows turn the spread. Nothing leaves the kiosk: no downloads, no printing, no links.
 */
export function Atrium() {
  const [store, viewer] = useDocViewer();
  // The open spread: the cover alone, then pairs of pages
  const { spread, numPages } = useDocViewerStore(store);
  const spreadCount = numPages > 0 ? Math.floor(numPages / 2) + 1 : 0;
  const [fullscreen, setFullscreen] = useState(false);

  // After a minute nobody has touched the screen: back to the cover with the whole spread in
  // view, then the guide turns a spread every nine seconds until the next visitor touches it
  const idle = useIdle(IDLE_TIMEOUT, { initialState: false });
  const attract = useInterval(() => viewer.nextSpread({ loop: true }), ATTRACT_INTERVAL);
  useEffect(() => {
    if (idle) {
      viewer.goToPage(1);
      viewer.setZoom('fit-page');
      attract.start();
    } else {
      attract.stop();
    }
    return attract.stop;
  }, [idle]);

  const first = spread.pages[0];
  const rooms = roomsOnSpread(spread.pages);
  const goTo = (target: number) => viewer.goToPage(target);

  return (
    <div className={classes.kiosk}>
      <header className={classes.band}>
        <div className={classes.signs}>
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <div key={room.number} className={classes.sign}>
                <span className={classes.signNumber}>{room.number}</span>
                <span className={classes.signTitle}>
                  <span className={classes.signKind}>Raum {room.number}</span>
                  {room.title}
                </span>
              </div>
            ))
          ) : (
            <div className={classes.sign}>
              <span className={classes.signNumber} data-symbol>
                i
              </span>
              <span className={classes.signTitle}>
                <span className={classes.signKind}>Information</span>
                {first === 1 ? 'Titelseite' : first === 2 ? 'Raumplan' : 'Impressum'}
              </span>
            </div>
          )}
        </div>
        <div className={classes.exhibition}>
          <div className={classes.exhibitionTitle}>Wasserzeichen</div>
          <div className={classes.exhibitionSub}>Fotografie am Fluss, 1920 bis 1975</div>
        </div>
        <button
          type="button"
          className={classes.fullscreenButton}
          onClick={() => setFullscreen((current) => !current)}
        >
          Vollbild
        </button>
      </header>

      <div className={classes.reader}>
        <button
          type="button"
          className={classes.turn}
          aria-label="Vorherige Doppelseite"
          disabled={spread.index <= 1}
          onClick={() => viewer.previousSpread()}
        >
          <Arrow direction="previous" />
        </button>

        <div className={classes.viewer}>
          <DocViewer
            src="/stories/exhibition-guide.pdf"
            fileName="Wasserzeichen"
            store={store}
            labels={GERMAN_LABELS}
            // Zoom reads 125 %, page counts and sizes follow German conventions
            locale="de-DE"
            size="xl"
            color="#f2c14e"
            radius={0}
            defaultPageLayout="two-page-cover"
            // The whole spread is on the screen, in the frame and full screen alike
            defaultZoom="fit-page"
            pagesProps={PAGES_PROPS}
            // The band's Vollbild button and the viewer's own full screen button stay in step
            fullscreen={fullscreen}
            onFullscreenChange={setFullscreen}
            toolbarProps={TOOLBAR_PROPS}
            toolbarControls={TOOLBAR_CONTROLS}
            classNames={CLASS_NAMES}
          />
        </div>

        <button
          type="button"
          className={classes.turn}
          aria-label="Nächste Doppelseite"
          disabled={spreadCount > 0 && spread.index >= spreadCount}
          onClick={() => viewer.nextSpread()}
        >
          <Arrow direction="next" />
        </button>
      </div>

      <nav className={classes.wayfinding} aria-label="Räume">
        <button
          type="button"
          className={classes.stop}
          data-wide
          data-active={first === 2 || undefined}
          onClick={() => goTo(2)}
        >
          Raumplan
        </button>
        <ol className={classes.rooms}>
          {ROOMS.map((room) => (
            <li key={room.number}>
              <button
                type="button"
                className={classes.stop}
                data-active={rooms.includes(room) || undefined}
                aria-label={`Raum ${room.number}: ${room.title}`}
                onClick={() => goTo(room.number + FIRST_ROOM_PAGE - 1)}
              >
                {room.number}
              </button>
            </li>
          ))}
        </ol>
        <div className={classes.hint}>Zum Blättern wischen oder die Pfeile berühren</div>
      </nav>
    </div>
  );
}

Atrium.storyName = 'Atrium';
Atrium.parameters = {
  docs: {
    description: {
      story:
        'A touchscreen in the foyer of the Kunsthalle Lindenau shows the guide to the exhibition. The screen is a wayfinding sign: the rooms on the open spread are named in signage type, and big arrows turn the spread. Nothing leaves the kiosk: no downloads, no printing, no links.',
    },
  },
};
