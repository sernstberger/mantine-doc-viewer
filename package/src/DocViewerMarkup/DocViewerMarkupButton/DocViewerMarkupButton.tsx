import React from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocViewerContext } from '../../doc-viewer.context';
import classes from '../../DocViewer.module.css';

export type DocViewerMarkupButtonStylesNames = 'control';

export interface DocViewerMarkupButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerMarkupButtonFactory>, ElementProps<'button'> {}

export type DocViewerMarkupButtonFactory = Factory<{
  props: DocViewerMarkupButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerMarkupButtonStylesNames;
  compound: true;
}>;

/** Opens and closes the markup tools, for a custom toolbar (control key `markup`) */
export const DocViewerMarkupButton = factory<DocViewerMarkupButtonFactory>((_props) => {
  useProps('DocViewerMarkupButton', null, _props);
  useDocViewerContext();
  return null;
});

DocViewerMarkupButton.classes = classes;
DocViewerMarkupButton.displayName = 'mantine-doc-viewer/DocViewerMarkupButton';
