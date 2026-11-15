import { Toolbar } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from './DocViewer.context';
import { DownloadButton, FullscreenButton, PrintButton, ToolbarHeading } from './ToolbarParts';

/** What `renderToolbarTitle` gets */
export interface DocViewerToolbarTitleInfo {
  /** The text the toolbar shows by default: the file name, or the `document` label without one */
  title: string;

  /** Name of the file, `undefined` for blob and data urls without a `fileName` */
  fileName: string | undefined;
}

/** Renders the toolbar title in place of the file name, for example the current sheet of a set */
export type DocViewerRenderToolbarTitle = (info: DocViewerToolbarTitleInfo) => React.ReactNode;

export interface DocViewerToolbarProps {
  /** Controls specific to the document type, for example, PDF paging and zoom */
  children?: React.ReactNode;

  /** Prints the document, the print button is shown when it is set */
  onPrint?: () => Promise<void> | void;
}

export function DocViewerToolbar({ children, onPrint }: DocViewerToolbarProps) {
  const { getStyles, toolbarSection, toolbarStartSection, withToolbar, toolbarHidden, labels } =
    useDocViewerContext();

  if (!withToolbar) {
    return null;
  }

  return (
    <div {...getStyles('toolbar')} data-doc-viewer-toolbar data-hidden={toolbarHidden || undefined}>
      {toolbarStartSection && <div {...getStyles('toolbarStart')}>{toolbarStartSection}</div>}
      <ToolbarHeading />
      {/* Mantine's Toolbar gives the buttons arrow key navigation; the viewer styles it itself */}
      <Toolbar unstyled withBorder={false} aria-label={labels.toolbar} {...getStyles('controls')}>
        {children}
        {toolbarSection}
        <PrintButton onPrint={onPrint} />
        <DownloadButton />
        <FullscreenButton />
      </Toolbar>
    </div>
  );
}
