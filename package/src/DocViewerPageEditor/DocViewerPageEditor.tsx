import React from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import classes from '../DocViewer.module.css';
import { useReadyPdfSession } from '../DocViewerRoot/pdf-session-context';
import { usePageEditor } from './page-editor-setup';
import { PageEditorStylesProvider, usePageEditorGetStyles } from './page-editor-styles';
import { PageEditorView } from './PageEditorView';

export type DocViewerPageEditorStylesNames =
  | 'editor'
  | 'editorBar'
  | 'editorTitle'
  | 'editorCount'
  | 'editorPages'
  | 'editorPage'
  | 'editorButton';

export interface DocViewerPageEditorProps
  extends BoxProps, CompoundStylesApiProps<DocViewerPageEditorFactory>, ElementProps<'div'> {}

export type DocViewerPageEditorFactory = Factory<{
  props: DocViewerPageEditorProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerPageEditorStylesNames;
  compound: true;
}>;

/**
 * The page editor while it is open: reorder, rotate, remove and extract pages. `DocViewer.Main`
 * shows it in place of the pages; place it yourself in a layout without `DocViewer.Main`
 */
export const DocViewerPageEditor = factory<DocViewerPageEditorFactory>((_props) => {
  const { classNames, className, style, styles, vars, ...others } = useProps(
    'DocViewerPageEditor',
    null,
    _props
  );
  const getStyles = usePageEditorGetStyles({ classNames, styles });
  const session = useReadyPdfSession();
  const editor = usePageEditor();
  if (!session || !editor?.editing) {
    return null;
  }

  return (
    <PageEditorStylesProvider value={getStyles}>
      <PageEditorView
        {...getStyles('editor', { className, style })}
        {...others}
        document={session.loaded.ready!.document}
        onCancel={editor.close}
        onSave={editor.save}
        onDone={(bytes) => {
          editor.close();
          bytes && session.actions.showBytes(bytes);
        }}
      />
    </PageEditorStylesProvider>
  );
});

DocViewerPageEditor.classes = classes;
DocViewerPageEditor.displayName = 'mantine-doc-viewer/DocViewerPageEditor';
