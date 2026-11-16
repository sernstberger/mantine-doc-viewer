import React, { use } from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerLayoutContext, mergePartProps } from '../DocViewerRoot/layout-context';
import classes from '../DocViewer.module.css';
import { ImageView } from './ImageView';

export type DocViewerImageStylesNames =
  | 'body'
  | 'image'
  | 'imageStage'
  | 'imageCanvas'
  | 'imageFrame'
  | 'imageOverlay';

export interface DocViewerImageProps
  extends BoxProps, CompoundStylesApiProps<DocViewerImageFactory>, ElementProps<'div'> {
  /** Alternative text of the image @default fileName */
  alt?: string;
}

export type DocViewerImageFactory = Factory<{
  props: DocViewerImageProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerImageStylesNames;
  compound: true;
}>;

/** Image view with its toolbar: zoom, pan, rotate and print */
export const DocViewerImage = factory<DocViewerImageFactory>((_props) => {
  const layout = use(DocViewerLayoutContext);
  const props = useProps('DocViewerImage', null, mergePartProps(layout.imageProps, _props));
  useDocViewerContext();
  return <ImageView {...props} />;
});

DocViewerImage.classes = classes;
DocViewerImage.displayName = 'mantine-doc-viewer/DocViewerImage';
