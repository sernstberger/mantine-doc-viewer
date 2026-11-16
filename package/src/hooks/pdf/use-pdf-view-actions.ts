import type { KeyboardEvent } from 'react';
import type { DocViewerContextValue } from '../../doc-viewer.context';
import { printPdfBytes } from '../../utils/print';
import { zoomIn, zoomOut } from '../../utils/zoom';
import { getPdfKeyAction, type PdfKeyAction } from '../../utils/pdf-keys';
import { usePdfController } from './use-pdf-controller';
import { useLogWorkerError, type PdfDocumentState } from './use-pdf-document';
import { useShowBytes, type useEditedDocument } from './use-pdf-edits';
import type { PdfPageContent } from './use-pdf-page-content';
import type { PdfPageTurns } from './use-pdf-page-turns';
import type { PdfReadingPosition } from './use-pdf-reading-position';
import type { PdfLoaded, PdfViewGeometry } from './use-pdf-view-geometry';
import { usePresentationRestore } from './use-presentation-restore';
import { useWheelZoom } from './use-wheel-zoom';
import { useZoomAnchor } from './use-zoom-anchor';

/** Keys that press a focused button, which a presentation leaves to it */
const BUTTON_KEYS = new Set([' ', 'Enter']);

interface PdfViewActionsInput {
  context: DocViewerContextValue;
  state: PdfDocumentState;
  loaded: PdfLoaded;
  edited: ReturnType<typeof useEditedDocument>;
  view: PdfViewGeometry;
  position: PdfReadingPosition;
  content: PdfPageContent;
  turns: PdfPageTurns;
}

/**
 * What the reader does on request: the app's controller, showing edited bytes, printing, zooming
 * with the wheel and keys; and the scroll kept steady across zoom and presentations
 */
export function usePdfViewActions(input: PdfViewActionsInput) {
  const { context, loaded, edited, view, position, content, turns } = input;
  const { document, numPages } = loaded;
  const { scale, scrollRoot, presenting } = view;
  const { currentPage, scrollToPage, goToPage, zoomTo } = position;
  const { search } = content;

  const print = async () => {
    document && (await printPdfBytes(await document.getData()));
  };

  usePdfController({
    controller: context.controller,
    document,
    numPages,
    scale,
    scrollRoot,
    goToPage,
    setZoom: zoomTo,
    togglePresentation: view.presentation.toggle,
    passage: content.passage,
    search,
    actions: {
      goToSpread: turns.goToSpread,
      nextSpread: () => turns.turn(1),
      previousSpread: () => turns.turn(-1),
      setPageLayout: view.setLayout,
      rotate: view.rotate,
      print,
      resetReadingProgress: position.progress.reset,
    },
  });

  useZoomAnchor(scrollRoot, scale, !presenting && !view.viewport, position.resumeScroll);

  usePresentationRestore(presenting, currentPage, scale, scrollToPage);

  const showBytes = useShowBytes({
    document,
    editedData: edited.editedData,
    setEditedData: edited.setEditedData,
    scrollToPage,
  });

  useWheelZoom(scrollRoot, !presenting, scale, zoomTo);

  const keyActions: Record<PdfKeyAction['type'], (action: PdfKeyAction) => void> = {
    page: (action) => action.type === 'page' && goToPage(action.page),
    exit: () => view.presentation.stop(),
    'zoom-in': () => zoomTo(zoomIn(scale)),
    'zoom-out': () => zoomTo(zoomOut(scale)),
    fit: () => zoomTo('fit-width'),
    search: () => search.open(),
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const ready = !!loaded.ready;
    const target = event.target as Element;
    if (BUTTON_KEYS.has(event.key) && target.closest?.('button, a')) {
      return;
    }
    const action = getPdfKeyAction(event, {
      ready,
      presenting,
      currentPage,
      numPages,
      searchAvailable: context.store.getState().searchAvailable,
    });
    if (action) {
      event.preventDefault();
      keyActions[action.type](action);
    }
  };

  useLogWorkerError(input.state);

  return { showBytes, print, handleKeyDown };
}

export type PdfViewActions = ReturnType<typeof usePdfViewActions>;
