import React from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  Loader,
  useProps,
  VisuallyHidden,
} from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerMessage } from '../DocViewerMessage/DocViewerMessage';
import classes from '../DocViewer.module.css';

export type DocViewerLoadingStylesNames = 'empty';

export interface DocViewerLoadingProps
  extends BoxProps, CompoundStylesApiProps<DocViewerLoadingFactory>, ElementProps<'div'> {}

export type DocViewerLoadingFactory = Factory<{
  props: DocViewerLoadingProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerLoadingStylesNames;
  compound: true;
}>;

/** Spinner with text for screen readers, a label on the spinner itself is not read out */
export const DocViewerLoading = factory<DocViewerLoadingFactory>((_props) => {
  const props = useProps('DocViewerLoading', null, _props);
  const { labels } = useDocViewerContext();

  return (
    <DocViewerMessage {...props}>
      <Loader size="sm" />
      <VisuallyHidden>{labels.loadingLabel}</VisuallyHidden>
    </DocViewerMessage>
  );
});

DocViewerLoading.classes = classes;
DocViewerLoading.displayName = 'mantine-doc-viewer/DocViewerLoading';
