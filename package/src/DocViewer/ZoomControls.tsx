import { ActionIcon, Group, Tooltip, UnstyledButton } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from './DocViewer.context';
import { MinusIcon, PlusIcon } from './icons';
import { MAX_ZOOM, MIN_ZOOM, zoomIn, zoomOut } from './zoom';

interface ZoomControlsProps {
  /** Scale currently applied, including a fitted scale */
  scale: number;

  /** Whether the content is fitted to the viewer */
  fitted: boolean;
  fitLabel: string;
  fitIcon: React.ReactNode;
  onZoom: (scale: number) => void;
  onFit: () => void;
}

export function ZoomControls({
  scale,
  fitted,
  fitLabel,
  fitIcon,
  onZoom,
  onFit,
}: ZoomControlsProps) {
  const { getStyles } = useDocViewerContext();

  return (
    <Group gap={2} wrap="nowrap">
      <Tooltip label="Zoom out">
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Zoom out"
          disabled={scale <= MIN_ZOOM + 0.001}
          onClick={() => onZoom(zoomOut(scale))}
        >
          <MinusIcon />
        </ActionIcon>
      </Tooltip>
      <UnstyledButton
        {...getStyles('zoomLevel')}
        onClick={() => onZoom(1)}
        aria-label="Reset zoom to 100%"
      >
        {Math.round(scale * 100)}%
      </UnstyledButton>
      <Tooltip label="Zoom in">
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Zoom in"
          disabled={scale >= MAX_ZOOM - 0.001}
          onClick={() => onZoom(zoomIn(scale))}
        >
          <PlusIcon />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={fitLabel}>
        <ActionIcon
          variant={fitted ? 'light' : 'subtle'}
          color="gray"
          aria-label={fitLabel}
          aria-pressed={fitted}
          onClick={onFit}
        >
          {fitIcon}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
