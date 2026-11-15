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
import { ThumbnailsControl } from '../DocViewerToolbar/PdfNavigationControls';
import classes from '../DocViewer.module.css';

export type DocViewerThumbnailsButtonStylesNames = 'control' | 'dropdown';

export interface DocViewerThumbnailsButtonProps
  extends
    BoxProps,
    CompoundStylesApiProps<DocViewerThumbnailsButtonFactory>,
    ElementProps<'button'> {
  /** Determines whether the button has a menu to move the thumbnails, `true` by default */
  withPositionMenu?: boolean;
}

export type DocViewerThumbnailsButtonFactory = Factory<{
  props: DocViewerThumbnailsButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerThumbnailsButtonStylesNames;
  compound: true;
}>;

/** Shows and hides the PDF page thumbnails */
export const DocViewerThumbnailsButton = factory<DocViewerThumbnailsButtonFactory>((_props) => {
  useProps('DocViewerThumbnailsButton', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  const panel = session.view.thumbnailsPanel;
  return (
    <ThumbnailsControl
      opened={panel.opened}
      onToggle={() => panel.toggle()}
      position={panel.position}
      onPositionChange={panel.setPosition}
    />
  );
});

DocViewerThumbnailsButton.classes = classes;
DocViewerThumbnailsButton.displayName = 'mantine-doc-viewer/DocViewerThumbnailsButton';
