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
import { DocViewerPages } from '../DocViewerPages/DocViewerPages';
import { DocViewerPresentationControls } from '../DocViewerPresentationControls/DocViewerPresentationControls';
import { usePdfSession } from '../DocViewerRoot/pdf-session-context';
import { DocViewerThumbnails } from '../DocViewerThumbnails/DocViewerThumbnails';
import classes from '../DocViewer.module.css';
import { PdfMain } from './PdfMain';

export type DocViewerMainStylesNames = 'main';

export interface DocViewerMainProps
  extends BoxProps, CompoundStylesApiProps<DocViewerMainFactory>, ElementProps<'div'> {
  /** Content of the row under the toolbar, thumbnails and pages by default */
  children?: React.ReactNode;
}

export type DocViewerMainFactory = Factory<{
  props: DocViewerMainProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerMainStylesNames;
  compound: true;
}>;

/** The row under the toolbar: thumbnails, pages and presentation controls of a PDF */
export const DocViewerMain = factory<DocViewerMainFactory>((_props) => {
  const { children } = useProps('DocViewerMain', null, _props);
  useDocViewerContext();
  const session = usePdfSession();
  if (!session) {
    return null;
  }

  return (
    <PdfMain
      position={session.view.thumbnailsPanel.position}
      presenting={session.view.presenting}
      thumbnails={<DocViewerThumbnails />}
      presentationControls={<DocViewerPresentationControls />}
    >
      {children ?? <DocViewerPages />}
    </PdfMain>
  );
});

DocViewerMain.classes = classes;
DocViewerMain.displayName = 'mantine-doc-viewer/DocViewerMain';
