import { useState } from 'react';
import { createStore, MantineStore, useStore } from '@mantine/store';
import type {
  DocViewerGoToPageOptions,
  DocViewerHighlightTarget,
  DocViewerLoadInfo,
  DocViewerOutlineItem,
  DocViewerPageLayout,
  DocViewerThumbnailsPosition,
  DocViewerZoom,
} from './doc-viewer.types';
import { getControllerRegistry } from './hooks/use-controller-registry';
import type { DocViewerType } from './utils/get-doc-viewer-type';
import { getNextPage } from './utils/spreads';

export interface DocViewerState {
  /** Type of the document that is shown, `'unknown'` for files the viewer cannot show itself */
  type: DocViewerType;

  /** `'unsupported'` for unknown files and for PDF or markdown files without an adapter */
  status: 'loading' | 'ready' | 'error' | 'password' | 'unsupported';

  /** What the document reported when it loaded, null until then */
  info: DocViewerLoadInfo | null;

  /** Why the document could not be shown, null unless `status` is `'error'` */
  error: Error | null;

  /** Number of pages of a PDF, 0 for other documents and while loading */
  numPages: number;

  /** Page of a PDF in view, counted from 1 */
  page: number;

  /** Spread of a PDF in view, counted from 1, and its pages. Replaced only when it changes */
  spread: { index: number; pages: number[] };

  /** Zoom of a PDF or image as it was requested */
  zoom: DocViewerZoom;

  /** Scale the zoom gives, where 1 is 100% */
  scale: number;

  /** Rotation of the view in degrees */
  rotation: number;

  /** Layout of PDF pages */
  pageLayout: DocViewerPageLayout;

  /** True while a `DocViewer.Thumbnails` part is mounted */
  thumbnailsAvailable: boolean;
  thumbnailsOpened: boolean;
  thumbnailsPosition: DocViewerThumbnailsPosition;
  /** True while a `DocViewer.Search` part is mounted */
  searchAvailable: boolean;
  searchOpened: boolean;
  presenting: boolean;
  fullscreen: boolean;

  /** Whether `print` does something now: true once a PDF, image or text file has loaded */
  canPrint: boolean;

  /** Whether long lines of text files wrap */
  textWrap: boolean;

  /** Rendered markdown (or JSON tree) or its source */
  viewMode: 'preview' | 'source';

  /** True while a view with a preview and a source is shown: markdown, or JSON that parses */
  viewModeAvailable: boolean;

  /** `'read'`, or the mode of an extension screen such as `'edit-pages'` */
  mode: 'read' | (string & {});

  /** Markup tool in use, written by the markup extension */
  markupTool: string | null;
}

export type DocViewerStore = MantineStore<DocViewerState>;

/** Actions on one viewer. Actions that do not apply to the current document, or that are called before the document is shown, do nothing */
export interface DocViewerActions {
  /** Scrolls a PDF to a page, counted from 1, or to a point in it with `{ top }` */
  goToPage: (page: number, options?: DocViewerGoToPageOptions) => void;

  /** Highlights a passage of a PDF in the colours of the active search match, and scrolls to it */
  highlight: (target: DocViewerHighlightTarget) => void;

  /** Removes the highlight made with `highlight` */
  clearHighlight: () => void;

  /** Scrolls a PDF to a spread, counted from 1 */
  goToSpread: (spread: number) => void;

  /** Turns a PDF to the next spread; with `loop` the last spread is followed by the first */
  nextSpread: (options?: { loop?: boolean }) => void;

  /** Turns a PDF back to the previous spread */
  previousSpread: () => void;

  /** Sets the zoom of a PDF or image */
  setZoom: (zoom: DocViewerZoom) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  /** Lays PDF pages out: single, two-page, two-page-cover, horizontal or wrapped */
  setPageLayout: (layout: DocViewerPageLayout) => void;

  /** Turns an image or PDF pages 90° clockwise */
  rotate: () => void;

