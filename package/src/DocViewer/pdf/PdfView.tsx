import { VisuallyHidden } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { PdfMain } from './PdfMain';
import { PdfPageEditor } from './PdfPageEditor';
import { PdfPresentationControls } from './PdfPresentationControls';
import { PdfReaderBars, PdfReaderBody, PdfReaderThumbnails } from './PdfReader';
import { useEditedDocument } from './use-pdf-edits';
import { getLoaded, usePdfDocument } from './use-pdf-document';
import { usePdfPageContent } from './use-pdf-page-content';
import { usePdfPageSync } from './use-pdf-page-sync';
import { usePdfPageTurns } from './use-pdf-page-turns';
import { usePdfReadingPosition } from './use-pdf-reading-position';
import { usePdfViewActions } from './use-pdf-view-actions';
import { usePdfViewGeometry } from './use-pdf-view-geometry';
import { usePresentationAnnouncement } from './use-presentation-announcement';
import { useReturnFocus } from './use-return-focus';

/** The PDF viewer: wires the hook groups (in this order, since effects run in call order) to the layout */
export function PdfView() {
  const context = useDocViewerContext();
  const edited = useEditedDocument(context.src);
  const { editing, setEditing } = edited;
  const state = usePdfDocument(
    context.src,
    context.pdfWorkerSrc,
    context.pdfOptions,
    edited.editedData
  );
  const loaded = getLoaded(state);
  const { ready, numPages } = loaded;

  const view = usePdfViewGeometry(context, ready);
  const position = usePdfReadingPosition(context, loaded, view);
  const content = usePdfPageContent(context, loaded.document, view, position);
  usePdfPageSync({ context, state, loaded, view, position, editing });
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
  const { presenting, thumbnailsPanel } = view;
  usePresentationAnnouncement(presenting, position.announce);
  const returnFocus = {
    present: useReturnFocus(presenting),
    editPages: useReturnFocus(editing),
  };

  if (editing && ready) {
    return (
      <>
        <DocViewerToolbar />
        <PdfPageEditor
          document={ready.document}
          onCancel={() => setEditing(false)}
          onSave={actions.savePdf}
          onDone={(bytes) => {
            setEditing(false);
            bytes && actions.showEdited(bytes);
          }}
        />
      </>
    );
  }

  const parts = { view, position, content };
  return (
    <>
      {!presenting && (
        <PdfReaderBars
          ready={ready}
          {...parts}
          actions={actions}
          setEditing={setEditing}
          returnFocus={returnFocus}
        />
      )}

      <PdfMain
        position={thumbnailsPanel.position}
        presenting={presenting}
        thumbnails={<PdfReaderThumbnails ready={ready} {...parts} actions={actions} />}
        presentationControls={
          <PdfPresentationControls
            currentPage={position.currentPage}
            numPages={numPages}
            onExit={view.presentation.stop}
          />
        }
      >
        <PdfReaderBody
          state={state}
          loaded={loaded}
          {...parts}
          turns={turns}
          onKeyDown={actions.handleKeyDown}
        />
      </PdfMain>

      {ready && <VisuallyHidden role="status">{position.pageAnnouncement}</VisuallyHidden>}
    </>
  );
}
