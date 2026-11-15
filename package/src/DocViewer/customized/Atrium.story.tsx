import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useCallback, useRef, useState } from 'react';
import { DocViewer } from '../DocViewer';
import type { DocViewerController } from '../controller';
import classes from './Atrium.module.css';

export default {
  title: 'DocViewer/Apps/Atrium (museum kiosk)',
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

/** Rooms on the open spread; the cover, plan and credits have none */
function roomsOnSpread(pages: number[]) {
  return ROOMS.filter((room) => pages.includes(room.number + FIRST_ROOM_PAGE - 1));
}

/** Text the visitor reads on a kiosk is German, and so is the viewer's own */
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

// Defined once at module level: the viewer must see the same objects on every render
const TOOLBAR_CONTROLS = {
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

const TOOLTIP_PROPS = { position: 'bottom', withArrow: true, openDelay: 0 } as const;

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
  const controller = useRef<DocViewerController>(null);
  // The viewer reports the open spread: the cover alone, then pairs of pages
  const [spread, setSpread] = useState({ number: 1, pages: [1] });
  const [spreadCount, setSpreadCount] = useState(0);

  const first = spread.pages[0];
  const rooms = roomsOnSpread(spread.pages);
  const goTo = useCallback((target: number) => controller.current?.goToPage(target), []);

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
          onClick={() => controller.current?.toggleFullscreen()}
        >
          Vollbild
        </button>
      </header>

      <div className={classes.reader}>
        <button
          type="button"
          className={classes.turn}
          aria-label="Vorherige Seite"
          disabled={spread.number <= 1}
          onClick={() => controller.current?.previousSpread()}
        >
          <Arrow direction="previous" />
        </button>

        <div className={classes.viewer}>
          <DocViewer
            src="/stories/exhibition-guide.pdf"
            fileName="Wasserzeichen"
            pdfWorkerSrc={pdfWorkerSrc}
            controllerRef={controller}
            labels={GERMAN_LABELS}
            size="xl"
            color="#f2c14e"
            matchColor="#f2c14e"
            activeMatchColor="#d4a02f"
            radius={0}
            pageGap={PAGE_GAP}
            defaultPageLayout="two-page-cover"
            // The whole spread is on the screen, in the frame and full screen alike
            defaultZoom="fit-page"
            // The cover alone, then pairs of pages
            onDocumentLoad={(info) => setSpreadCount(Math.floor((info.numPages ?? 0) / 2) + 1)}
            onSpreadChange={(number, pages) => setSpread({ number, pages })}
            // Visitors swipe the glass or use the arrows beside the guide; scrolling stops on spreads
            withPageTurning={{ tapZones: false }}
            withScrollSnap
            // A kiosk is not for taking files home
            withDownload={false}
            withPrint={false}
            // The guide links to its own pages; a link must never take the kiosk anywhere else
            onLinkClick={(_url, event) => event.preventDefault()}
            tooltipProps={TOOLTIP_PROPS}
            toolbarControls={TOOLBAR_CONTROLS}
            classNames={CLASS_NAMES}
            // MISSING: kiosk behaviours: `idleTimeout` + `onIdle` to return to the cover and reset the zoom, and an attract mode
            //          (`autoAdvance={{ interval }}`) that plays the guide until someone touches the screen.
            // MISSING: a controlled `fullscreen` prop, so the story's Vollbild button could show the state.
            // MISSING: a locale prop for the number formats the viewer uses.
          />
        </div>

        <button
          type="button"
          className={classes.turn}
          aria-label="Nächste Seite"
          disabled={spreadCount > 0 && spread.number >= spreadCount}
          onClick={() => controller.current?.nextSpread()}
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
