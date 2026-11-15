import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { docViewerActions } from '../doc-viewer.store';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { PDF_OR_IMAGE, useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import { fitsToHeight } from '../utils/geometry';
import { FitScreenIcon, FitWidthIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';
import { ZoomControls } from './ZoomControls';

export type DocViewerZoomControlsStylesNames = 'zoomLevel' | 'dropdown' | 'control';

export interface DocViewerZoomControlsProps
  extends BoxProps, CompoundStylesApiProps<DocViewerZoomControlsFactory>, ElementProps<'div'> {
  /** Determines whether the zoom level opens a menu of zoom presets, otherwise it resets the zoom to 100%, `false` by default */
  withMenu?: boolean;
}

export type DocViewerZoomControlsFactory = Factory<{
  props: DocViewerZoomControlsProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerZoomControlsStylesNames;
  compound: true;
}>;

const defaultProps = {
  withMenu: false,
} satisfies Partial<DocViewerZoomControlsProps>;

/** Zoom out, zoom level, zoom in and fit buttons of a PDF or an image */
export const DocViewerZoomControls = factory<DocViewerZoomControlsFactory>((_props) => {
  const { classNames, className, style, styles, vars, withMenu, ...others } = useProps(
    'DocViewerZoomControls',
    defaultProps,
    _props
  );
  const { store, labels } = useDocViewerContext();
  const ready = useReadyDocument(PDF_OR_IMAGE);
  const type = useDocViewerState(store, (state) => state.type);
  const scale = useDocViewerState(store, (state) => state.scale);
  const fitted = useDocViewerState(store, (state) => state.zoom === 'fit');
  const fitsHeight = useDocViewerState(store, (state) => fitsToHeight(state.pageLayout));
  const show = useShowControl();

  if (!ready || !show('zoom')) {
    return null;
  }

  const pdf = type === 'pdf';
  return (
    <ZoomControls
      scale={scale}
      fitted={fitted}
      fitLabel={pdf && !fitsHeight ? labels.fitToWidthLabel : labels.fitToViewLabel}
      fitIcon={pdf ? <FitWidthIcon /> : <FitScreenIcon />}
      onZoom={(zoom) => docViewerActions.setZoom(zoom, store)}
      onFit={() => docViewerActions.setZoom('fit', store)}
      withMenu={withMenu}
      stylesApiProps={{ classNames, styles }}
      groupProps={{ className, style, ...others }}
    />
  );
});

DocViewerZoomControls.classes = classes;
DocViewerZoomControls.displayName = 'mantine-doc-viewer/DocViewerZoomControls';
