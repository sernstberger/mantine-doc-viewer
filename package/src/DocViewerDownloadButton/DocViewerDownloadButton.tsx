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
import { DownloadButton } from '../DocViewerToolbar/ToolbarParts';
import classes from '../DocViewer.module.css';

export type DocViewerDownloadButtonStylesNames = 'control';

export interface DocViewerDownloadButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerDownloadButtonFactory>, ElementProps<'a'> {}

export type DocViewerDownloadButtonFactory = Factory<{
  props: DocViewerDownloadButtonProps;
  ref: HTMLAnchorElement;
  stylesNames: DocViewerDownloadButtonStylesNames;
  compound: true;
}>;

/** Downloads the document */
export const DocViewerDownloadButton = factory<DocViewerDownloadButtonFactory>((_props) => {
  useProps('DocViewerDownloadButton', null, _props);
  useDocViewerContext();
  return <DownloadButton />;
});

DocViewerDownloadButton.classes = classes;
DocViewerDownloadButton.displayName = 'mantine-doc-viewer/DocViewerDownloadButton';
