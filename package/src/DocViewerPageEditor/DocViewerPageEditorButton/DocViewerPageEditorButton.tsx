import React from 'react';
import {
  ActionIcon,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocViewerContext, useShowControl } from '../../doc-viewer.context';
import { useReadyPdfSession } from '../../DocViewerRoot/pdf-session-context';
import { DocViewerTooltip, useControlProps } from '../../DocViewerToolbar/DocViewerTooltip';
import { EditPagesIcon } from '../../utils/icons';
import classes from '../../DocViewer.module.css';
import { usePageEditor } from '../page-editor-setup';

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
  const { labels } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  const session = useReadyPdfSession();
  const editor = usePageEditor();
  if (!session || !editor || !show('editPages')) {
    return null;
  }

  return (
    <DocViewerTooltip label={labels.editPagesLabel}>
      <ActionIcon
        ref={editor.editPagesRef}
        {...controlProps()}
        aria-label={labels.editPagesLabel}
        onClick={editor.open}
      >
        <EditPagesIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerPageEditorButton.classes = classes;
DocViewerPageEditorButton.displayName = 'mantine-doc-viewer/DocViewerPageEditorButton';
