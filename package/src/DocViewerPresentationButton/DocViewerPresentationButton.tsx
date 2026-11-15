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
import { PresentationControl } from '../DocViewerToolbar/PdfPanelControls';
import classes from '../DocViewer.module.css';

export type DocViewerPresentationButtonStylesNames = 'control';

export interface DocViewerPresentationButtonProps
  extends
    BoxProps,
    CompoundStylesApiProps<DocViewerPresentationButtonFactory>,
    ElementProps<'button'> {}

export type DocViewerPresentationButtonFactory = Factory<{
  props: DocViewerPresentationButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerPresentationButtonStylesNames;
  compound: true;
}>;

/** Starts a presentation of a PDF */
export const DocViewerPresentationButton = factory<DocViewerPresentationButtonFactory>((_props) => {
  useProps('DocViewerPresentationButton', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  return (
    <PresentationControl
      onPresent={session.view.presentation.start}
      buttonRef={session.modes.presentRef}
    />
  );
});

DocViewerPresentationButton.classes = classes;
DocViewerPresentationButton.displayName = 'mantine-doc-viewer/DocViewerPresentationButton';
