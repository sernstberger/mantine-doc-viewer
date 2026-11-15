import { shallowEqual, useIsomorphicEffect } from '@mantine/hooks';
import { useMemo, useSyncExternalStore } from 'react';
import type { DocViewerContextValue } from '../../doc-viewer.context';
import type { DocViewerStore } from '../../doc-viewer.store';
import type { DocViewerPageTurning } from '../../utils/spreads';
import type { DocViewerEvents } from '../use-controller-registry';

/** What `DocViewer.Pages` hands the PDF session, which runs above it */
export interface PdfPagesConfig {
  withPageTurning?: boolean | DocViewerPageTurning;
  withScrollSnap?: boolean;
  withScroll?: boolean;
}

export type PdfPagesHandlers = Pick<
  DocViewerEvents,
  'onLinkClick' | 'onTextSelect' | 'onReadingProgress' | 'onReachEnd'
>;

interface PagesEntry {
  config: PdfPagesConfig;
  handlers: PdfPagesHandlers;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
}

const entries = new WeakMap<DocViewerStore, PagesEntry>();

function getEntry(store: DocViewerStore): PagesEntry {
  let entry = entries.get(store);
  if (!entry) {
    const listeners = new Set<() => void>();
    entry = {
      config: {},
      handlers: {},
      listeners,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    entries.set(store, entry);
  }
  return entry;
}

function sameConfig(a: PdfPagesConfig, b: PdfPagesConfig) {
  const { withPageTurning: turningA, ...restA } = a;
  const { withPageTurning: turningB, ...restB } = b;
  const sameTurning =
    typeof turningA === 'object' && typeof turningB === 'object'
      ? shallowEqual(turningA, turningB)
      : turningA === turningB;
  return sameTurning && shallowEqual(restA, restB);
}

function setConfig(entry: PagesEntry, config: PdfPagesConfig) {
  if (!sameConfig(entry.config, config)) {
    entry.config = config;
    entry.listeners.forEach((listener) => listener());
  }
}

/**
 * `DocViewer.Pages` registers the props the session needs (page turning, scroll behaviour and
 * the reading events), since the session is above it in the tree. The handlers are read at call
 * time, so new functions do not make the session render again
 */
export function usePagesRegistration(
  store: DocViewerStore,
  config: PdfPagesConfig,
  handlers: PdfPagesHandlers
) {
  const entry = getEntry(store);
  entry.handlers = handlers;

  useIsomorphicEffect(() => {
    setConfig(entry, {
      withPageTurning: config.withPageTurning,
      withScrollSnap: config.withScrollSnap,
      withScroll: config.withScroll,
    });
  }, [entry, config.withPageTurning, config.withScrollSnap, config.withScroll]);

  useIsomorphicEffect(
    () => () => {
      entry.handlers = {};
      setConfig(entry, {});
    },
    [entry]
  );
}

/**
 * The context the PDF session hooks read, with the page turning, scroll behaviour and reading
 * events of the mounted `DocViewer.Pages` in place of the ones `DocViewer` hands Root. The same
 * object while nothing it is made from changes
 */
export function usePagesContext(context: DocViewerContextValue): DocViewerContextValue {
  const entry = getEntry(context.store);
  const getConfig = () => entry.config;
  const config = useSyncExternalStore(entry.subscribe, getConfig, getConfig);
  const { events } = context;
  const pagesEvents = useMemo<DocViewerContextValue['events']>(
    () => ({
      ...events,
      onLinkClick: (url, event) => (entry.handlers.onLinkClick ?? events.onLinkClick)(url, event),
      onTextSelect: (text, details) =>
        (entry.handlers.onTextSelect ?? events.onTextSelect)(text, details),
      onReadingProgress: (progress) =>
        (entry.handlers.onReadingProgress ?? events.onReadingProgress)(progress),
      onReachEnd: () => (entry.handlers.onReachEnd ?? events.onReachEnd)(),
    }),
    [entry, events]
  );

  return useMemo(
    () => ({
      ...context,
      withPageTurning: config.withPageTurning ?? context.withPageTurning,
      withScrollSnap: config.withScrollSnap ?? context.withScrollSnap,
      withScroll: config.withScroll ?? context.withScroll,
      events: pagesEvents,
    }),
    [context, config, pagesEvents]
  );
}
