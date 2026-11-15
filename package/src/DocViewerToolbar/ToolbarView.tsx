import { Toolbar } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { DownloadButton, FullscreenButton, PrintButton, ToolbarHeading } from './ToolbarParts';

export interface ToolbarViewProps {
  /** Controls specific to the document type, for example, PDF paging and zoom */
  children?: React.ReactNode;

  /** Prints the document, the print button is shown when it is set */
  onPrint?: () => Promise<void> | void;
}

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
      <ToolbarHeading />
      {/* Mantine's Toolbar gives the buttons arrow key navigation; the viewer styles it itself */}
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
        <PrintButton onPrint={onPrint} />
        <DownloadButton />
        <FullscreenButton />
      </Toolbar>
    </div>
  );
}
