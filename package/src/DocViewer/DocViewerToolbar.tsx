import { ActionIcon } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { DocViewerTooltip, useControlProps } from './controls';
import { useDocumentTitle, useDocViewerContext, useShowControl } from './DocViewer.context';
import { DownloadIcon, FullscreenExitIcon, FullscreenIcon, PrintIcon } from './icons';

export interface DocViewerToolbarProps {
  /** Controls specific to the document type, for example, PDF paging and zoom */
  children?: React.ReactNode;

  /** Prints the document, the print button is shown when it is set */
  onPrint?: () => Promise<void> | void;
}

/** Full screen is not available in some browsers (iPhone Safari) and inside iframes without permission */
function useFullscreenAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => setAvailable(!!document.fullscreenEnabled), []);
  return available;
}

export function DocViewerToolbar({ children, onPrint }: DocViewerToolbarProps) {
  const {
    getStyles,
    fileName,
    src,
    toolbarSection,
    withToolbar,
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

  const print = async () => {
    if (!onPrint || printing) {
      return;
    }
    setPrinting(true);
    try {
      await onPrint();
    } catch {
      // The browser could not print from the viewer, open the file so it can be printed from there
      window.open(src, '_blank', 'noopener,noreferrer');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div {...getStyles('toolbar')}>
      {show('title') ? (
        <span {...getStyles('title')}>{title}</span>
      ) : (
        <span {...getStyles('title')} />
      )}
      <div {...getStyles('controls')}>
        {children}
        {toolbarSection}
        {withPrint && show('print') && onPrint && (
          <DocViewerTooltip label={labels.print}>
            <ActionIcon
              {...controlProps()}
              aria-label={labels.print}
              loading={printing}
              onClick={print}
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
      </div>
    </div>
  );
}
