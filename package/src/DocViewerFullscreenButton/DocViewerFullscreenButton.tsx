import React from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import { FullscreenButton } from '../DocViewerToolbar/ToolbarParts';
import classes from '../DocViewer.module.css';

export type DocViewerFullscreenButtonStylesNames = 'control';

export interface DocViewerFullscreenButtonProps
  extends
    BoxProps,
    CompoundStylesApiProps<DocViewerFullscreenButtonFactory>,
    ElementProps<'button'> {}

export type DocViewerFullscreenButtonFactory = Factory<{
  props: DocViewerFullscreenButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerFullscreenButtonStylesNames;
  compound: true;
}>;

/** Shows the viewer full screen, or leaves full screen; nothing where the browser has no full screen */
export const DocViewerFullscreenButton = factory<DocViewerFullscreenButtonFactory>((_props) => {
  useProps('DocViewerFullscreenButton', null, _props);
  useDocViewerContext();
  return <FullscreenButton />;
});

DocViewerFullscreenButton.classes = classes;
DocViewerFullscreenButton.displayName = 'mantine-doc-viewer/DocViewerFullscreenButton';
