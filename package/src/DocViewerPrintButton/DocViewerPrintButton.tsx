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
import { PrintButton } from '../DocViewerToolbar/ToolbarParts';
import classes from '../DocViewer.module.css';

export type DocViewerPrintButtonStylesNames = 'control';

export interface DocViewerPrintButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerPrintButtonFactory>, ElementProps<'button'> {}

export type DocViewerPrintButtonFactory = Factory<{
  props: DocViewerPrintButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerPrintButtonStylesNames;
  compound: true;
}>;

/** Prints the document */
export const DocViewerPrintButton = factory<DocViewerPrintButtonFactory>((_props) => {
  useProps('DocViewerPrintButton', null, _props);
  const { controller } = useDocViewerContext();
  return <PrintButton onPrint={() => controller.current.print?.()} />;
});

DocViewerPrintButton.classes = classes;
DocViewerPrintButton.displayName = 'mantine-doc-viewer/DocViewerPrintButton';
