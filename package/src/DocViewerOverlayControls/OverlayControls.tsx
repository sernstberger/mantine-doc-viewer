import { ActionIcon } from '@mantine/core';
import React from 'react';
import { DocViewerTooltip, useFullscreenAvailable } from '../DocViewerToolbar/DocViewerTooltip';
import { useDocViewerContext } from '../doc-viewer.context';
import { FullscreenExitIcon, FullscreenIcon, MinusIcon, PlusIcon } from '../utils/icons';

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
      <DocViewerTooltip label={labels.zoomInLabel}>
        <ActionIcon
          {...buttonProps}
          aria-label={labels.zoomInLabel}
          onClick={() => controller.current.zoomIn?.()}
        >
          <PlusIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <DocViewerTooltip label={labels.zoomOutLabel}>
        <ActionIcon
          {...buttonProps}
          aria-label={labels.zoomOutLabel}
          onClick={() => controller.current.zoomOut?.()}
        >
          <MinusIcon />
        </ActionIcon>
      </DocViewerTooltip>
      {withFullscreen && fullscreenAvailable && (
        <DocViewerTooltip label={fullscreen ? labels.exitFullscreenLabel : labels.fullscreenLabel}>
          <ActionIcon
            {...buttonProps}
            aria-label={labels.fullscreenLabel}
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
