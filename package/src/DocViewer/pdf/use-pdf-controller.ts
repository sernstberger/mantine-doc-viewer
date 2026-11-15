import type { PDFDocumentProxy } from 'pdfjs-dist';
import type React from 'react';
import { useRegisterController, type ControllerImplementation } from '../controller';
import { zoomIn, zoomOut } from '../zoom';
import { clampPage } from './geometry';
import { getResolvedOutline } from './PdfOutline';
import type { usePassageHighlight } from './use-passage-highlight';
import type { usePdfSearchBar } from './use-pdf-search-bar';
import { toPdfZoom, type PdfZoom } from './zoom';

type Actions = ControllerImplementation;

interface PdfControllerInput {
  controller: React.RefObject<ControllerImplementation>;
  /** The loaded document, or null while it loads or after it failed */
  document: PDFDocumentProxy | null;
  numPages: number;
  scale: number;
  scrollRoot: HTMLElement | null;
  withPageEditing: boolean | undefined;
  goToPage: (
    page: number,
    withAnnouncement: boolean,
    top?: number,
    behavior?: 'smooth' | 'instant'
  ) => void;
  setZoom: (zoom: PdfZoom) => void;
  setEditing: (editing: boolean) => void;
  toggleThumbnails: (opened?: boolean) => void;
  togglePresentation: () => void;
  passage: Pick<ReturnType<typeof usePassageHighlight>, 'highlight' | 'clear'>;
  search: Pick<ReturnType<typeof usePdfSearchBar>, 'open' | 'close' | 'opened'>;
  /** Actions passed through as they are */
  actions: Pick<
    Actions,
    | 'goToSpread'
    | 'nextSpread'
    | 'previousSpread'
    | 'setPageLayout'
    | 'rotate'
    | 'setMarkupTool'
    | 'saveMarkup'
    | 'print'
    | 'resetReadingProgress'
  >;
}

/** The controller actions of a PDF; the ones that need the document do nothing until it loads */
export function usePdfController(input: PdfControllerInput) {
  const { document, numPages, scale, passage, search } = input;
  const ready = !!document;

  useRegisterController(input.controller, {
    ...input.actions,
    goToPage: (page, options) =>
      ready && input.goToPage(clampPage(page, numPages), true, options?.top, options?.behavior),
    highlight: (target) => ready && passage.highlight(target),
    clearHighlight: passage.clear,
    setZoom: (next) => input.setZoom(toPdfZoom(next)),
    zoomIn: () => input.setZoom(zoomIn(scale)),
    zoomOut: () => input.setZoom(zoomOut(scale)),
    openSearch: (query) => ready && search.open(query),
    closeSearch: () => search.opened && search.close(),
    toggleThumbnails: input.toggleThumbnails,
    getOutline: async () =>
      document ? getResolvedOutline(document, await document.getOutline().catch(() => null)) : [],
    editPages: () => {
      input.withPageEditing && ready && input.setEditing(true);
    },
    togglePresentation: () => {
      ready && input.togglePresentation();
    },
    getBytes: async () => (document ? document.getData() : null),
    // Only a page element carries data-rendered, once its canvas holds the drawn page
    getPageCanvas: (page) =>
      input.scrollRoot?.querySelector<HTMLCanvasElement>(
        `[data-page-number="${page}"][data-rendered] canvas`
      ) ?? null,
    isPrintable: () => ready,
  });
}
