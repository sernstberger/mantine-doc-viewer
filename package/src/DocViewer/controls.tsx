import { Tooltip, TooltipProps } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from './DocViewer.context';

/** Tooltips also show on keyboard focus, so keyboard users can see what an icon button does */
const TOOLTIP_EVENTS = { hover: true, focus: true, touch: false };

/** Toolbar tooltip with the viewer's `tooltipProps` */
export function DocViewerTooltip(props: TooltipProps) {
  const { tooltipProps } = useDocViewerContext();
  return <Tooltip events={TOOLTIP_EVENTS} {...tooltipProps} {...props} />;
}

/** Props shared by every toolbar button: size, colours and the `control` Styles API selector */
export function useControlProps() {
  const { getStyles, size, color } = useDocViewerContext();

  return (pressed?: boolean) => ({
    ...getStyles('control'),
    size: size.control,
    variant: pressed ? 'light' : 'subtle',
    color: pressed ? (color ?? 'gray') : 'gray',
    'data-pressed': pressed || undefined,
  });
}
