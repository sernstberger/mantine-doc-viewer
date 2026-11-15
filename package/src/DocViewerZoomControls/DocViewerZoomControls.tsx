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
import { PdfZoomControl } from '../DocViewerToolbar/PdfNavigationControls';
import classes from '../DocViewer.module.css';

export type DocViewerZoomControlsStylesNames = 'zoomLevel' | 'dropdown' | 'control';

export interface DocViewerZoomControlsProps
  extends BoxProps, CompoundStylesApiProps<DocViewerZoomControlsFactory>, ElementProps<'div'> {
  /** Determines whether the zoom level opens a menu of zoom presets, `true` by default */
  withMenu?: boolean;
}

export type DocViewerZoomControlsFactory = Factory<{
  props: DocViewerZoomControlsProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerZoomControlsStylesNames;
  compound: true;
}>;

/** Zoom out, zoom level and zoom in buttons of a PDF */
export const DocViewerZoomControls = factory<DocViewerZoomControlsFactory>((_props) => {
  useProps('DocViewerZoomControls', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  const { view, position } = session;
  return (
    <PdfZoomControl
      scale={view.scale}
      zoom={view.zoom}
      onZoom={position.zoomTo}
      layout={view.layout}
    />
  );
});

DocViewerZoomControls.classes = classes;
DocViewerZoomControls.displayName = 'mantine-doc-viewer/DocViewerZoomControls';
