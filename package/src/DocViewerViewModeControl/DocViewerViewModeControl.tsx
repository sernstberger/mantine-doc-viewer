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
import classes from '../DocViewer.module.css';

export type DocViewerViewModeControlStylesNames = 'viewMode';

export interface DocViewerViewModeControlProps
  extends BoxProps, CompoundStylesApiProps<DocViewerViewModeControlFactory>, ElementProps<'div'> {}

export type DocViewerViewModeControlFactory = Factory<{
  props: DocViewerViewModeControlProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerViewModeControlStylesNames;
  compound: true;
}>;

/** Switches markdown and JSON files between their preview and their source */
export const DocViewerViewModeControl = factory<DocViewerViewModeControlFactory>((_props) => {
  useProps('DocViewerViewModeControl', null, _props);
  useDocViewerContext();
  return null;
});

DocViewerViewModeControl.classes = classes;
DocViewerViewModeControl.displayName = 'mantine-doc-viewer/DocViewerViewModeControl';
