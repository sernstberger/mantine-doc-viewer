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
import { PdfReaderThumbnails } from '../DocViewerRoot/PdfReader';
import classes from '../DocViewer.module.css';

export type DocViewerThumbnailsStylesNames =
  | 'thumbnails'
  | 'thumbnail'
  | 'thumbnailImage'
  | 'thumbnailLabel';

export interface DocViewerThumbnailsProps
  extends BoxProps, CompoundStylesApiProps<DocViewerThumbnailsFactory>, ElementProps<'div'> {
  /** Width of the thumbnails in px in a side rail, half of it in a top or bottom strip, `112` by default */
  width?: number;
}

export type DocViewerThumbnailsFactory = Factory<{
  props: DocViewerThumbnailsProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerThumbnailsStylesNames;
  compound: true;
}>;

/** PDF page thumbnails, shown while they are opened */
export const DocViewerThumbnails = factory<DocViewerThumbnailsFactory>((_props) => {
  useProps('DocViewerThumbnails', null, _props);
  useDocViewerContext();
  const session = usePdfSession();
  if (!session) {
    return null;
  }
  return (
    <PdfReaderThumbnails
      ready={session.loaded.ready}
      view={session.view}
      position={session.position}
      content={session.content}
      actions={session.actions}
    />
  );
});

DocViewerThumbnails.classes = classes;
DocViewerThumbnails.displayName = 'mantine-doc-viewer/DocViewerThumbnails';
