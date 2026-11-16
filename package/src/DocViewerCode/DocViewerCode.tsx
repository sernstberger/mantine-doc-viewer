import React, { use } from 'react';
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
import { DocViewerLayoutContext, mergePartProps } from '../DocViewerRoot/layout-context';
import { CodeView, LazyView } from '../DocViewerRoot/lazy-views';
import classes from '../DocViewer.module.css';

export type DocViewerCodeStylesNames = 'body' | 'code' | 'empty';

export interface DocViewerCodeProps
  extends BoxProps, CompoundStylesApiProps<DocViewerCodeFactory>, ElementProps<'div'> {
  /** Largest file that is shown, in bytes @default 2_000_000 */
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
  const layout = use(DocViewerLayoutContext);
  const props = useProps('DocViewerCode', null, mergePartProps(layout.textProps, _props));
  useDocViewerContext();
  return (
    <LazyView>
      <CodeView {...props} />
    </LazyView>
  );
});

DocViewerCode.classes = classes;
DocViewerCode.displayName = 'mantine-doc-viewer/DocViewerCode';
