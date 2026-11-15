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
import { OutlineControl } from '../DocViewerToolbar/PdfPanelControls';
import classes from '../DocViewer.module.css';

export type DocViewerOutlineButtonStylesNames = 'control' | 'dropdown';

export interface DocViewerOutlineButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerOutlineButtonFactory>, ElementProps<'button'> {}

export type DocViewerOutlineButtonFactory = Factory<{
  props: DocViewerOutlineButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerOutlineButtonStylesNames;
  compound: true;
}>;

/** Opens the outline of a PDF in a popover */
export const DocViewerOutlineButton = factory<DocViewerOutlineButtonFactory>((_props) => {
  useProps('DocViewerOutlineButton', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  return (
    <OutlineControl document={session.loaded.ready!.document} onPage={session.position.goToPage} />
  );
});

DocViewerOutlineButton.classes = classes;
DocViewerOutlineButton.displayName = 'mantine-doc-viewer/DocViewerOutlineButton';
