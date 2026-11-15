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
}

export interface DocViewerEvents {
  onDocumentLoad?: (info: DocViewerLoadInfo) => void;
  onDocumentError?: (error: Error) => void;
  onPageChange?: (page: number) => void;
  onZoomChange?: (scale: number, fitted: boolean) => void;

  /** Called when a web link in a PDF is clicked, before it opens in a new tab. Call `event.preventDefault()` to stop it */
  onLinkClick?: (url: string, event: MouseEvent) => void;

  /**
   * Called when the reader has selected text in a PDF, with the text, the page it starts on
   * (counted from 1) and its boxes on that page, in the coordinates of `renderPageOverlay`. Not
   * called when the selection is cleared
   */
  onTextSelect?: (text: string, page: number, rects: DocViewerPageRect[]) => void;
}

export type ControllerImplementation = Partial<DocViewerController>;

/** Registry that views put their actions into, and that `controllerRef` reads from */
export function useControllerRegistry(controllerRef: React.Ref<DocViewerController> | undefined) {
  const implementation = useRef<ControllerImplementation>({});

  const call =
    <K extends keyof DocViewerController>(name: K) =>
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
    const names = Object.keys(latest.current) as (keyof DocViewerController)[];
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
