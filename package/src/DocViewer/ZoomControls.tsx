import { ActionIcon, Group, Tooltip, UnstyledButton } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from './DocViewer.context';
import { MinusIcon, PlusIcon } from './icons';
import { MAX_ZOOM, MIN_ZOOM, zoomIn, zoomOut } from './zoom';
import { softDisabled, TOOLTIP_EVENTS } from './a11y';

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
  const { getStyles, labels } = useDocViewerContext();

  return (
    <Group gap={2} wrap="nowrap">
      <Tooltip events={TOOLTIP_EVENTS} label={labels.zoomOut}>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={labels.zoomOut}
          {...softDisabled(scale <= MIN_ZOOM + 0.001, () => onZoom(zoomOut(scale)))}
        >
          <MinusIcon />
        </ActionIcon>
      </Tooltip>
      <UnstyledButton
        {...getStyles('zoomLevel')}
        onClick={() => onZoom(1)}
        // The name starts with the visible text, for voice control
        aria-label={`${Math.round(scale * 100)}%, ${labels.resetZoom}`}
      >
        {Math.round(scale * 100)}%
      </UnstyledButton>
      <Tooltip events={TOOLTIP_EVENTS} label={labels.zoomIn}>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={labels.zoomIn}
          {...softDisabled(scale >= MAX_ZOOM - 0.001, () => onZoom(zoomIn(scale)))}
        >
          <PlusIcon />
        </ActionIcon>
      </Tooltip>
      <Tooltip events={TOOLTIP_EVENTS} label={fitLabel}>
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
