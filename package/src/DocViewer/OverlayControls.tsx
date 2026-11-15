import { ActionIcon } from '@mantine/core';
import React from 'react';
import { DocViewerTooltip, useFullscreenAvailable } from './controls';
import { useDocViewerContext } from './DocViewer.context';
import { FullscreenExitIcon, FullscreenIcon, MinusIcon, PlusIcon } from './icons';

/** Floating zoom and full screen buttons over the document, for a viewer without a toolbar */
export function OverlayControls() {
  const { getStyles, labels, size, controller, withFullscreen, fullscreen, toggleFullscreen } =
    useDocViewerContext();
  const fullscreenAvailable = useFullscreenAvailable();
  const buttonProps = {
    ...getStyles('overlayControl'),
    size: size.control,
    variant: 'default',
    color: 'gray',
  };

  return (
    <div {...getStyles('overlayControls')}>
      <DocViewerTooltip label={labels.zoomIn}>
        <ActionIcon
          {...buttonProps}
          aria-label={labels.zoomIn}
          onClick={() => controller.current.zoomIn?.()}
        >
          <PlusIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <DocViewerTooltip label={labels.zoomOut}>
        <ActionIcon
          {...buttonProps}
          aria-label={labels.zoomOut}
          onClick={() => controller.current.zoomOut?.()}
        >
          <MinusIcon />
        </ActionIcon>
      </DocViewerTooltip>
      {withFullscreen && fullscreenAvailable && (
        <DocViewerTooltip label={fullscreen ? labels.exitFullscreen : labels.fullscreen}>
          <ActionIcon
            {...buttonProps}
            aria-label={labels.fullscreen}
            aria-pressed={fullscreen}
            onClick={() => toggleFullscreen()}
          >
            {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </ActionIcon>
        </DocViewerTooltip>
      )}
    </div>
  );
}
