import { Tooltip, TooltipProps, type GetStylesApiOptions } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { useDocViewerToolbarContext } from './toolbar-context';

const TOOLTIP_EVENTS = { hover: true, focus: true, touch: false };

/**
 * Toolbar tooltip with the `tooltipProps` of its toolbar. It also shows on keyboard focus, and
 * stays inside the viewer: a portal to `document.body` is not painted in full screen
 */
export function DocViewerTooltip(props: TooltipProps) {
  const toolbar = useDocViewerToolbarContext();
  return (
    <Tooltip events={TOOLTIP_EVENTS} withinPortal={false} {...toolbar?.tooltipProps} {...props} />
  );
}

/** Props shared by every toolbar button: size, colours and the `control` Styles API selector */
export function useControlProps() {
  const { getStyles, size, color } = useDocViewerContext();

  return (pressed?: boolean, stylesApiProps?: GetStylesApiOptions) => ({
    ...getStyles('control', stylesApiProps),
    'data-toolbar-toggle': true,
    size: size.control,
    variant: pressed ? 'light' : 'subtle',
    color: pressed ? color : 'gray',
    'data-pressed': pressed || undefined,
  });
}

/** Full screen is not available in some browsers (iPhone Safari) and inside iframes without permission */
export function useFullscreenAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => setAvailable(!!document.fullscreenEnabled), []);
  return available;
}
