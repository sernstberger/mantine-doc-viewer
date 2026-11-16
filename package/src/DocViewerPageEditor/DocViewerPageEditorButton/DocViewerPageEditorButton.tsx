import React from 'react';
import { ActionIcon, CompoundStylesApiProps, factory, Factory, useProps } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { useDocViewerContext, useShowControl } from '../../doc-viewer.context';
import type { DocViewerControlProps } from '../../doc-viewer.types';
import { useReadyPdfSession } from '../../DocViewerRoot/pdf-session-context';
import { DocViewerTooltip, useControlProps } from '../../DocViewerToolbar/DocViewerTooltip';
import { EditPagesIcon } from '../../utils/icons';
import classes from '../../DocViewer.module.css';
import { usePageEditor } from '../page-editor-setup';

export type DocViewerPageEditorButtonStylesNames = 'control';

export interface DocViewerPageEditorButtonProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerPageEditorButtonFactory> {}

export type DocViewerPageEditorButtonFactory = Factory<{
  props: DocViewerPageEditorButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerPageEditorButtonStylesNames;
  compound: true;
}>;

/**
 * Opens the page editor, for a custom toolbar (control key `editPages`). Renders nothing until a
 * PDF is loaded and without `createPageEditorExtension` in `extensions`
 */
export const DocViewerPageEditorButton = factory<DocViewerPageEditorButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, ref, onClick, ...others } = useProps(
    'DocViewerPageEditorButton',
    null,
    _props
  );
  const { getStyles } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  const session = useReadyPdfSession();
  const editor = usePageEditor();
  const mergedRef = useMergedRef(ref, editor?.editPagesRef);
  if (!session || !editor || !show('editPages')) {
    return null;
  }

  return (
    <DocViewerTooltip label={editor.labels.editPagesLabel}>
      <ActionIcon
        {...controlProps()}
        {...getStyles('control', { className, style, classNames, styles })}
        ref={mergedRef}
        aria-label={editor.labels.editPagesLabel}
        {...others}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          editor.open();
        }}
      >
        <EditPagesIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerPageEditorButton.classes = classes;
DocViewerPageEditorButton.displayName = 'mantine-doc-viewer/DocViewerPageEditorButton';
