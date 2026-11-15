import { ActionIcon } from '@mantine/core';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { FitScreenIcon, RotateIcon } from '../utils/icons';
import { ZoomControls } from '../DocViewerZoomControls/ZoomControls';
import type { ImageZoom } from '../utils/image-zoom';

interface ImageControlsProps {
  scale: number;
  zoom: ImageZoom;
  zoomTo: (zoom: ImageZoom) => void;
  rotate: () => void;
}

export function ImageControls({ scale, zoom, zoomTo, rotate }: ImageControlsProps) {
  const { labels } = useDocViewerContext();
  const controlProps = useControlProps();
  const show = useShowControl();

  return (
    <>
      {show('zoom') && (
        <ZoomControls
          scale={scale}
          fitted={zoom === 'fit'}
          fitLabel={labels.fitToView}
          fitIcon={<FitScreenIcon />}
          onZoom={zoomTo}
          onFit={() => zoomTo('fit')}
        />
      )}
      {show('rotate') && (
        <DocViewerTooltip label={labels.rotate}>
          <ActionIcon {...controlProps()} aria-label={labels.rotate} onClick={rotate}>
            <RotateIcon />
          </ActionIcon>
        </DocViewerTooltip>
      )}
    </>
  );
}
