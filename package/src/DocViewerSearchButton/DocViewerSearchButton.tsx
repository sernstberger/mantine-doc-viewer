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
import { SearchControl } from '../DocViewerToolbar/PdfPanelControls';
import classes from '../DocViewer.module.css';

export type DocViewerSearchButtonStylesNames = 'control';

export interface DocViewerSearchButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerSearchButtonFactory>, ElementProps<'button'> {}

export type DocViewerSearchButtonFactory = Factory<{
  props: DocViewerSearchButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerSearchButtonStylesNames;
  compound: true;
}>;

/** Opens and closes PDF search */
export const DocViewerSearchButton = factory<DocViewerSearchButtonFactory>((_props) => {
  useProps('DocViewerSearchButton', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  const { search } = session.content;
  return (
    <SearchControl
      opened={search.opened}
      toggleRef={search.toggleRef}
      onToggle={() => (search.opened ? search.close() : search.open())}
    />
  );
});

DocViewerSearchButton.classes = classes;
DocViewerSearchButton.displayName = 'mantine-doc-viewer/DocViewerSearchButton';
