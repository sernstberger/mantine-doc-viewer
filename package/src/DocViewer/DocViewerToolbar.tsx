import { ActionIcon, Tooltip } from '@mantine/core';
import React from 'react';
import { useDocumentTitle, useDocViewerContext } from './DocViewer.context';
import { DownloadIcon } from './icons';
import { TOOLTIP_EVENTS } from './a11y';

interface DocViewerToolbarProps {
  /** Controls specific to the document type, for example, PDF paging and zoom */
  children?: React.ReactNode;
}

export function DocViewerToolbar({ children }: DocViewerToolbarProps) {
  const { getStyles, fileName, src, toolbarSection, withToolbar, labels } = useDocViewerContext();
  const title = useDocumentTitle();

  if (!withToolbar) {
    return null;
  }

  return (
    <div {...getStyles('toolbar')}>
      <span {...getStyles('title')}>{title}</span>
      <div {...getStyles('controls')}>
        {children}
        {toolbarSection}
        <Tooltip events={TOOLTIP_EVENTS} label={labels.download}>
          <ActionIcon
            component="a"
            href={src}
            download={fileName ?? true}
            // Browsers ignore download for other origins and open the file instead, so not in place of the app
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="gray"
            aria-label={labels.download}
          >
            <DownloadIcon />
          </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
}
