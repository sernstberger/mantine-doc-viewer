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
import { PageEditorScreen } from './PageEditorScreen';

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

/** The page editor screen while the editor is open; `DocViewer.Main` shows it by itself, place it for a custom layout */
export const DocViewerPageEditor = factory<DocViewerPageEditorFactory>((_props) => {
  useProps('DocViewerPageEditor', null, _props);
  useDocViewerContext();
  return <PageEditorScreen />;
});

DocViewerPageEditor.classes = classes;
DocViewerPageEditor.displayName = 'mantine-doc-viewer/DocViewerPageEditor';
