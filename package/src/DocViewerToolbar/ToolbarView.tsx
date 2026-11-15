import { Toolbar } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerDownloadButton } from '../DocViewerDownloadButton/DocViewerDownloadButton';
import { DocViewerFullscreenButton } from '../DocViewerFullscreenButton/DocViewerFullscreenButton';
import { DocViewerPrintButton } from '../DocViewerPrintButton/DocViewerPrintButton';
import { DocViewerTitle } from '../DocViewerTitle/DocViewerTitle';

export interface ToolbarViewProps {
  /** Controls specific to the document type, for example, PDF paging and zoom */
  children?: React.ReactNode;

  /** Prints the document, the print button is shown when it is set */
  onPrint?: () => Promise<void> | void;
}

/** The toolbar the views render around their own controls, until each view uses `DocViewerToolbar` */
export function ToolbarView({ children, onPrint }: ToolbarViewProps) {
  const { getStyles, toolbarSection, toolbarStartSection, withToolbar, toolbarHidden, labels } =
    useDocViewerContext();

  if (!withToolbar) {
    return null;
  }

  return (
    <div {...getStyles('toolbar')} data-doc-viewer-toolbar data-hidden={toolbarHidden || undefined}>
      {toolbarStartSection && (
        <div {...getStyles('toolbarSection')} data-position="left">
          {toolbarStartSection}
        </div>
      )}
      <DocViewerTitle />
      <Toolbar
        unstyled
        withBorder={false}
        aria-label={labels.toolbarLabel}
        {...getStyles('controls')}
      >
        {children}
        {toolbarSection && (
          <div {...getStyles('toolbarSection')} data-position="right">
            {toolbarSection}
          </div>
        )}
        {onPrint && <DocViewerPrintButton />}
        <DocViewerDownloadButton />
        <DocViewerFullscreenButton />
      </Toolbar>
    </div>
  );
}
