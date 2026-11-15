import React from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { DocViewerProvider, useDocViewerContext } from '../doc-viewer.context';
import { ToolbarHeading } from '../DocViewerToolbar/ToolbarParts';
import classes from '../DocViewer.module.css';

export type DocViewerTitleStylesNames = 'heading' | 'title' | 'subtitle';

export interface DocViewerTitleProps
  extends BoxProps, CompoundStylesApiProps<DocViewerTitleFactory>, ElementProps<'div', 'title'> {
  /** Replaces the file name */
  title?: React.ReactNode;

  /** Small text under the title */
  subtitle?: React.ReactNode;
}

export type DocViewerTitleFactory = Factory<{
  props: DocViewerTitleProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerTitleStylesNames;
  compound: true;
}>;

/** The file name, or a custom title, and a subtitle */
export const DocViewerTitle = factory<DocViewerTitleFactory>((_props) => {
  const { title, subtitle } = useProps('DocViewerTitle', null, _props);
  const ctx = useDocViewerContext();
  const value = {
    ...ctx,
    toolbarTitle: title ?? ctx.toolbarTitle,
    toolbarSubtitle: subtitle ?? ctx.toolbarSubtitle,
  };

  return (
    <DocViewerProvider value={value}>
      <ToolbarHeading />
    </DocViewerProvider>
  );
});

DocViewerTitle.classes = classes;
DocViewerTitle.displayName = 'mantine-doc-viewer/DocViewerTitle';
