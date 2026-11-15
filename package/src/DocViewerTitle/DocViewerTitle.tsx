import React from 'react';
import {
  Box,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocumentTitle, useDocViewerContext, useShowControl } from '../doc-viewer.context';
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
  const { classNames, className, style, styles, vars, title, subtitle, ...others } = useProps(
    'DocViewerTitle',
    null,
    _props
  );
  const ctx = useDocViewerContext();
  const show = useShowControl();
  const documentTitle = useDocumentTitle();
  const stylesApiProps = { classNames, styles };
  const resolvedSubtitle = subtitle ?? ctx.toolbarSubtitle;

  if (!show('title')) {
    return null;
  }

  return (
    <Box {...ctx.getStyles('heading', { className, style, classNames, styles })} {...others}>
      <span {...ctx.getStyles('title', stylesApiProps)}>
        {title ?? ctx.toolbarTitle ?? documentTitle}
      </span>
      {resolvedSubtitle && (
        <span {...ctx.getStyles('subtitle', stylesApiProps)}>{resolvedSubtitle}</span>
      )}
    </Box>
  );
});

DocViewerTitle.classes = classes;
DocViewerTitle.displayName = 'mantine-doc-viewer/DocViewerTitle';
