import type React from 'react';
import type { DocViewerContextValue } from '../DocViewer.context';
import { printPdfBytes } from '../print';
import { zoomIn, zoomOut } from '../zoom';
import { getPdfKeyAction, type PdfKeyAction } from './pdf-keys';
import { usePdfController } from './use-pdf-controller';
import { useLogWorkerError, type PdfDocumentState } from './use-pdf-document';
import { usePdfEdits, type useEditedDocument } from './use-pdf-edits';
import type { PdfPageContent } from './use-pdf-page-content';
import type { PdfPageTurns } from './use-pdf-page-turns';
import type { PdfReadingPosition } from './use-pdf-reading-position';
import type { PdfLoaded, PdfViewGeometry } from './use-pdf-view-geometry';
import { usePresentationRestore } from './use-presentation-restore';
import { useWheelZoom } from './use-wheel-zoom';
import { useZoomAnchor } from './use-zoom-anchor';

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
 * What the reader does on request: the app's controller, saving edits, printing, zooming with
 * the wheel and keys; and the scroll kept steady across zoom and presentations
 */
export function usePdfViewActions(input: PdfViewActionsInput) {
  const { context, loaded, edited, view, position, content, turns } = input;
  const { document, numPages } = loaded;
  const { scale, scrollRoot, presenting } = view;
  const { currentPage, scrollToPage, goToPage, zoomTo } = position;
  const { search, markup } = content;

  const print = async () => {
    document && (await printPdfBytes(await document.getData()));
  };

  usePdfController({
    controller: context.controller,
    document,
    numPages,
    scale,
    scrollRoot,
    withPageEditing: context.withPageEditing,
    goToPage,
    setZoom: zoomTo,
    setEditing: edited.setEditing,
    toggleThumbnails: view.thumbnailsPanel.toggle,
    togglePresentation: view.presentation.toggle,
    passage: content.passage,
    search,
    actions: {
      goToSpread: turns.goToSpread,
      nextSpread: () => turns.turn(1),
      previousSpread: () => turns.turn(-1),
      setPageLayout: view.setLayout,
      rotate: view.rotate,
      setMarkupTool: markup.setTool,
      saveMarkup: () => edits.saveMarkup(),
      print,
      resetReadingProgress: position.progress.reset,
    },
  });

  // The page a presentation ended on is restored below, after this has run
  useZoomAnchor(scrollRoot, scale, !presenting && !view.viewport, position.resumeScroll);

  usePresentationRestore(presenting, currentPage, scale, scrollToPage);

  const edits = usePdfEdits({
    document,
    numPages,
    editedData: edited.editedData,
    setEditedData: edited.setEditedData,
    scrollToPage,
    announce: position.announce,
    labels: context.labels,
    onSave: context.onSave,
    fileName: context.fileName,
    markup,
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
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const ready = !!loaded.ready;
    const action = getPdfKeyAction(event, { ready, presenting, currentPage, numPages });
    if (action) {
      event.preventDefault();
      keyActions[action.type](action);
    }
  };

  useLogWorkerError(input.state);

  return { ...edits, print, handleKeyDown };
}

export type PdfViewActions = ReturnType<typeof usePdfViewActions>;
