import { ActionIcon } from '@mantine/core';
import React, { use } from 'react';
import { useDocViewerPageContext } from '../doc-viewer.context';
import { PdfThumbnailEditsContext, useReadyPdfSession } from '../DocViewerRoot/pdf-session-context';
import { TrashIcon } from '../utils/icons';
import { usePageEditor } from './page-editor-setup';
import { PdfPageEditor } from './PdfPageEditor';

/** The page editor screen while the editor is open; `DocViewer.Main` shows it in place of the pages */
export function PageEditorScreen() {
  const session = useReadyPdfSession();
  const editor = usePageEditor();
  if (!session || !editor?.editing) {
    return null;
  }

  return (
    <PdfPageEditor
      document={session.loaded.ready!.document}
      onCancel={editor.close}
      onSave={editor.save}
      onDone={(bytes) => {
        editor.close();
        bytes && session.actions.showBytes(bytes);
      }}
    />
  );
}

/** Delete button on a thumbnail, while a page can be deleted */
export function ThumbnailDeleteAction({ page }: { page: number }) {
  const { getStyles, labels } = useDocViewerPageContext();
  const edits = use(PdfThumbnailEditsContext);
  const onDelete = edits?.onDelete;
  if (!onDelete) {
    return null;
  }

  return (
    // Not a tab stop: keyboard users press Delete on the thumbnail instead
    <ActionIcon
      {...getStyles('thumbnailDelete')}
      size="sm"
      variant="default"
      tabIndex={-1}
      aria-label={labels.deletePageLabel(page)}
      onClick={(event) => {
        event.stopPropagation();
        onDelete(page);
      }}
    >
      <TrashIcon />
    </ActionIcon>
  );
}
