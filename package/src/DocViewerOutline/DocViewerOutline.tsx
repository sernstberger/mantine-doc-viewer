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
import { SessionOutline } from '../DocViewerOutline/SessionOutline';
import classes from '../DocViewer.module.css';

export type DocViewerOutlineStylesNames = 'outline' | 'outlineList' | 'outlineItem';

export interface DocViewerOutlineProps
  extends BoxProps, CompoundStylesApiProps<DocViewerOutlineFactory>, ElementProps<'nav'> {}

export type DocViewerOutlineFactory = Factory<{
  props: DocViewerOutlineProps;
  ref: HTMLElement;
  stylesNames: DocViewerOutlineStylesNames;
  compound: true;
}>;

/** Outline (bookmarks) of a PDF, for a sidebar */
export const DocViewerOutline = factory<DocViewerOutlineFactory>((_props) => {
  useProps('DocViewerOutline', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  if (!session) {
    return null;
  }
  return <SessionOutline session={session} />;
});

DocViewerOutline.classes = classes;
DocViewerOutline.displayName = 'mantine-doc-viewer/DocViewerOutline';
