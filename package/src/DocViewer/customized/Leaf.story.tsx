import { ActionIcon, Menu, Popover, SegmentedControl, Slider, VisuallyHidden } from '@mantine/core';
import { useElementSize, useHotkeys, useReducedMotion } from '@mantine/hooks';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { DocViewer } from '../DocViewer';
import type { DocViewerController } from '../controller';
import classes from './Leaf.module.css';

export default {
  title: 'DocViewer/Apps/Leaf (book reader)',
  parameters: { layout: 'fullscreen' },
};

/*
 * Leaf is an e-reader built on the viewer's public API. The viewer only draws the pages: no
 * toolbar, one page (or a spread) fitted to the window, its own scrolling switched off. Everything
 * a reader expects is app code on top: the chrome that comes and goes with a tap, the page turn
 * with its flip, paper themes, the chapter list from the PDF outline, and the scrubber.
 */

const BOOK = {
  src: '/stories/novella.pdf',
  title: 'A Clock for the Tide',
  author: 'Hester Lund',
  // Trade paperback, 5.5 x 8.5 in, in PDF points: the app sizes the viewer to fit one page or two
  pageWidth: 396,
  pageHeight: 612,
};

/** Space the viewer keeps around a page (the `pages` padding), so a fitted page sits centred */
const PAGE_INSET = 12;

/** Length of a page turn in ms */
const FLIP_MS = 640;

type Paper = 'white' | 'sepia' | 'night';
type Direction = 1 | -1;

interface Chapter {
  title: string;
  page: number;
}

/* --------------------------------- icons --------------------------------- */

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M12.5 4.5L7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ContentsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M7.5 5.5h9M7.5 10h9M7.5 14.5h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="4" cy="5.5" r="1" fill="currentColor" />
      <circle cx="4" cy="10" r="1" fill="currentColor" />
      <circle cx="4" cy="14.5" r="1" fill="currentColor" />
    </svg>
  );
}

/** The Leaf mark: one leaf, drawn as two arcs and a vein */
function LeafMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 13C3 7 7 3 13.5 2.5 13.5 9 9.5 13 3 13z"
        fill="currentColor"
        opacity="0.22"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M3 13l6.5-6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 2.8v1.6M10 15.6v1.6M2.8 10h1.6M15.6 10h1.6M4.9 4.9l1.1 1.1M14 14l1.1 1.1M4.9 15.1L6 14M14 6l1.1-1.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------ page turning ------------------------------ */