  /** Opens PDF search, with `query` typed in when it is set */
  openSearch: (query?: string) => void;
  closeSearch: () => void;

  /** Shows or hides PDF page thumbnails, toggles them when `opened` is not set */
  toggleThumbnails: (opened?: boolean) => void;

  /** Moves PDF page thumbnails to a side of the viewer */
  setThumbnailsPosition: (position: DocViewerThumbnailsPosition) => void;

  /** Starts a PDF presentation (full screen, one page at a time), or ends it */
  togglePresentation: () => void;

  /** The PDF's outline (bookmarks) with page numbers, empty for other documents */
  getOutline: () => Promise<DocViewerOutlineItem[]>;

  /** The bytes of the document as shown, null for other documents and while loading */
  getBytes: () => Promise<Uint8Array | null>;

  /** The canvas a PDF page is drawn on, or null while it is not drawn. Read it, do not draw on it */
  getPageCanvas: (page: number) => HTMLCanvasElement | null;

  /** Opens the browser print dialog for the document */
  print: () => Promise<void>;

  /** Downloads the document */
  download: () => void;

  /** Shows the viewer full screen, or leaves full screen */
  toggleFullscreen: () => Promise<void>;

  /** Forgets how much of the PDF has been seen, for the next reader */
  resetReadingProgress: () => void;
}

const INITIAL_STATE: DocViewerState = {
  type: 'unknown',
  status: 'loading',
  info: null,
  error: null,
  numPages: 0,
  page: 1,
  spread: { index: 1, pages: [1] },
  zoom: 'fit',
  scale: 1,
  rotation: 0,
  pageLayout: 'single',
  thumbnailsAvailable: false,
  thumbnailsOpened: false,
  thumbnailsPosition: 'left',
  searchAvailable: false,
  searchOpened: false,
  presenting: false,
  fullscreen: false,
  canPrint: false,
  textWrap: true,
  viewMode: 'preview',
  viewModeAvailable: false,
  mode: 'read',
  markupTool: null,
};

/** Creates the store of one viewer, pass it to `DocViewer.Root` or `DocViewer` as `store` */
export const createDocViewerStore = (): DocViewerStore => createStore({ ...INITIAL_STATE });

/** Subscribes to a viewer store and returns its current state */
export const useDocViewerStore = (store: DocViewerStore) => useStore(store);

/** Writes part of the state, for the viewer's own parts and extensions */
export function updateDocViewerStateAction(update: Partial<DocViewerState>, store: DocViewerStore) {
  store.setState({ ...store.getState(), ...update });
}

function call(store: DocViewerStore) {
  return getControllerRegistry(store).current;
}

export function goToPageAction(
  page: number,
  options: DocViewerGoToPageOptions | undefined,
  store: DocViewerStore
) {
  call(store).goToPage?.(page, options);
}

export function nextSpreadAction(options: { loop?: boolean } | undefined, store: DocViewerStore) {
  if (!options?.loop) {
    call(store).nextSpread?.();
    return;
  }
  const { page, numPages, pageLayout } = store.getState();
  const next = getNextPage(page, numPages, pageLayout, true);
  numPages > 0 && call(store).goToPage?.(next!);
}

export function toggleThumbnailsAction(opened: boolean | undefined, store: DocViewerStore) {
  updateDocViewerStateAction(
    { thumbnailsOpened: opened ?? !store.getState().thumbnailsOpened },
    store
  );
}

export function setThumbnailsPositionAction(
  position: DocViewerThumbnailsPosition,
  store: DocViewerStore
) {
  updateDocViewerStateAction({ thumbnailsPosition: position }, store);
}

export async function getOutlineAction(store: DocViewerStore) {
  return (await call(store).getOutline?.()) ?? [];
}

export async function getBytesAction(store: DocViewerStore) {
  return (await call(store).getBytes?.()) ?? null;
}

