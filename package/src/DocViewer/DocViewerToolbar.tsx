import { ActionIcon, Tooltip } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from './DocViewer.context';
import { DownloadIcon } from './icons';

interface DocViewerToolbarProps {
  /** Controls specific to the document type, for example, PDF paging and zoom */
  children?: React.ReactNode;
}

export function DocViewerToolbar({ children }: DocViewerToolbarProps) {
  const { getStyles, fileName, src, toolbarSection, withToolbar } = useDocViewerContext();

  if (!withToolbar) {
    return null;
  }

  return (
    <div {...getStyles('toolbar')}>
      <span {...getStyles('title')}>{fileName ?? 'Document'}</span>
      <div {...getStyles('controls')}>
        {children}
        {toolbarSection}
        <Tooltip label="Download">
          <ActionIcon
            component="a"
            href={src}
            download={fileName ?? true}
            variant="subtle"
            color="gray"
            aria-label="Download"
          >
            <DownloadIcon />
          </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
}
