import React from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocViewerContext, useShowControl } from '../../doc-viewer.context';
import classes from '../../DocViewer.module.css';
import { useMarkupContext } from '../markup-setup';
import { PdfMarkupBar } from '../PdfMarkupBar';

export type DocViewerMarkupBarStylesNames =
  | 'markupBar'
  | 'markupDivider'
  | 'markupSave'
  | 'control';

export interface DocViewerMarkupBarProps
  extends BoxProps, CompoundStylesApiProps<DocViewerMarkupBarFactory>, ElementProps<'div'> {}

export type DocViewerMarkupBarFactory = Factory<{
  props: DocViewerMarkupBarProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerMarkupBarStylesNames;
  compound: true;
}>;

/** The markup tools, while markup is open or a tool is picked; hidden with the `markup` control */
export const DocViewerMarkupBar = factory<DocViewerMarkupBarFactory>((_props) => {
  useProps('DocViewerMarkupBar', null, _props);
  useDocViewerContext();
  const show = useShowControl();
  const context = useMarkupContext();
  if (!context || !show('markup') || !(context.opened || context.markup.tool !== null)) {
    return null;
  }

  const { markup, save, setOpened } = context;
  return (
    <PdfMarkupBar
      markup={markup}
      onSave={() =>
        save().catch((error: Error) => {
          // eslint-disable-next-line no-console
          console.error(error);
        })
      }
      onClose={() => {
        setOpened(false);
        markup.setTool(null);
      }}
    />
  );
});

DocViewerMarkupBar.classes = classes;
DocViewerMarkupBar.displayName = 'mantine-doc-viewer/DocViewerMarkupBar';
