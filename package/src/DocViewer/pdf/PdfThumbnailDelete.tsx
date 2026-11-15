import { ActionIcon } from '@mantine/core';
import React from 'react';
import { useDocViewerPageContext } from '../DocViewer.context';
import { TrashIcon } from '../icons';

interface PdfThumbnailDeleteProps {
  pageNumber: number;
  onDelete: (pageNumber: number) => void;
}

/** Delete button on a thumbnail */
export function PdfThumbnailDelete({ pageNumber, onDelete }: PdfThumbnailDeleteProps) {
  const { getStyles, labels } = useDocViewerPageContext();
  return (
    // Not a tab stop: keyboard users press Delete on the thumbnail instead
    <ActionIcon
      {...getStyles('thumbnailDelete')}
      size="sm"
      variant="default"
      tabIndex={-1}
      aria-label={labels.deletePage(pageNumber)}
      onClick={(event) => {
        event.stopPropagation();
        onDelete(pageNumber);
      }}
    >
      <TrashIcon />
    </ActionIcon>
  );
}
