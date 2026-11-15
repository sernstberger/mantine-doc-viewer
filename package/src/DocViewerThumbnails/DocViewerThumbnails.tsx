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
import { getThumbnailsLayout } from '../utils/geometry';
import classes from '../DocViewer.module.css';
import { PdfThumbnails } from './PdfThumbnails';

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

/** PDF page thumbnails, shown while they are opened on a loaded document that is not presented */
export const DocViewerThumbnails = factory<DocViewerThumbnailsFactory>((_props) => {
  useProps('DocViewerThumbnails', null, _props);
  useDocViewerContext();
  const session = usePdfSession();
  const ready = session?.loaded.ready;
  if (!session || !ready || !session.view.thumbnailsPanel.opened || session.view.presenting) {
    return null;
  }

  const { view, position, content } = session;
  return (
    <PdfThumbnails
      document={ready.document}
      placeholderSize={ready.firstPageSize}
      orientation={getThumbnailsLayout(view.thumbnailsPanel.position).orientation}
      currentPage={position.currentPage}
      rotation={view.rotation}
      layers={content.layers}
      onSelect={(page) => position.goToPage(page, false)}
    />
  );
});

DocViewerThumbnails.classes = classes;
DocViewerThumbnails.displayName = 'mantine-doc-viewer/DocViewerThumbnails';
