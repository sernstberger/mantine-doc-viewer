import { useCallbackRef } from '@mantine/hooks';
import { useEffect, useRef } from 'react';
import type { DocViewerActions, DocViewerStore } from '../doc-viewer.store';
import type {
  DocViewerLoadInfo,
  DocViewerPageLayout,
  DocViewerReadingProgress,
  DocViewerZoom,
} from '../doc-viewer.types';
import type { DocViewerType } from '../utils/get-doc-viewer-type';
import type { DocViewerMarkupTool } from '../utils/markup';
import type { DocViewerPageRect } from '../utils/page-points';

export type {
  DocViewerGoToPageOptions,
  DocViewerHighlightTarget,
  DocViewerLoadInfo,
  DocViewerOutlineItem,
  DocViewerReadingProgress,
  DocViewerZoom,
} from '../doc-viewer.types';

/** What the views report, to Root's callbacks and to the store */
export interface DocViewerEvents {
  onDocumentLoadStart?: (info: { type: DocViewerType; src: string }) => void;
  onDocumentLoad?: (info: DocViewerLoadInfo) => void;
  onDocumentError?: (error: Error) => void;
  onPageChange?: (page: number) => void;
  onSpreadChange?: (spread: number, pages: number[]) => void;
  onZoomChange?: (zoom: DocViewerZoom, details: { scale: number }) => void;
  onPageLayoutChange?: (layout: DocViewerPageLayout) => void;
  onReadingProgress?: (progress: DocViewerReadingProgress) => void;
  onReachEnd?: () => void;
  onLinkClick?: (url: string, event: MouseEvent) => void;
  onTextSelect?: (text: string, details: { page: number; rects: DocViewerPageRect[] }) => void;
}

/** What views put into the registry: the actions, the extension actions, and `isPrintable` */
export type ControllerImplementation = Partial<
  Omit<DocViewerActions, 'nextSpread'> & {
    nextSpread: () => void;
    editPages: () => void;
    closePageEditor: () => void;
    setMarkupTool: (tool: DocViewerMarkupTool | null) => void;
    saveMarkup: () => Promise<void>;
    isPrintable: () => boolean;
  }
>;

const registries = new WeakMap<DocViewerStore, React.RefObject<ControllerImplementation>>();

/** The registry of a store: the actions its views registered */
export function getControllerRegistry(store: DocViewerStore) {
  let registry = registries.get(store);
  if (!registry) {
    registry = { current: {} };
    registries.set(store, registry);
  }
  return registry;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registry]);
}

/** Stable callback that always calls the latest event prop */
export const useEventProp = useCallbackRef;
