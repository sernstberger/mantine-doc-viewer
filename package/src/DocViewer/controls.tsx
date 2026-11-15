import { Tooltip, TooltipProps } from '@mantine/core';
import React, { useEffect, useState } from 'react';
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
    // Makes the button a stop for the arrow keys of Mantine's Toolbar
    'data-toolbar-toggle': true,
    size: size.control,
    variant: pressed ? 'light' : 'subtle',
    color: pressed ? (color ?? 'gray') : 'gray',
    'data-pressed': pressed || undefined,
  });
}

/** Full screen is not available in some browsers (iPhone Safari) and inside iframes without permission */
export function useFullscreenAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => setAvailable(!!document.fullscreenEnabled), []);
  return available;
}
