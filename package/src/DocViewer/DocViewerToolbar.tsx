import { ActionIcon, Toolbar } from '@mantine/core';
import React, { useState } from 'react';
import { DocViewerTooltip, useControlProps, useFullscreenAvailable } from './controls';
import { useDocumentTitle, useDocViewerContext, useShowControl } from './DocViewer.context';
import { DownloadIcon, FullscreenExitIcon, FullscreenIcon, PrintIcon } from './icons';

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
  const {
    getStyles,
    fileName,
    src,
    toolbarSection,
    toolbarStartSection,
    toolbarSubtitle,
    renderToolbarTitle,
    withToolbar,
    toolbarHidden,
    withPrint,
    withDownload,
    withFullscreen,
    fullscreen,
    toggleFullscreen,
    labels,
  } = useDocViewerContext();
  const controlProps = useControlProps();
  const show = useShowControl();
  const title = useDocumentTitle();
  const fullscreenAvailable = useFullscreenAvailable();
  const [printing, setPrinting] = useState(false);

  if (!withToolbar) {
    return null;
  }

  // The button only exists with onPrint, and is disabled (loading) while printing
  const print = async (printDocument: () => Promise<void> | void) => {
    setPrinting(true);
    try {
      await printDocument();
    } catch {
      // The browser could not print from the viewer, open the file so it can be printed from there
      window.open(src, '_blank', 'noopener,noreferrer');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div {...getStyles('toolbar')} data-doc-viewer-toolbar data-hidden={toolbarHidden || undefined}>
      {toolbarStartSection && <div {...getStyles('toolbarStart')}>{toolbarStartSection}</div>}
      <div {...getStyles('heading')}>
        {show('title') && (
          <>
            <span {...getStyles('title')}>
              {renderToolbarTitle ? renderToolbarTitle({ title, fileName }) : title}
            </span>
            {toolbarSubtitle && <span {...getStyles('subtitle')}>{toolbarSubtitle}</span>}
          </>
        )}
      </div>
      {/* Mantine's Toolbar gives the buttons arrow key navigation; the viewer styles it itself */}
      <Toolbar unstyled withBorder={false} aria-label={labels.toolbar} {...getStyles('controls')}>
        {children}
        {toolbarSection}
        {withPrint && show('print') && onPrint && (
          <DocViewerTooltip label={labels.print}>
            <ActionIcon
              {...controlProps()}
              aria-label={labels.print}
              loading={printing}
              onClick={() => print(onPrint)}
            >
              <PrintIcon />
            </ActionIcon>
          </DocViewerTooltip>
        )}
        {withDownload && show('download') && (
          <DocViewerTooltip label={labels.download}>
            <ActionIcon
              component="a"
              href={src}
              download={fileName ?? true}
              // Browsers ignore download for other origins and open the file instead, so not in place of the app
              target="_blank"
              rel="noopener noreferrer"
              {...controlProps()}
              aria-label={labels.download}
            >
              <DownloadIcon />
            </ActionIcon>
          </DocViewerTooltip>
        )}
        {withFullscreen && show('fullscreen') && fullscreenAvailable && (
          <DocViewerTooltip label={fullscreen ? labels.exitFullscreen : labels.fullscreen}>
            <ActionIcon
              {...controlProps(fullscreen)}
              aria-label={labels.fullscreen}
              aria-pressed={fullscreen}
              onClick={() => toggleFullscreen()}
            >
              {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </ActionIcon>
          </DocViewerTooltip>
        )}
      </Toolbar>
    </div>
  );
}
