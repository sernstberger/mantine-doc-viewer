import { ActionIcon, Group, UnstyledButton } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { formatPercent } from '../utils/format';
import { MinusIcon, PlusIcon } from '../utils/icons';
import { MAX_ZOOM, MIN_ZOOM, zoomIn, zoomOut } from '../utils/zoom';
import { softDisabled } from '../utils/a11y';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';

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
  const { getStyles, labels, locale } = useDocViewerContext();
  const percent = formatPercent(scale, locale);
  const controlProps = useControlProps();

  return (
    <Group gap={2} wrap="nowrap">
      <DocViewerTooltip label={labels.zoomOutLabel}>
        <ActionIcon
          {...controlProps()}
          aria-label={labels.zoomOutLabel}
          {...softDisabled(scale <= MIN_ZOOM + 0.001, () => onZoom(zoomOut(scale)))}
        >
          <MinusIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <UnstyledButton
        {...getStyles('zoomLevel')}
        data-toolbar-toggle
        onClick={() => onZoom(1)}
        // The name starts with the visible text, for voice control
        aria-label={`${percent}, ${labels.resetZoomLabel}`}
      >
        {percent}
      </UnstyledButton>
      <DocViewerTooltip label={labels.zoomInLabel}>
        <ActionIcon
          {...controlProps()}
          aria-label={labels.zoomInLabel}
          {...softDisabled(scale >= MAX_ZOOM - 0.001, () => onZoom(zoomIn(scale)))}
        >
          <PlusIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <DocViewerTooltip label={fitLabel}>
        <ActionIcon
          {...controlProps(fitted)}
          aria-label={fitLabel}
          aria-pressed={fitted}
          onClick={onFit}
        >
          {fitIcon}
        </ActionIcon>
      </DocViewerTooltip>
    </Group>
  );
}
