import { ActionIcon } from '@mantine/core';
import { use } from 'react';
import { useDocViewerPageContext } from '../doc-viewer.context';
import { PdfThumbnailEditsContext } from '../DocViewerRoot/pdf-session-context';
import { TrashIcon } from '../utils/icons';
import { usePageEditor } from './page-editor-setup';

/**
 * Delete button on a thumbnail, while a page can be deleted. Not a tab stop: keyboard users press
 * Delete on the thumbnail instead
 */
export function ThumbnailDeleteAction({ page }: { page: number }) {
  const { getStyles, unstyled } = useDocViewerPageContext();
  const editor = usePageEditor();
  const onDelete = use(PdfThumbnailEditsContext)?.onDelete;
  if (!onDelete) {
    return null;
  }

  return (
    <ActionIcon
      unstyled={unstyled}
      {...getStyles('thumbnailDelete')}
      size="sm"
      variant="default"
      tabIndex={-1}
      aria-label={editor!.labels.deletePageLabel(page)}
      onClick={(event) => {
        event.stopPropagation();
        onDelete(page);
      }}
    >
      <TrashIcon />
    </ActionIcon>
  );
}