interface Slot {
  /** Page box in px, relative to the room the overlay covers */
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A face of a sheet in the overlay: a copy of a page's canvas on paper, or bare paper */
function makeFace(
  slot: Slot,
  canvas: HTMLCanvasElement | null,
  side: 'left' | 'right' | 'single',
  className: string
) {
  const face = document.createElement('div');
  face.className = className;
  face.dataset.side = side;
  Object.assign(face.style, {
    left: `${slot.left}px`,
    top: `${slot.top}px`,
    width: `${slot.width}px`,
    height: `${slot.height}px`,
  });
  if (canvas) {
    face.append(canvas);
  }
  return face;
}

/** Copies a page the viewer has drawn (controller.getPageCanvas), or null when it is not drawn yet */
function snapshot(source: HTMLCanvasElement | null) {
  if (!source || source.width === 0) {
    return null;
  }
  const copy = document.createElement('canvas');
  copy.width = source.width;
  copy.height = source.height;
  copy.getContext('2d')?.drawImage(source, 0, 0);
  copy.className = classes.sheetCanvas;
  copy.setAttribute('aria-hidden', 'true');
  return copy;
}

/* ---------------------------------- story ---------------------------------- */

/**
 * A reader opens a novella. The page is all there is; a tap in the middle brings back the bars,
 * taps on the edges, a swipe or the arrow keys turn the page over with a flip.
 */
export function Leaf() {
  const controller = useRef<DocViewerController>(null);
  const reduceMotion = useReducedMotion();
  const { ref: deskRef, width: deskWidth, height: deskHeight } = useElementSize();
  const roomRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const libraryRef = useRef<HTMLButtonElement>(null);

  const [chrome, setChrome] = useState(true);
  const [paper, setPaper] = useState<Paper>('white');
  const [brightness, setBrightness] = useState(100);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [contentsOpened, setContentsOpened] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [scrub, setScrub] = useState<number | null>(null);
  const [turning, setTurning] = useState<'flip' | 'fade' | 'jump' | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Two pages side by side when the window is wide enough for a spread to be read comfortably
  const spread = deskWidth >= 880 && deskWidth / Math.max(deskHeight, 1) >= 1.15;
  const perView = spread ? 2 : 1;

  // The viewer is sized to exactly one page (or spread) plus its inset, so 'fit-page' fills it and
  // goToPage leaves the page centred, with nothing of its neighbours in sight
  const scale =
    deskWidth && deskHeight
      ? Math.min(
          (deskWidth - PAGE_INSET * 2) / (BOOK.pageWidth * perView),
          (deskHeight - PAGE_INSET * 2) / BOOK.pageHeight
        )
      : 0;
  const bookSize = {
    width: Math.floor(BOOK.pageWidth * perView * scale + PAGE_INSET * 2),
    height: Math.floor(BOOK.pageHeight * scale + PAGE_INSET * 2),
  };

  // Pages in view: a spread starts on an odd page (1-2, 3-4, ...)
  const first = spread ? page - ((page - 1) % 2) : page;
  const visible = useMemo(
    () =>
      Array.from({ length: perView }, (_, index) => first + index).filter(
        (number) => !numPages || number <= numPages
      ),
    [first, perView, numPages]
  );
  const last = visible[visible.length - 1] ?? first;

  const chapterIndex = chapters.reduce(
    (found, chapter, index) => (chapter.page <= last ? index : found),
    -1
  );
  const chapter = chapters[chapterIndex];
  const chapterEnd = (chapters[chapterIndex + 1]?.page ?? numPages + 1) - 1;
  const pagesLeft = chapterEnd - last;

  // Busy while a turn plays; one more turn asked for meanwhile runs right after it
  const busy = useRef(false);
  const queued = useRef<Direction | null>(null);
  const state = useRef({ first, perView, numPages, reduceMotion });
  state.current = { first, perView, numPages, reduceMotion };

  const pageElement = (number: number) =>
    bookRef.current?.querySelector<HTMLElement>(`.${classes.page}[data-page-number="${number}"]`) ??
    null;

  /** Where goToPage puts the top of a page on screen: the viewer leaves PAGE_INSET above it */
  const landingTop = (fallback: HTMLElement) => {
    const body = bookRef.current?.querySelector(`.${classes.body}`);
    return body
      ? body.getBoundingClientRect().top + PAGE_INSET
      : fallback.getBoundingClientRect().top;
  };

  /** Calls `done` once the viewer has `target` drawn in place at `top`, or after a while */
  const whenSettled = (target: number, top: number, done: () => void) => {
    const start = performance.now();
    const check = () => {
      const node = pageElement(target);
      const inPlace =
        !!node &&
        node.dataset.rendered !== undefined &&
        Math.abs(node.getBoundingClientRect().top - top) < 1.5;
      if (inPlace || performance.now() - start > 900) {
        done();
      } else {
        requestAnimationFrame(check);
      }
    };
    requestAnimationFrame(check);
  };

  const finishTurn = useRef<() => void>(() => {});
  const turn = useCallback((direction: Direction) => {
    const { first: from, perView: count, numPages: total, reduceMotion: still } = state.current;
    const to = from + direction * count;
    if (!total || to < 1 || to > total) {
      return;
    }
    if (busy.current) {
      queued.current = direction;
      return;
    }

    const room = roomRef.current;
    const overlay = overlayRef.current;
    const currentNode = pageElement(from);
    if (!room || !overlay || !currentNode) {
      controller.current?.goToPage(to);
      return;
    }

    const roomBox = room.getBoundingClientRect();
    const slotOf = (node: HTMLElement): Slot => {
      const box = node.getBoundingClientRect();
      return {
        left: box.left - roomBox.left,
        top: box.top - roomBox.top,
        width: box.width,
        height: box.height,
      };
    };
    // Pages land PAGE_INSET below the top of the viewer's scroll area; the overlay draws them there
    const pageTop = landingTop(currentNode);
    const firstSlot = { ...slotOf(currentNode), top: pageTop - roomBox.top };
    const secondSlot =
      count === 2 ? { ...firstSlot, left: firstSlot.left + firstSlot.width } : null;
    const copy = (number: number) =>
      number >= 1 && number <= total
        ? snapshot(controller.current?.getPageCanvas(number) ?? null)
        : null;

    busy.current = true;
    overlay.replaceChildren();

    const done = () => {
      overlay.replaceChildren();
      setTurning(null);
      busy.current = false;
      const next = queued.current;
      queued.current = null;
      if (next) {
        requestAnimationFrame(() => turn(next));
      }
    };
    finishTurn.current = done;

    // Reduced motion: no flip, the page on screen fades into the next one
    if (still) {
      const faces = [from, from + 1]
        .slice(0, count)
        .map((number, index) =>
          makeFace(
            index === 0 ? firstSlot : secondSlot!,
            copy(number),
            count === 2 ? (index === 0 ? 'left' : 'right') : 'single',
            classes.face
          )
        );
      overlay.append(...faces);
      setTurning('fade');
      // The overlay covers the view: jump straight there underneath it
      controller.current?.goToPage(to, { behavior: 'instant' });
      whenSettled(to, pageTop, () => {
        const fade = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 160,
          easing: 'ease-out',
        });
        fade.onfinish = done;
      });
      return;
    }

    // The sheet that turns, the pages it uncovers, and the one it lands on, all copied now
    const spreadMode = count === 2;
    const sheetSlot = spreadMode ? secondSlot! : firstSlot;
    const forward = direction === 1;
    const sheetFront = spreadMode ? (forward ? from + 1 : to + 1) : forward ? from : to;
    const sheetBack = spreadMode ? (forward ? to : from) : null;
    const under = spreadMode
      ? { left: forward ? from : to, right: forward ? to + 1 : from + 1 }
      : { left: null, right: forward ? to : from };

    const front = copy(sheetFront);
    const back = sheetBack === null ? null : copy(sheetBack);
    const underRight = copy(under.right);
    const underLeft = under.left === null ? null : copy(under.left);
    const missing =
      !front ||
      (spreadMode && (!back || !underLeft) && sheetBack! <= total) ||
      (!underRight && under.right <= total);

    if (missing) {
      // Not drawn yet (a long jump, a slow device): turn without the flip
      busy.current = false;
      controller.current?.goToPage(to);
      return;
    }

    const faceSide = spreadMode ? 'right' : 'single';
    const staticFaces = [
      spreadMode ? makeFace(firstSlot, underLeft, 'left', classes.face) : null,
      makeFace(sheetSlot, underRight, faceSide, classes.face),
    ].filter((face): face is HTMLDivElement => !!face);
    // Shade cast by the lifting sheet on the page it uncovers or covers
    const shades = staticFaces.map((face) => {
      const shade = document.createElement('div');
      shade.className = classes.castShade;
      face.append(shade);
      return shade;
    });

    const sheet = document.createElement('div');
    sheet.className = classes.sheet;
    Object.assign(sheet.style, {
      left: `${sheetSlot.left}px`,
      top: `${sheetSlot.top}px`,
      width: `${sheetSlot.width}px`,
      height: `${sheetSlot.height}px`,
    });
    const frontFace = makeFace(
      { left: 0, top: 0, width: sheetSlot.width, height: sheetSlot.height },
      front,
      faceSide,
      `${classes.face} ${classes.front}`
    );
    const backFace = makeFace(
      { left: 0, top: 0, width: sheetSlot.width, height: sheetSlot.height },
      back,
      spreadMode ? 'left' : 'single',
      `${classes.face} ${classes.back}`
    );
    const frontShade = document.createElement('div');
    frontShade.className = classes.bendShade;
    frontFace.append(frontShade);
    sheet.append(backFace, frontFace);
    overlay.style.perspectiveOrigin = `${sheetSlot.left}px ${sheetSlot.top + sheetSlot.height / 2}px`;
    overlay.append(...staticFaces, sheet);

    // The viewer jumps to the new page underneath, hidden while the overlay plays
    setTurning('flip');
    controller.current?.goToPage(to, { behavior: 'instant' });

    const easing = 'cubic-bezier(0.32, 0.08, 0.24, 1)';
    const angles = forward ? [0, -180] : [-180, 0];
    const flip = sheet.animate(
      [
        { transform: `rotateY(${angles[0]}deg)` },
        { transform: `rotateY(${(angles[0] + angles[1]) / 2}deg) translateZ(18px)`, offset: 0.5 },
        { transform: `rotateY(${angles[1]}deg)` },
      ],
      { duration: FLIP_MS, easing, fill: 'forwards' }
    );
    // The faces swap when the sheet stands on edge (90 degrees, halfway through the eased turn).
    // backface-visibility alone is not enough: WebKit still draws a canvas on a hidden back face
    const edgeOn = (shown: boolean) => [
      { visibility: shown ? 'visible' : 'hidden' },
      { visibility: shown ? 'visible' : 'hidden', offset: 0.5 },
      { visibility: shown ? 'hidden' : 'visible', offset: 0.5 },
      { visibility: shown ? 'hidden' : 'visible' },
    ];
    frontFace.animate(edgeOn(forward), { duration: FLIP_MS, easing, fill: 'forwards' });
    backFace.animate(edgeOn(!forward), { duration: FLIP_MS, easing, fill: 'forwards' });
    // One page at a time, there is no left page for the sheet to land on: it fades as it leaves
    if (!spreadMode) {
      sheet.animate(
        forward
          ? [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }]
          : [{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 1 }],
        { duration: FLIP_MS, easing: 'linear', fill: 'forwards' }
      );
    }
    frontShade.animate(
      forward ? [{ opacity: 0 }, { opacity: 0.65 }] : [{ opacity: 0.65 }, { opacity: 0 }],
      { duration: FLIP_MS, easing, fill: 'forwards' }
    );
    // The page being uncovered is shaded early in the turn, the page being covered late
    shades.forEach((shade, index) => {
      const coveredLate = spreadMode && (index === 0) === forward;
      shade.animate(
        coveredLate
          ? [
              { opacity: 0 },
              { opacity: 0, offset: 0.5 },
              { opacity: 1, offset: 0.85 },
              { opacity: 0 },
            ]
          : [
              { opacity: 0 },
              { opacity: 1, offset: 0.2 },
              { opacity: 0, offset: 0.6 },
              { opacity: 0 },
            ],
        { duration: FLIP_MS, easing: 'linear' }
      );
    });
    flip.onfinish = () => whenSettled(to, pageTop, done);
  }, []);

  // Leaving the story mid-turn: stop listening for the end of it
  useEffect(() => () => finishTurn.current(), []);

  /** Goes straight to a page (the scrubber, the contents): a quick fade, no flip */
  const jump = (target: number) => {
    const node = pageElement(first);
    if (busy.current || !node || visible.includes(target)) {
      return;
    }
    busy.current = true;
    const top = landingTop(node);
    setTurning('jump');
    window.setTimeout(
      () => {
        controller.current?.goToPage(target);
        whenSettled(target, top, () => {
          setTurning(null);
          busy.current = false;
        });
      },
      reduceMotion ? 0 : 140
    );
  };

  const hideChrome = () => {
    setChrome(false);
    setSettingsOpened(false);
    setContentsOpened(false);
  };

  // Escape brings the bars back; so does Tab, before the focus moves, so it lands in the top bar
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (chrome) {
        return;
      }
      if (event.key === 'Tab') {
        // The bars stop being inert at once, and the focus starts at the top of the app
        event.preventDefault();
        flushSync(() => setChrome(true));
        libraryRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [chrome]);

  // Keys turn pages from anywhere but the bars' own controls (the scrubber, menus, the theme picker)
  const fromControl = (event: KeyboardEvent) =>
    event.target instanceof Element &&
    !!event.target.closest(`.${classes.bar}, .${classes.dropdown}, [role="menu"]`);
  const turnByKey = (direction: Direction) => (event: KeyboardEvent) => {
    if (fromControl(event)) {
      return;
    }
    event.preventDefault();
    turn(direction);
  };
  useHotkeys(
    [
      ['ArrowRight', turnByKey(1)],
      ['ArrowLeft', turnByKey(-1)],
      ['PageDown', turnByKey(1)],
      ['PageUp', turnByKey(-1)],
      ['Escape', () => setChrome(true)],
    ],
    ['INPUT', 'TEXTAREA', 'SELECT'],
    true
  );

  // A sideways swipe anywhere on the page turns it; the click that ends a swipe is not a tap
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false);
  const onPointerDown = (event: React.PointerEvent) => {
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    swiped.current = false;
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) {
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swiped.current = true;
      hideChrome();
      turn(dx < 0 ? 1 : -1);
    }
  };
  const tap = (action: () => void) => () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    action();
  };

  // Announced politely once the turn has landed, not for every page passed on the way
  useEffect(() => {
    if (!numPages || turning) {
      return;
    }
    setAnnouncement(
      visible.length === 2
        ? `Pages ${visible[0]} and ${visible[1]} of ${numPages}`
        : `Page ${visible[0]} of ${numPages}`
    );
  }, [visible, numPages, turning]);

  const pageLabel =
    visible.length === 2 ? `Pages ${visible[0]}–${visible[1]}` : `Page ${visible[0]}`;
  const leftLabel =
    !numPages || !chapter
      ? ''
      : pagesLeft <= 0
        ? 'Last page in this chapter'
        : `${pagesLeft} ${pagesLeft === 1 ? 'page' : 'pages'} left in chapter`;

  return (
    <div
      className={classes.app}
      data-paper={paper}
      data-chrome={chrome || undefined}
      data-turning={turning ?? undefined}
    >
      <div ref={roomRef} className={classes.room}>
        <div ref={deskRef} className={classes.desk}>
          {scale > 0 && (
            <div ref={bookRef} className={classes.book} style={bookSize}>
              <DocViewer
                src={BOOK.src}
                fileName={BOOK.title}
                pdfWorkerSrc={pdfWorkerSrc}
                controllerRef={controller}
                withToolbar={false}
                variant="plain"
                radius={0}
                pageGap={0}
                pageBackground="var(--leaf-paper)"
                // The app picks one page or a spread from the window; the page stays when it changes
                pageLayout={spread ? 'two-page' : 'single'}
                defaultZoom="fit-page"
                // The app turns the pages
                withScroll={false}
                onDocumentLoad={(info) => {
                  setNumPages(info.numPages ?? 0);
                  controller.current
                    ?.getOutline()
                    .then((items) =>
                      setChapters(
                        items
                          .filter((item) => item.page !== null)
                          .map((item) => ({ title: item.title, page: item.page! }))
                      )
                    );
                }}
                onPageChange={setPage}
                // The gutter: pages darken a little towards the spine
                renderPageOverlay={({ pageNumber }) => (
                  <div
                    className={classes.gutter}
                    data-side={spread ? (pageNumber % 2 ? 'left' : 'right') : 'single'}
                  />
                )}
                classNames={{
                  root: classes.viewer,
                  body: classes.body,
                  pages: classes.pages,
                  page: classes.page,
                  canvas: classes.canvas,
                }}
              />
            </div>
          )}
        </div>

        {/* The flip is drawn here, over the viewer, from copies of the pages' canvases */}
        <div ref={overlayRef} className={classes.overlay} aria-hidden />

        {/* Taps: the edges turn, the middle shows and hides the bars */}
        <div
          className={classes.zones}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipe.current = null;
          }}
        >
          <button
            type="button"
            className={classes.zone}
            data-zone="previous"
            aria-label="Previous page"
            disabled={first <= 1}
            onClick={tap(() => {
              hideChrome();
              turn(-1);
            })}
          />
          <button
            type="button"
            className={classes.zone}
            data-zone="middle"
            aria-label={chrome ? 'Hide reading controls' : 'Show reading controls'}
            onClick={tap(() => (chrome ? hideChrome() : setChrome(true)))}
          />
          <button
            type="button"
            className={classes.zone}
            data-zone="next"
            aria-label="Next page"
            disabled={!!numPages && last >= numPages}
            onClick={tap(() => {
              hideChrome();
              turn(1);
            })}
          />
        </div>
      </div>

      <header className={`${classes.bar} ${classes.top}`} inert={!chrome}>
        <button
          ref={libraryRef}
          type="button"
          className={classes.library}
          aria-label="Back to library"
        >
          <BackIcon />
          <span className={classes.libraryLabel}>Library</span>
        </button>

        <div className={classes.heading}>
          <div className={classes.bookTitle}>{BOOK.title}</div>
          <div className={classes.bookAuthor}>{chapter ? chapter.title : BOOK.author}</div>
        </div>

        <div className={classes.actions}>
          <Menu
            opened={contentsOpened}
            onChange={setContentsOpened}
            position="bottom-end"
            offset={6}
            width={280}
            withinPortal={false}
            classNames={{
              dropdown: classes.dropdown,
              item: classes.menuItem,
              label: classes.menuLabel,
            }}
          >
            <Menu.Target>
              <ActionIcon
                className={classes.action}
                variant="transparent"
                size="lg"
                aria-label="Contents"
              >
                <ContentsIcon />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Contents</Menu.Label>
              {chapters.map((item, index) => (
                <Menu.Item
                  key={item.title}
                  data-current={index === chapterIndex || undefined}
                  aria-current={index === chapterIndex ? 'location' : undefined}
                  rightSection={<span className={classes.menuPage}>{item.page}</span>}
                  onClick={() => jump(item.page)}
                >
                  {item.title}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>

          <Popover
            opened={settingsOpened}
            onChange={setSettingsOpened}
            position="bottom-end"
            offset={6}
            width={264}
            withinPortal={false}
            trapFocus
            classNames={{ dropdown: classes.dropdown }}
          >
            <Popover.Target>
              <ActionIcon
                className={classes.action}
                variant="transparent"
                size="lg"
                aria-label="Reading settings"
                aria-expanded={settingsOpened}
                onClick={() => setSettingsOpened((opened) => !opened)}
              >
                <span className={classes.aa} aria-hidden>
                  Aa
                </span>
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown aria-label="Reading settings">
              <div className={classes.settingLabel} id="leaf-paper">
                Page
              </div>
              <SegmentedControl
                fullWidth
                aria-labelledby="leaf-paper"
                value={paper}
                onChange={(value) => setPaper(value as Paper)}
                data={[
                  { value: 'white', label: 'White' },
                  { value: 'sepia', label: 'Sepia' },
                  { value: 'night', label: 'Night' },
                ]}
                classNames={{
                  root: classes.papers,
                  indicator: classes.paperIndicator,
                  label: classes.paperLabel,
                }}
              />
              <div className={classes.settingLabel} id="leaf-brightness">
                Brightness
              </div>
              <div className={classes.brightness}>
                <SunIcon size={14} />
                <Slider
                  aria-labelledby="leaf-brightness"
                  min={50}
                  max={100}
                  value={brightness}
                  onChange={setBrightness}
                  label={null}
                  size="sm"
                  classNames={{
                    root: classes.slider,
                    track: classes.sliderTrack,
                    bar: classes.sliderBar,
                    thumb: classes.sliderThumb,
                  }}
                />
                <SunIcon size={20} />
              </div>
            </Popover.Dropdown>
          </Popover>
        </div>
      </header>

      <footer className={`${classes.bar} ${classes.bottom}`} inert={!chrome}>
        <Slider
          aria-label="Page"
          min={1}
          max={Math.max(numPages, 2)}
          value={scrub ?? first}
          onChange={setScrub}
          onChangeEnd={(value) => {
            setScrub(null);
            jump(value);
          }}
          label={(value) => `Page ${value}`}
          marks={chapters.map((item) => ({ value: item.page }))}
          size="xs"
          disabled={!numPages}
          classNames={{
            root: classes.slider,
            track: classes.sliderTrack,
            bar: classes.sliderBar,
            thumb: classes.sliderThumb,
            mark: classes.sliderMark,
            label: classes.sliderLabel,
          }}
        />
        <div className={classes.progress}>
          <span>{numPages ? `${pageLabel} of ${numPages}` : 'Opening…'}</span>
          <span className={classes.brand}>
            <LeafMark />
          </span>
          <span>{leftLabel}</span>
        </div>
      </footer>

      {/* Brightness dims the room like a screen would; a filter on the room would flatten the flip */}
      <div className={classes.dim} style={{ opacity: (100 - brightness) / 100 }} aria-hidden />

      <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
    </div>
  );
}
