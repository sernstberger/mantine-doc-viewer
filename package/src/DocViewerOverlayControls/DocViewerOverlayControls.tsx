import {
  ActionIcon,
  Box,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  TooltipProps,
  useProps,
} from '@mantine/core';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { docViewerActions } from '../doc-viewer.store';
import type { DocViewerControl } from '../doc-viewer.types';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { DocViewerTooltip, useFullscreenAvailable } from '../DocViewerToolbar/DocViewerTooltip';
import { DocViewerToolbarContext } from '../DocViewerToolbar/toolbar-context';
import { PDF_OR_IMAGE, useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import { FullscreenExitIcon, FullscreenIcon, MinusIcon, PlusIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerOverlayControlsStylesNames = 'overlayControls' | 'overlayControl';

export interface DocViewerOverlayControlsProps
  extends BoxProps, CompoundStylesApiProps<DocViewerOverlayControlsFactory>, ElementProps<'div'> {
  /** Controls to hide, for example `{ fullscreen: false }` */
  controls?: Partial<Record<DocViewerControl, boolean>>;

  /** Props passed to the tooltip of every control */
  tooltipProps?: Omit<TooltipProps, 'label' | 'children'>;
}

export type DocViewerOverlayControlsFactory = Factory<{
  props: DocViewerOverlayControlsProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerOverlayControlsStylesNames;
  compound: true;
}>;

/** Zoom and full screen buttons floating over the document, for a viewer without a toolbar */
export const DocViewerOverlayControls = factory<DocViewerOverlayControlsFactory>((_props) => {
  const { classNames, className, style, styles, vars, controls, tooltipProps, ...others } =
    useProps('DocViewerOverlayControls', null, _props);
  const { store, getStyles, labels, size } = useDocViewerContext();
  const ready = useReadyDocument(PDF_OR_IMAGE);
  const fullscreen = useDocViewerState(store, (state) => state.fullscreen);
  const show = useShowControl();
  const fullscreenAvailable = useFullscreenAvailable();
  const stylesApiProps = { classNames, styles };
  const buttonProps = {
    ...getStyles('overlayControl', stylesApiProps),
    size: size.control,
    variant: 'default',
    color: 'gray',
  };
  const shown = (control: DocViewerControl) => show(control) && controls?.[control] !== false;

  return (
    <DocViewerToolbarContext value={{ tooltipProps }}>
      <Box {...getStyles('overlayControls', { className, style, classNames, styles })} {...others}>
        {ready && shown('zoom') && (
          <>
            <DocViewerTooltip label={labels.zoomInLabel}>
              <ActionIcon
                {...buttonProps}
                aria-label={labels.zoomInLabel}
                onClick={() => docViewerActions.zoomIn(store)}
              >
                <PlusIcon />
              </ActionIcon>
            </DocViewerTooltip>
            <DocViewerTooltip label={labels.zoomOutLabel}>
              <ActionIcon
                {...buttonProps}
                aria-label={labels.zoomOutLabel}
                onClick={() => docViewerActions.zoomOut(store)}
              >
                <MinusIcon />
              </ActionIcon>
            </DocViewerTooltip>
          </>
        )}
        {shown('fullscreen') && fullscreenAvailable && (
          <DocViewerTooltip
            label={fullscreen ? labels.exitFullscreenLabel : labels.fullscreenLabel}
          >
            <ActionIcon
              {...buttonProps}
              aria-label={labels.fullscreenLabel}
              aria-pressed={fullscreen}
              onClick={() => docViewerActions.toggleFullscreen(store)}
            >
              {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </ActionIcon>
          </DocViewerTooltip>
        )}
      </Box>
    </DocViewerToolbarContext>
  );
});

DocViewerOverlayControls.classes = classes;
DocViewerOverlayControls.displayName = 'mantine-doc-viewer/DocViewerOverlayControls';
