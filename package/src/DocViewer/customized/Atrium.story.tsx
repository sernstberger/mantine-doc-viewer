import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useElementSize } from '@mantine/hooks';
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
const PAGE_SIZE = { width: 420, height: 595 };
const PAGE_GAP = 20;

/** Time without a touch before the kiosk starts over, and how long each spread shows while it plays */
const IDLE_TIMEOUT = 60_000;
const ATTRACT_INTERVAL = 9_000;
const TOOLBAR_HEIGHT = 68;

/** The page that opens a spread in the two-page-cover layout: 1, then 2-3, 4-5, 6-7, 8 */
const spreadStart = (page: number) => (page <= 1 ? 1 : page - (page % 2));

/** Rooms on the spread that starts at `first`; the cover, plan and credits have none */
function roomsOnSpread(first: number, numPages: number) {
  const last = first === 1 ? 1 : Math.min(first + 1, numPages || first + 1);
  return ROOMS.filter(
    (room) =>
      room.number + FIRST_ROOM_PAGE - 1 >= first && room.number + FIRST_ROOM_PAGE - 1 <= last
  );
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
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // Zoom so that a whole spread is visible without scrolling, from the room the viewer has
  const { ref: readerRef, width, height } = useElementSize<HTMLDivElement>();
  const fitSpread = useCallback(() => {
    if (numPages === 0) {
      return;
    }
    const availableWidth = fullscreen ? window.innerWidth : width;
    const availableHeight = (fullscreen ? window.innerHeight : height) - TOOLBAR_HEIGHT;
    if (availableWidth > 0 && availableHeight > 0) {
      const byWidth = (availableWidth - 48) / (PAGE_SIZE.width * 2 + PAGE_GAP);
      const byHeight = (availableHeight - 28) / PAGE_SIZE.height;
      controller.current?.setZoom(Math.max(0.3, Math.min(byWidth, byHeight)));
    }
  }, [numPages, width, height, fullscreen]);
  useEffect(fitSpread, [fitSpread]);

  const first = spreadStart(page);
  const last = first === 1 ? 1 : Math.min(first + 1, numPages || first + 1);
  const rooms = roomsOnSpread(first, numPages);
  const goTo = useCallback((target: number) => controller.current?.goToPage(target), []);
  const turn = (direction: 1 | -1) => {
    const target = first === 1 ? (direction === 1 ? 2 : 1) : first + direction * 2;
    goTo(Math.min(Math.max(target, 1), numPages || 1));
  };

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
          aria-label="Vorherige Seite"
          disabled={first <= 1}
          onClick={() => turn(-1)}
        >
          <Arrow direction="previous" />
        </button>

        <div ref={readerRef} className={classes.viewer}>
          <DocViewer
            src="/stories/exhibition-guide.pdf"
            fileName="Wasserzeichen"
            pdfWorkerSrc={pdfWorkerSrc}
            controllerRef={controller}
            labels={GERMAN_LABELS}
            // Zoom reads 125 %, page counts and sizes follow German conventions
            locale="de-DE"
            size="xl"
            color="#f2c14e"
            matchColor="#f2c14e"
            activeMatchColor="#d4a02f"
            radius={0}
            pageGap={PAGE_GAP}
            defaultPageLayout="two-page-cover"
            onDocumentLoad={(info) => setNumPages(info.numPages ?? 0)}
            onPageChange={setPage}
            // After a minute nobody has touched the screen: back to the cover at the spread zoom, then
            // the guide turns a spread every nine seconds until the next visitor touches it
            idleTimeout={IDLE_TIMEOUT}
            onIdle={() => {
              controller.current?.goToPage(1);
              fitSpread();
            }}
            autoAdvance={{ interval: ATTRACT_INTERVAL }}
            // A kiosk is not for taking files home
            withDownload={false}
            withPrint={false}
            // The guide links to its own pages; a link must never take the kiosk anywhere else
            onLinkClick={(_url, event) => event.preventDefault()}
            // The band's Vollbild button and the viewer's own full screen button stay in step
            fullscreen={fullscreen}
            onFullscreenChange={setFullscreen}
            tooltipProps={TOOLTIP_PROPS}
            toolbarControls={TOOLBAR_CONTROLS}
            classNames={CLASS_NAMES}
            // MISSING: swipe to turn the page; turning is an app button that calls goToPage, with the spread arithmetic done here.
            // MISSING: a zoom that fits the whole spread (width and height); 'fit' only fits the width, so the story computes it.
          />
        </div>

        <button
          type="button"
          className={classes.turn}
          aria-label="Nächste Seite"
          disabled={numPages > 0 && last >= numPages}
          onClick={() => turn(1)}
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
        <div className={classes.hint}>Zum Blättern die Pfeile berühren</div>
      </nav>
    </div>
  );
}
