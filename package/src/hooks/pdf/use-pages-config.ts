import { shallowEqual, useIsomorphicEffect } from '@mantine/hooks';
import { createContext, use, useMemo, useSyncExternalStore } from 'react';
import type { DocViewerContextValue } from '../../doc-viewer.context';
import type { DocViewerPageTurning } from '../../utils/spreads';
import type { DocViewerEvents, DocViewerPagesEvents } from '../use-controller-registry';

/** What `DocViewer.Pages` hands the PDF session, which runs above it */
export interface PdfPagesConfig {
  withPageTurning?: boolean | DocViewerPageTurning;
  withScrollSnap?: boolean;
  withScroll?: boolean;
}

/** The registry of one PDF session, where its `DocViewer.Pages` puts its options and handlers */
export interface PdfPagesRegistry {
  config: PdfPagesConfig;
  handlers: DocViewerPagesEvents;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
}

/** The context the PDF session hooks read: the Root context with the options and reading events of the pages */
export type PdfPagesContextValue = DocViewerContextValue &
  PdfPagesConfig & {
    events: Required<DocViewerEvents> & Required<DocViewerPagesEvents>;
  };

export function createPagesRegistry(): PdfPagesRegistry {
  const listeners = new Set<() => void>();
  return {
    config: {},
    handlers: {},
    listeners,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const PdfPagesRegistryContext = createContext<PdfPagesRegistry | null>(null);

function sameConfig(a: PdfPagesConfig, b: PdfPagesConfig) {
  const { withPageTurning: turningA, ...restA } = a;
  const { withPageTurning: turningB, ...restB } = b;
  const sameTurning =
    typeof turningA === 'object' && typeof turningB === 'object'
      ? shallowEqual(turningA, turningB)
      : turningA === turningB;
  return sameTurning && shallowEqual(restA, restB);
}

function setConfig(registry: PdfPagesRegistry, config: PdfPagesConfig) {
  if (!sameConfig(registry.config, config)) {
    registry.config = config;
    registry.listeners.forEach((listener) => listener());
  }
}

/**
 * `DocViewer.Pages` registers the props the session needs (page turning, scroll behaviour and
 * the reading events), since the session is above it in the tree. The handlers are read at call
 * time, so new functions do not make the session render again. Outside a PDF it does nothing
 */
export function usePagesRegistration(config: PdfPagesConfig, handlers: DocViewerPagesEvents) {
  const registry = use(PdfPagesRegistryContext);
  if (registry) {
    registry.handlers = handlers;
  }

  useIsomorphicEffect(() => {
    registry &&
      setConfig(registry, {
        withPageTurning: config.withPageTurning,
        withScrollSnap: config.withScrollSnap,
        withScroll: config.withScroll,
      });
  }, [registry, config.withPageTurning, config.withScrollSnap, config.withScroll]);

  useIsomorphicEffect(
    () => () => {
      if (registry) {
        registry.handlers = {};
        setConfig(registry, {});
      }
    },
    [registry]
  );
}

/**
 * The context the PDF session hooks read, with the page turning, scroll behaviour and reading
 * events of the mounted `DocViewer.Pages`. The same object while nothing it is made from changes
 */
export function usePagesContext(
  context: DocViewerContextValue,
  registry: PdfPagesRegistry
): PdfPagesContextValue {
  const getConfig = () => registry.config;
  const config = useSyncExternalStore(registry.subscribe, getConfig, getConfig);
  const { events } = context;
  const pagesEvents = useMemo<PdfPagesContextValue['events']>(
    () => ({
      ...events,
      onLinkClick: (url, event) => registry.handlers.onLinkClick?.(url, event),
      onTextSelect: (text, details) => registry.handlers.onTextSelect?.(text, details),
      onReadingProgress: (progress) => registry.handlers.onReadingProgress?.(progress),
      onReachEnd: () => registry.handlers.onReachEnd?.(),
    }),
    [registry, events]
  );

  return useMemo(
    () => ({
      ...context,
      withPageTurning: config.withPageTurning,
      withScrollSnap: config.withScrollSnap,
      withScroll: config.withScroll,
      events: pagesEvents,
    }),
    [context, config, pagesEvents]
  );
}
