import React from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  TooltipProps,
  useProps,
} from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import type { DocViewerControl } from '../doc-viewer.types';
import { OverlayControls } from './OverlayControls';
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

/** Zoom and full screen buttons floating over the document */
export const DocViewerOverlayControls = factory<DocViewerOverlayControlsFactory>((_props) => {
  useProps('DocViewerOverlayControls', null, _props);
  useDocViewerContext();
  return <OverlayControls />;
});

DocViewerOverlayControls.classes = classes;
DocViewerOverlayControls.displayName = 'mantine-doc-viewer/DocViewerOverlayControls';
