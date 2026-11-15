import { useCallbackRef } from '@mantine/hooks';
import { useEffect, useImperativeHandle, useRef } from 'react';
import type { DocType } from './detect-doc-type';
import type { DocViewerPageLayout } from './DocViewer';
import type { DocViewerPageRect } from './pdf/page-points';

/** A scale where 1 is 100%, or `'fit'`: fit to width for PDFs, fit to the view for images */
export type DocViewerZoom = number | 'fit';

/** Actions available through `controllerRef`. Actions that do not apply to the current document do nothing */
export interface DocViewerController {
  /** Scrolls a PDF to a page, counted from 1, or to a point in it with `{ top }` */
  goToPage: (page: number, options?: DocViewerGoToPageOptions) => void;

  /**
   * Highlights a passage of a PDF in the colours of the active search match, and scrolls to it. A
   * new highlight replaces the one before. Searching does not clear it, `clearHighlight` does
   */
  highlight: (target: DocViewerHighlightTarget) => void;

  /** Removes the highlight made with `highlight` */
  clearHighlight: () => void;

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

  /** Starts a PDF presentation (full screen, one page at a time), or ends it */
  togglePresentation: () => void;

  /** Opens the PDF page editor (needs `withPageEditing`) */
  editPages: () => void;

  /** The PDF's outline (bookmarks) with page numbers, empty for other documents and PDFs without one */
  getOutline: () => Promise<DocViewerOutlineItem[]>;

  /** Opens the browser print dialog for the document */
  print: () => Promise<void>;

  /** Downloads the document */
  download: () => void;

  /** Shows the viewer full screen, or leaves full screen */
  toggleFullscreen: () => Promise<void>;

  /** Whether `print` does something now: true once a PDF, image or text file has loaded. Read it when your app renders, for example after `onDocumentLoad` */
  readonly canPrint: boolean;

  /** Type of the document that is shown, `'unknown'` for files the viewer cannot show itself */
  readonly type: DocType;

  /** Forgets how much of the PDF has been seen, for the next reader. `onReadingProgress` is called with the empty progress, and `onReachEnd` can be called again */
  resetReadingProgress: () => void;
}

/** How far a reader has got through a PDF */
export interface DocViewerReadingProgress {
  /** Fraction of each page that has been on screen, from 0 to 1, in page order: `seen[0]` is page 1 */
  seen: number[];

  /** How far the view is scrolled through the document, from 0 at the start to 1 at the end */
  position: number;

  /** True once the bottom of the last page has been on screen */
  reachedEnd: boolean;
}

export interface DocViewerGoToPageOptions {
  /**
   * Point to scroll to, in px at 100% (PDF points) down from the top of the page, in the
   * coordinates of `renderPageOverlay`. It is placed at the top of the view. Pages the reader
   * rotated use the point on their left edge
   */
  top?: number;
}

/** What `highlight` marks: the first place a text is found, or boxes on a page */
export type DocViewerHighlightTarget =
  | {
      /** Text to find. Upper and lower case and accents are ignored unless `matchCase` is set */
      text: string;

      /** Page to look on, counted from 1. The whole document is searched when it is not set */
      page?: number;

      /** Determines whether upper and lower case must match, `false` by default */
      matchCase?: boolean;
    }
  | {
      /** Page the boxes are on, counted from 1 */
      page: number;

      /** Boxes to mark, in the coordinates of `renderPageOverlay` */
      rects: DocViewerPageRect[];
    };

export interface DocViewerOutlineItem {
  title: string;

  /** Page the item goes to, counted from 1, or null for web links and broken destinations */
  page: number | null;

  /** Web address, for items that link outside the document */
  url: string | null;
  items: DocViewerOutlineItem[];
}

export interface DocViewerLoadInfo {
  type: DocType;

  /** Number of pages of a PDF */
  numPages?: number;

  /** Natural size of an image in px */
  width?: number;
  height?: number;

  /** Size of the file in bytes, for PDFs and text, when the server says how large it is */
  byteSize?: number;

  /** MIME type: the `mimeType` prop, or what the server sent for text, or `application/pdf` for PDFs. Not set when unknown */
  mimeType?: string;

  /** Title from the PDF's document information, when it has one */
  title?: string;
}

