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
import { LayoutControl } from '../DocViewerToolbar/PdfNavigationControls';
import type { DocViewerPageLayout } from '../doc-viewer.types';
import classes from '../DocViewer.module.css';

export type DocViewerLayoutMenuStylesNames = 'control' | 'dropdown';

export interface DocViewerLayoutMenuProps
  extends BoxProps, CompoundStylesApiProps<DocViewerLayoutMenuFactory>, ElementProps<'button'> {
  /** Layouts in the menu, all by default */
  layouts?: DocViewerPageLayout[];
}

export type DocViewerLayoutMenuFactory = Factory<{
  props: DocViewerLayoutMenuProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerLayoutMenuStylesNames;
  compound: true;
}>;

/** Menu of PDF page layouts */
export const DocViewerLayoutMenu = factory<DocViewerLayoutMenuFactory>((_props) => {
  useProps('DocViewerLayoutMenu', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  return <LayoutControl layout={session.view.layout} onLayoutChange={session.view.setLayout} />;
});

DocViewerLayoutMenu.classes = classes;
DocViewerLayoutMenu.displayName = 'mantine-doc-viewer/DocViewerLayoutMenu';
