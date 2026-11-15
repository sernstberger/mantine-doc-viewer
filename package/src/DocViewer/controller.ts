import { useCallbackRef } from '@mantine/hooks';
import { useEffect, useImperativeHandle, useRef } from 'react';
import type { DocType } from './detect-doc-type';
import type { DocViewerPageLayout } from './DocViewer';

/** A scale where 1 is 100%, or `'fit'`: fit to width for PDFs, fit to the view for images */
export type DocViewerZoom = number | 'fit';

/** Actions available through `controllerRef`. Actions that do not apply to the current document do nothing */
export interface DocViewerController {
  /** Scrolls a PDF to a page, counted from 1 */
  goToPage: (page: number) => void;

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
}

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

  /** Called when a web link in a PDF is clicked, before it opens in a new tab. Call `event.preventDefault()` to stop it */
  onLinkClick?: (url: string, event: MouseEvent) => void;
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
