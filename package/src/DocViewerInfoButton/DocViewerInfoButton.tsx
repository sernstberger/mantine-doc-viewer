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
import { InfoControl } from '../DocViewerToolbar/PdfPanelControls';
import classes from '../DocViewer.module.css';

export type DocViewerInfoButtonStylesNames = 'control' | 'dropdown';

export interface DocViewerInfoButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerInfoButtonFactory>, ElementProps<'button'> {}

export type DocViewerInfoButtonFactory = Factory<{
  props: DocViewerInfoButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerInfoButtonStylesNames;
  compound: true;
}>;

/** Opens the properties, attachments and layers of a PDF in a popover */
export const DocViewerInfoButton = factory<DocViewerInfoButtonFactory>((_props) => {
  useProps('DocViewerInfoButton', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  const { pdfLayers } = session.content;
  return (
    <InfoControl
      document={session.loaded.ready!.document}
      layers={pdfLayers.layers}
      onLayerChange={pdfLayers.setVisible}
    />
  );
});

DocViewerInfoButton.classes = classes;
DocViewerInfoButton.displayName = 'mantine-doc-viewer/DocViewerInfoButton';
