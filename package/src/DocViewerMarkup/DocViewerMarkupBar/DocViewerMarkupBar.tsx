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

export type DocViewerMarkupBarStylesNames =
  | 'markupBar'
  | 'markupDivider'
  | 'markupSave'
  | 'control';

export interface DocViewerMarkupBarProps
  extends BoxProps, CompoundStylesApiProps<DocViewerMarkupBarFactory>, ElementProps<'div'> {}

export type DocViewerMarkupBarFactory = Factory<{
  props: DocViewerMarkupBarProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerMarkupBarStylesNames;
  compound: true;
}>;

/** The markup tools, under the toolbar while markup is open */
export const DocViewerMarkupBar = factory<DocViewerMarkupBarFactory>((_props) => {
  useProps('DocViewerMarkupBar', null, _props);
  useDocViewerContext();
  return null;
});

DocViewerMarkupBar.classes = classes;
DocViewerMarkupBar.displayName = 'mantine-doc-viewer/DocViewerMarkupBar';
