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
import { usePdfSession } from '../DocViewerRoot/pdf-session-context';
import { PdfPresentationControls } from '../DocViewerPresentationControls/PdfPresentationControls';
import classes from '../DocViewer.module.css';

export type DocViewerPresentationControlsStylesNames = 'presentationControls' | 'control';

export interface DocViewerPresentationControlsProps
  extends
    BoxProps,
    CompoundStylesApiProps<DocViewerPresentationControlsFactory>,
    ElementProps<'div'> {}

export type DocViewerPresentationControlsFactory = Factory<{
  props: DocViewerPresentationControlsProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerPresentationControlsStylesNames;
  compound: true;
}>;

/** Page count and exit button shown while presenting */
export const DocViewerPresentationControls = factory<DocViewerPresentationControlsFactory>(
  (_props) => {
    useProps('DocViewerPresentationControls', null, _props);
    useDocViewerContext();
    const session = usePdfSession();
    if (!session) {
      return null;
    }
    return (
      <PdfPresentationControls
        currentPage={session.position.currentPage}
        numPages={session.loaded.numPages}
        onExit={session.view.presentation.stop}
      />
    );
  }
);

DocViewerPresentationControls.classes = classes;
DocViewerPresentationControls.displayName = 'mantine-doc-viewer/DocViewerPresentationControls';
