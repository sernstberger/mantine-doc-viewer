import {
  ActionIcon,
  Box,
  BoxProps,
  Menu,
  UnstyledButton,
  type GetStylesApiOptions,
} from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { formatPercent } from '../utils/format';
import { MinusIcon, PlusIcon } from '../utils/icons';
import { MAX_ZOOM, MIN_ZOOM, zoomIn, zoomOut } from '../utils/zoom';
import { toolbarSoftDisabled } from '../utils/a11y';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';

const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface ZoomControlsProps {
  /** Scale currently applied, including a fitted scale */
  scale: number;

  /** Whether the content is fitted to the viewer */
  fitted: boolean;
  fitLabel: string;
  fitIcon: React.ReactNode;
  onZoom: (scale: number) => void;
  onFit: () => void;

  /** The zoom level opens a menu of zoom presets, it resets the zoom to 100% without it */
  withMenu?: boolean;

  /** `classNames` and `styles` of the part */
  stylesApiProps?: GetStylesApiOptions;

  /** Props of the group around the buttons: `className`, `style` and everything the part was given */
  groupProps?: BoxProps & Record<string, unknown>;
}

interface ZoomLevelProps extends Pick<ZoomControlsProps, 'onZoom' | 'stylesApiProps'> {
  percent: string;
}

function ZoomLevelButton({ percent, onZoom, stylesApiProps }: ZoomLevelProps) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <UnstyledButton
      {...getStyles('zoomLevel', stylesApiProps)}
      data-toolbar-toggle
      onClick={() => onZoom(1)}
      aria-label={`${percent}, ${labels.resetZoomLabel}`}
    >
      {percent}
    </UnstyledButton>
  );
}

function ZoomLevelMenu({
  percent,
  fitLabel,
  fitted,
  onZoom,
  onFit,
  stylesApiProps,
}: ZoomLevelProps & Pick<ZoomControlsProps, 'fitLabel' | 'fitted' | 'onFit'>) {
  const { getStyles, labels, locale, unstyled } = useDocViewerContext();

  return (
    <Menu unstyled={unstyled} withinPortal={false} position="bottom" shadow="md">
      <Menu.Target>
        <UnstyledButton
          {...getStyles('zoomLevel', stylesApiProps)}
          data-toolbar-toggle
          aria-label={labels.zoomLevelLabel(percent)}
        >
          {percent}
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown {...getStyles('dropdown', stylesApiProps)}>
        <Menu.Item data-active={fitted || undefined} onClick={onFit}>
          {fitLabel}
        </Menu.Item>
        {ZOOM_PRESETS.map((preset) => (
          <Menu.Item key={preset} onClick={() => onZoom(preset)}>
            {formatPercent(preset, locale)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

export function ZoomControls({
  scale,
  fitted,
  fitLabel,
  fitIcon,
  onZoom,
  onFit,
  withMenu,
  stylesApiProps,
  groupProps,
}: ZoomControlsProps) {
  const { getStyles, labels, locale } = useDocViewerContext();
  const { className, style, ...others } = groupProps ?? {};
  const percent = formatPercent(scale, locale);
  const controlProps = useControlProps();
  const levelProps = { percent, onZoom, stylesApiProps };

  return (
    <Box {...getStyles('zoomControls', { className, style, ...stylesApiProps })} {...others}>
      <DocViewerTooltip label={labels.zoomOutLabel}>
        <ActionIcon
          {...controlProps(false, stylesApiProps)}
          aria-label={labels.zoomOutLabel}
          {...toolbarSoftDisabled(scale <= MIN_ZOOM + 0.001, () => onZoom(zoomOut(scale)))}
        >
          <MinusIcon />
        </ActionIcon>
      </DocViewerTooltip>
      {withMenu ? (
        <ZoomLevelMenu {...levelProps} fitLabel={fitLabel} fitted={fitted} onFit={onFit} />
      ) : (
        <ZoomLevelButton {...levelProps} />
      )}
      <DocViewerTooltip label={labels.zoomInLabel}>
        <ActionIcon
          {...controlProps(false, stylesApiProps)}
          aria-label={labels.zoomInLabel}
          {...toolbarSoftDisabled(scale >= MAX_ZOOM - 0.001, () => onZoom(zoomIn(scale)))}
        >
          <PlusIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <DocViewerTooltip label={fitLabel}>
        <ActionIcon
          {...controlProps(fitted, stylesApiProps)}
          aria-label={fitLabel}
          aria-pressed={fitted}
          onClick={onFit}
        >
          {fitIcon}
        </ActionIcon>
      </DocViewerTooltip>
    </Box>
  );
}
