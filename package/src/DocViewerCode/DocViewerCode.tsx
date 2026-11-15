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
import type { CodeHighlightProps } from '@mantine/code-highlight';
import { CodeView, LazyView } from '../DocViewerRoot/lazy-views';
import classes from '../DocViewer.module.css';

export type DocViewerCodeStylesNames = 'body' | 'code' | 'empty';

export interface DocViewerCodeProps
  extends BoxProps, CompoundStylesApiProps<DocViewerCodeFactory>, ElementProps<'div'> {
  /** Largest file that is shown, in bytes, `2_000_000` by default */
  maxSize?: number;

  /** Highlighter language, detected from the file extension when not set */
  language?: string;

  /** Props passed to the CodeHighlight */
  codeHighlightProps?: Omit<CodeHighlightProps, 'code' | 'language'>;
}

export type DocViewerCodeFactory = Factory<{
  props: DocViewerCodeProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerCodeStylesNames;
  compound: true;
}>;

/** Code view with its toolbar, highlighted with @mantine/code-highlight */
export const DocViewerCode = factory<DocViewerCodeFactory>((_props) => {
  const { language } = useProps('DocViewerCode', null, _props);
  useDocViewerContext();
  return (
    <LazyView>
      <CodeView language={language} />
    </LazyView>
  );
});

DocViewerCode.classes = classes;
DocViewerCode.displayName = 'mantine-doc-viewer/DocViewerCode';
