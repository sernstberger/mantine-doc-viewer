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
import { PageNavigationControl } from '../DocViewerToolbar/PdfNavigationControls';
import classes from '../DocViewer.module.css';

export type DocViewerPageControlsStylesNames = 'pageIndicator' | 'control';

export interface DocViewerPageControlsProps
  extends BoxProps, CompoundStylesApiProps<DocViewerPageControlsFactory>, ElementProps<'div'> {}

export type DocViewerPageControlsFactory = Factory<{
  props: DocViewerPageControlsProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerPageControlsStylesNames;
  compound: true;
}>;

/** Previous and next page buttons and the page number of a PDF */
export const DocViewerPageControls = factory<DocViewerPageControlsFactory>((_props) => {
  useProps('DocViewerPageControls', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  return (
    <PageNavigationControl
      currentPage={session.position.currentPage}
      numPages={session.loaded.numPages}
      onPage={session.position.goToPage}
    />
  );
});

DocViewerPageControls.classes = classes;
DocViewerPageControls.displayName = 'mantine-doc-viewer/DocViewerPageControls';
