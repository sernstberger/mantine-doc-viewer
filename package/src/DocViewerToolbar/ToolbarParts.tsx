import { ActionIcon } from '@mantine/core';
import React, { useState } from 'react';
import { DocViewerTooltip, useControlProps, useFullscreenAvailable } from './DocViewerTooltip';
import { useDocumentTitle, useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { DownloadIcon, FullscreenExitIcon, FullscreenIcon, PrintIcon } from '../utils/icons';

/** The file name (or the custom title) and the subtitle, inside the heading */
export function ToolbarHeading() {
  const { getStyles, toolbarSubtitle, toolbarTitle } = useDocViewerContext();
  const show = useShowControl();
  const title = useDocumentTitle();

  return (
    <div {...getStyles('heading')}>
      {show('title') && (
        <>
          <span {...getStyles('title')}>{toolbarTitle ?? title}</span>
          {toolbarSubtitle && <span {...getStyles('subtitle')}>{toolbarSubtitle}</span>}
        </>
      )}
    </div>
  );
}

/** The print button only exists with onPrint, and is disabled (loading) while printing */
export function PrintButton({ onPrint }: { onPrint: (() => Promise<void> | void) | undefined }) {
  const { src, labels } = useDocViewerContext();
  const controlProps = useControlProps();
  const show = useShowControl();
  const [printing, setPrinting] = useState(false);

  if (!(show('print') && onPrint)) {
    return null;
  }

  const print = async () => {
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
    <DocViewerTooltip label={labels.printLabel}>
      <ActionIcon
        {...controlProps()}
        aria-label={labels.printLabel}
        loading={printing}
        onClick={print}
      >
        <PrintIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
}

export function DownloadButton() {
  const { src, fileName, labels } = useDocViewerContext();
  const controlProps = useControlProps();
  const show = useShowControl();

  if (!show('download')) {
    return null;
  }

  return (
    <DocViewerTooltip label={labels.downloadLabel}>
      <ActionIcon
        component="a"
        href={src}
        download={fileName ?? true}
        // Browsers ignore download for other origins and open the file instead, so not in place of the app
        target="_blank"
        rel="noopener noreferrer"
        {...controlProps()}
        aria-label={labels.downloadLabel}
      >
        <DownloadIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
}

export function FullscreenButton() {
  const { withFullscreen, fullscreen, toggleFullscreen, labels } = useDocViewerContext();
  const controlProps = useControlProps();
  const show = useShowControl();
  const fullscreenAvailable = useFullscreenAvailable();

  if (!(withFullscreen && show('fullscreen') && fullscreenAvailable)) {
    return null;
  }

  return (
    <DocViewerTooltip label={fullscreen ? labels.exitFullscreenLabel : labels.fullscreenLabel}>
      <ActionIcon
        {...controlProps(fullscreen)}
        aria-label={labels.fullscreenLabel}
        aria-pressed={fullscreen}
        onClick={() => toggleFullscreen()}
      >
        {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </ActionIcon>
    </DocViewerTooltip>
  );
}
