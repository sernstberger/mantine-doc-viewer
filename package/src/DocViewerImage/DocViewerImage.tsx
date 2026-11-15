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
import { ImageView } from './ImageView';
import classes from '../DocViewer.module.css';

export type DocViewerImageStylesNames =
  | 'image'
  | 'imageStage'
  | 'imageCanvas'
  | 'imageFrame'
  | 'imageOverlay';

export interface DocViewerImageProps
  extends BoxProps, CompoundStylesApiProps<DocViewerImageFactory>, ElementProps<'div'> {
  /** Alternative text of the image, `fileName` by default */
  alt?: string;
}

export type DocViewerImageFactory = Factory<{
  props: DocViewerImageProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerImageStylesNames;
  compound: true;
}>;

/** Image view with its toolbar */
export const DocViewerImage = factory<DocViewerImageFactory>((_props) => {
  useProps('DocViewerImage', null, _props);
  useDocViewerContext();
  return <ImageView />;
});

DocViewerImage.classes = classes;
DocViewerImage.displayName = 'mantine-doc-viewer/DocViewerImage';
