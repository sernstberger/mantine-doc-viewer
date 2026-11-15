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
import { useReadyPdfSession } from '../DocViewerRoot/pdf-session-context';
import { RotateControl } from '../DocViewerToolbar/PdfNavigationControls';
import classes from '../DocViewer.module.css';

export type DocViewerRotateButtonStylesNames = 'control';

export interface DocViewerRotateButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerRotateButtonFactory>, ElementProps<'button'> {}

export type DocViewerRotateButtonFactory = Factory<{
  props: DocViewerRotateButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerRotateButtonStylesNames;
  compound: true;
}>;

/** Turns the pages 90° clockwise */
export const DocViewerRotateButton = factory<DocViewerRotateButtonFactory>((_props) => {
  useProps('DocViewerRotateButton', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  return <RotateControl onRotate={session.view.rotate} />;
});

DocViewerRotateButton.classes = classes;
DocViewerRotateButton.displayName = 'mantine-doc-viewer/DocViewerRotateButton';