export function getPageCanvasAction(page: number, store: DocViewerStore) {
  return call(store).getPageCanvas?.(page) ?? null;
}

export async function printAction(store: DocViewerStore) {
  await call(store).print?.();
}

export async function toggleFullscreenAction(store: DocViewerStore) {
  await call(store).toggleFullscreen?.();
}

/** Actions with the store as their last argument, like `lightboxActions` */
export const docViewerActions = {
  goToPage: goToPageAction,
  highlight: (target: DocViewerHighlightTarget, store: DocViewerStore) =>
    call(store).highlight?.(target),
  clearHighlight: (store: DocViewerStore) => call(store).clearHighlight?.(),
  goToSpread: (spread: number, store: DocViewerStore) => call(store).goToSpread?.(spread),
  nextSpread: nextSpreadAction,
  previousSpread: (store: DocViewerStore) => call(store).previousSpread?.(),
  setZoom: (zoom: DocViewerZoom, store: DocViewerStore) => call(store).setZoom?.(zoom),
  zoomIn: (store: DocViewerStore) => call(store).zoomIn?.(),
  zoomOut: (store: DocViewerStore) => call(store).zoomOut?.(),
  setPageLayout: (layout: DocViewerPageLayout, store: DocViewerStore) =>
    call(store).setPageLayout?.(layout),
  rotate: (store: DocViewerStore) => call(store).rotate?.(),
  openSearch: (query: string | undefined, store: DocViewerStore) => call(store).openSearch?.(query),
  closeSearch: (store: DocViewerStore) => call(store).closeSearch?.(),
  toggleThumbnails: toggleThumbnailsAction,
  setThumbnailsPosition: setThumbnailsPositionAction,
  togglePresentation: (store: DocViewerStore) => call(store).togglePresentation?.(),
  getOutline: getOutlineAction,
  getBytes: getBytesAction,
  getPageCanvas: getPageCanvasAction,
  print: printAction,
  download: (store: DocViewerStore) => call(store).download?.(),
  toggleFullscreen: toggleFullscreenAction,
  resetReadingProgress: (store: DocViewerStore) => call(store).resetReadingProgress?.(),
  updateState: updateDocViewerStateAction,
};

/** Creates a viewer store and the actions bound to it, for a viewer controlled from outside React too */
export function createDocViewer() {
  const store = createDocViewerStore();
  const a = docViewerActions;
  const actions: DocViewerActions = {
    goToPage: (page, options) => a.goToPage(page, options, store),
    highlight: (target) => a.highlight(target, store),
    clearHighlight: () => a.clearHighlight(store),
    goToSpread: (spread) => a.goToSpread(spread, store),
    nextSpread: (options) => a.nextSpread(options, store),
    previousSpread: () => a.previousSpread(store),
    setZoom: (zoom) => a.setZoom(zoom, store),
    zoomIn: () => a.zoomIn(store),
    zoomOut: () => a.zoomOut(store),
    setPageLayout: (layout) => a.setPageLayout(layout, store),
    rotate: () => a.rotate(store),
    openSearch: (query) => a.openSearch(query, store),
    closeSearch: () => a.closeSearch(store),
    toggleThumbnails: (opened) => a.toggleThumbnails(opened, store),
    setThumbnailsPosition: (position) => a.setThumbnailsPosition(position, store),
    togglePresentation: () => a.togglePresentation(store),
    getOutline: () => a.getOutline(store),
    getBytes: () => a.getBytes(store),
    getPageCanvas: (page) => a.getPageCanvas(page, store),
    print: () => a.print(store),
    download: () => a.download(store),
    toggleFullscreen: () => a.toggleFullscreen(store),
    resetReadingProgress: () => a.resetReadingProgress(store),
  };
  return [store, actions] as const;
}

/** A viewer store and its actions, created once for the component that calls it */
export function useDocViewer() {
  return useState(createDocViewer)[0];
}
