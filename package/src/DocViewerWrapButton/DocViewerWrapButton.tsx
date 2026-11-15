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

export type DocViewerWrapButtonStylesNames = 'control';

export interface DocViewerWrapButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerWrapButtonFactory>, ElementProps<'button'> {}

export type DocViewerWrapButtonFactory = Factory<{
  props: DocViewerWrapButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerWrapButtonStylesNames;
  compound: true;
}>;

/** Wraps long lines of text files */
export const DocViewerWrapButton = factory<DocViewerWrapButtonFactory>((_props) => {
  useProps('DocViewerWrapButton', null, _props);
  useDocViewerContext();
  return null;
});

DocViewerWrapButton.classes = classes;
DocViewerWrapButton.displayName = 'mantine-doc-viewer/DocViewerWrapButton';
