import { ActionIcon, CompoundStylesApiProps, factory, Factory, useProps } from '@mantine/core';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import type { DocViewerControlProps } from '../doc-viewer.types';
import { docViewerActions } from '../doc-viewer.store';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import {
  DocViewerTooltip,
  useControlProps,
  useFullscreenAvailable,
} from '../DocViewerToolbar/DocViewerTooltip';
import { FullscreenExitIcon, FullscreenIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerFullscreenButtonStylesNames = 'control';

export interface DocViewerFullscreenButtonProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerFullscreenButtonFactory> {}

export type DocViewerFullscreenButtonFactory = Factory<{
  props: DocViewerFullscreenButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerFullscreenButtonStylesNames;
  compound: true;
}>;

/** Shows the viewer full screen, or leaves full screen; nothing where the browser has no full screen */
export const DocViewerFullscreenButton = factory<DocViewerFullscreenButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, onClick, ...others } = useProps(
    'DocViewerFullscreenButton',
    null,
    _props
  );
  const { store, labels } = useDocViewerContext();
  const fullscreen = useDocViewerState(store, (state) => state.fullscreen);
  const show = useShowControl();
  const available = useFullscreenAvailable();
  const controlProps = useControlProps();

  if (!show('fullscreen') || !available) {
    return null;
  }

  const label = fullscreen ? labels.exitFullscreenLabel : labels.enterFullscreenLabel;

  return (
    <DocViewerTooltip label={label}>
      <ActionIcon
        {...controlProps(fullscreen, { className, style, classNames, styles })}
        aria-label={label}
        {...others}
        onClick={(event) => {
          docViewerActions.toggleFullscreen(store);
          onClick?.(event);
        }}
      >
        {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerFullscreenButton.classes = classes;
DocViewerFullscreenButton.displayName = 'mantine-doc-viewer/DocViewerFullscreenButton';
