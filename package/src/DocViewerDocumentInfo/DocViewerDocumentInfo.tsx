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

export type DocViewerDocumentInfoStylesNames =
  | 'documentInfo'
  | 'documentHeading'
  | 'documentLayer'
  | 'properties';

export interface DocViewerDocumentInfoProps
  extends BoxProps, CompoundStylesApiProps<DocViewerDocumentInfoFactory>, ElementProps<'div'> {}

export type DocViewerDocumentInfoFactory = Factory<{
  props: DocViewerDocumentInfoProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerDocumentInfoStylesNames;
  compound: true;
}>;

/** Properties, attachments and layers of a PDF */
export const DocViewerDocumentInfo = factory<DocViewerDocumentInfoFactory>((_props) => {
  useProps('DocViewerDocumentInfo', null, _props);
  useDocViewerContext();
  return null;
});

DocViewerDocumentInfo.classes = classes;
DocViewerDocumentInfo.displayName = 'mantine-doc-viewer/DocViewerDocumentInfo';