/** What `onDocumentLoadStart` reports */
export interface DocViewerLoadStartInfo {
  type: DocType;
  src: string;
}

export interface DocViewerEvents {
  /** Called when a document starts loading: on first render, and again when `src` changes. Use it to reset the app's own loading state */
  onDocumentLoadStart?: (info: DocViewerLoadStartInfo) => void;
  onDocumentLoad?: (info: DocViewerLoadInfo) => void;
  onDocumentError?: (error: Error) => void;
  onPageChange?: (page: number) => void;
  onZoomChange?: (scale: number, fitted: boolean) => void;

  /** Called when how much of a PDF has been seen changes: the fraction seen of each page, the scroll position and whether the end was reached. Pages that were scrolled past count too, so check `seen` to tell a skim from a read */
  onReadingProgress?: (progress: DocViewerReadingProgress) => void;

  /** Called once when the bottom of the last page of a PDF is on screen. Call `controllerRef.resetReadingProgress()` to allow it again */
  onReachEnd?: () => void;

  /** Called when a web link in a PDF is clicked, before it opens in a new tab. Call `event.preventDefault()` to stop it */
  onLinkClick?: (url: string, event: MouseEvent) => void;

  /**
   * Called when the reader has selected text in a PDF, with the text, the page it starts on
   * (counted from 1) and its boxes on that page, in the coordinates of `renderPageOverlay`. Not
   * called when the selection is cleared
   */
  onTextSelect?: (text: string, page: number, rects: DocViewerPageRect[]) => void;
}

/** What views put into the registry: the actions, and functions that answer for `canPrint` and `type` */
export type ControllerImplementation = Partial<
  Omit<DocViewerController, 'canPrint' | 'type'> & {
    isPrintable: () => boolean;
    getType: () => DocType;
  }
>;

/** Registry that views put their actions into, and that `controllerRef` reads from */
export function useControllerRegistry(controllerRef: React.Ref<DocViewerController> | undefined) {
  const implementation = useRef<ControllerImplementation>({});

  const call =
    <K extends Exclude<keyof DocViewerController, 'canPrint' | 'type'>>(name: K) =>
    (...args: Parameters<DocViewerController[K]>) =>
      (implementation.current[name] as ((...a: unknown[]) => unknown) | undefined)?.(...args);

  useImperativeHandle(
    controllerRef,
    () => ({
      goToPage: call('goToPage'),
      highlight: call('highlight'),
      clearHighlight: call('clearHighlight'),
      setZoom: call('setZoom'),
      zoomIn: call('zoomIn'),
      zoomOut: call('zoomOut'),
      setPageLayout: call('setPageLayout'),
      rotate: call('rotate'),
      openSearch: call('openSearch'),
      closeSearch: call('closeSearch'),
      toggleThumbnails: call('toggleThumbnails'),
      togglePresentation: call('togglePresentation'),
      editPages: call('editPages'),
      print: async () => {
        await implementation.current.print?.();
      },
      download: call('download'),
      getOutline: async () => (await implementation.current.getOutline?.()) ?? [],
      toggleFullscreen: async () => {
        await implementation.current.toggleFullscreen?.();
      },
      get canPrint() {
        return implementation.current.isPrintable?.() ?? false;
      },
      get type() {
        return implementation.current.getType?.() ?? 'unknown';
      },
      resetReadingProgress: call('resetReadingProgress'),
    }),
    []
  );

  return implementation;
}

/** Puts a view's actions into the registry, always the latest ones, and takes them out on unmount */
export function useRegisterController(
  registry: React.RefObject<ControllerImplementation>,
  actions: ControllerImplementation
) {
  const latest = useRef(actions);
  latest.current = actions;

  useEffect(() => {
    const names = Object.keys(latest.current) as (keyof ControllerImplementation)[];
    const current = registry.current;
    names.forEach((name) => {
      (current as Record<string, unknown>)[name] = (...args: unknown[]) =>
        (latest.current[name] as ((...a: unknown[]) => unknown) | undefined)?.(...args);
    });

    return () => names.forEach((name) => delete current[name]);
    // Registered once per view; calls go through `latest`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registry]);
}

/** Stable callback that always calls the latest event prop */
export const useEventProp = useCallbackRef;
