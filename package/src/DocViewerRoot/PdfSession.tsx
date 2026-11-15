import { VisuallyHidden } from '@mantine/core';
import { useIsomorphicEffect } from '@mantine/hooks';
import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import {
  updateDocViewerStateAction,
  type DocViewerState,
  type DocViewerStore,
} from '../doc-viewer.store';
import type { DocViewerExtension } from '../doc-viewer.types';
import { useEditedDocument } from '../hooks/pdf/use-pdf-edits';
import { getLoaded, usePdfDocument } from '../hooks/pdf/use-pdf-document';
import { usePdfModes } from '../hooks/pdf/use-pdf-modes';
import { usePdfPageContent } from '../hooks/pdf/use-pdf-page-content';
import { usePdfPageSync } from '../hooks/pdf/use-pdf-page-sync';
import { usePdfPageTurns } from '../hooks/pdf/use-pdf-page-turns';
import { usePdfReadingPosition } from '../hooks/pdf/use-pdf-reading-position';
import { usePdfViewActions } from '../hooks/pdf/use-pdf-view-actions';
import { usePdfViewGeometry } from '../hooks/pdf/use-pdf-view-geometry';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { fromPdfZoom } from '../utils/pdf-zoom';
import { useDocViewerExtensions } from './extensions-context';
import { PdfSessionContext, type PdfSession as PdfSessionValue } from './pdf-session-context';

type ProjectedState = Pick<
  DocViewerState,
  'status' | 'numPages' | 'page' | 'zoom' | 'scale' | 'pageLayout'
> & { spread: DocViewerState['spread'] | null };

/** The session state the store shows */
function getProjection({ state, loaded, view, position, turns }: PdfSessionValue): ProjectedState {
  return {
    status: state.status,
    numPages: loaded.numPages,
    page: position.currentPage,
    spread: turns.spread,
    zoom: fromPdfZoom(view.zoom),
    scale: view.scale,
    pageLayout: view.layout,
  };
}

function sameSpread(a: DocViewerState['spread'], b: DocViewerState['spread']) {
  return a.index === b.index && a.pages.join() === b.pages.join();
}

/** Writes the fields that changed, keeping `spread` while its pages are the same */
function writeProjection(store: DocViewerStore, { spread, ...next }: ProjectedState) {
  const current = store.getState();
  const changes: Partial<DocViewerState> = {};
  (Object.keys(next) as (keyof typeof next)[]).forEach((key) => {
    if (current[key] !== next[key]) {
      Object.assign(changes, { [key]: next[key] });
    }
  });
  if (spread && !sameSpread(current.spread, spread)) {
    changes.spread = spread;
  }
  Object.keys(changes).length > 0 && updateDocViewerStateAction(changes, store);
}

/**
 * The state the store is the source of starts over for each session: a new document, or the same
 * one with `keepView` after a change of type. An extension mode also ends when `src` changes
 */
function useSessionReset(store: DocViewerStore, src: string) {
  useIsomorphicEffect(() => {
    updateDocViewerStateAction({ rotation: 0, presenting: false, searchOpened: false }, store);
  }, [store]);

  useIsomorphicEffect(() => {
    store.getState().mode !== 'read' && updateDocViewerStateAction({ mode: 'read' }, store);
  }, [store, src]);
}

function withSetups(extensions: readonly DocViewerExtension[], children: React.ReactNode) {
  return extensions.reduceRight<React.ReactNode>(
    (content, extension) =>
      extension.setup ? <extension.setup key={extension.name}>{content}</extension.setup> : content,
    children
  );
}

/**
 * The PDF session Root runs for a PDF: the hook groups (in this order, since effects run in call
 * order), the store projection and the extensions' setups. The PDF parts are views on it
 */
export function PdfSession({ children }: { children: React.ReactNode }) {
  const context = useDocViewerContext();
  const extensions = useDocViewerExtensions();
  const edited = useEditedDocument(context.src);
  const state = usePdfDocument(context.src, context.pdfAdapter!, edited.editedData);
  const loaded = getLoaded(state);
  const { ready } = loaded;

  useSessionReset(context.store, context.src);
  const view = usePdfViewGeometry(context, ready);
  const position = usePdfReadingPosition(context, loaded, view);
  const content = usePdfPageContent(context, loaded.document, view, position);
  usePdfPageSync({ context, state, loaded, view, position });
  const turns = usePdfPageTurns(context, loaded, view, position);
  const actions = usePdfViewActions({
    context,
    state,
    loaded,
    edited,
    view,
    position,
    content,
    turns,
  });
  const modes = usePdfModes(view.presenting, position.announce);
  const reading = useDocViewerState(context.store, (current) => current.mode === 'read');
  const session = { state, loaded, view, position, content, turns, actions, modes };

  useIsomorphicEffect(() => writeProjection(context.store, getProjection(session)));

  return (
    <PdfSessionContext value={session}>
      {withSetups(extensions, children)}
      {ready && reading && (
        <VisuallyHidden role="status">{position.pageAnnouncement}</VisuallyHidden>
      )}
    </PdfSessionContext>
  );
}
