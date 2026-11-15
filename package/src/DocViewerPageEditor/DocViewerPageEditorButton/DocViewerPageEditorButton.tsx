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
import { useReadyPdfSession } from '../../DocViewerRoot/pdf-session-context';
import { EditPagesControl } from '../../DocViewerToolbar/PdfPanelControls';
import classes from '../../DocViewer.module.css';

export type DocViewerPageEditorButtonStylesNames = 'control';

export interface DocViewerPageEditorButtonProps
  extends
    BoxProps,
    CompoundStylesApiProps<DocViewerPageEditorButtonFactory>,
    ElementProps<'button'> {}

export type DocViewerPageEditorButtonFactory = Factory<{
  props: DocViewerPageEditorButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerPageEditorButtonStylesNames;
  compound: true;
}>;

/** Opens the page editor, for a custom toolbar (control key `editPages`) */
export const DocViewerPageEditorButton = factory<DocViewerPageEditorButtonFactory>((_props) => {
  useProps('DocViewerPageEditorButton', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  return (
    <EditPagesControl
      onEditPages={() => session.modes.setEditing(true)}
      buttonRef={session.modes.editPagesRef}
    />
  );
});

DocViewerPageEditorButton.classes = classes;
DocViewerPageEditorButton.displayName = 'mantine-doc-viewer/DocViewerPageEditorButton';
