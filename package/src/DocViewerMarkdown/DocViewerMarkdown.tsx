import { use } from 'react';
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
import { useDocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import { DocViewerLayoutContext, mergePartProps } from '../DocViewerRoot/layout-context';
import { CodeView, LazyView, MarkdownView } from '../DocViewerRoot/lazy-views';
import classes from '../DocViewer.module.css';

export type DocViewerMarkdownStylesNames = 'body' | 'markdown' | 'code' | 'empty';

export interface DocViewerMarkdownProps
  extends BoxProps, CompoundStylesApiProps<DocViewerMarkdownFactory>, ElementProps<'div'> {
  /** Largest file that is shown, in bytes @default 2_000_000 */
  maxSize?: number;

  /** Props passed to the CodeHighlight that shows the source */
  codeHighlightProps?: Omit<CodeHighlightProps, 'code' | 'language'>;
}

export type DocViewerMarkdownFactory = Factory<{
  props: DocViewerMarkdownProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerMarkdownStylesNames;
  compound: true;
}>;

/** Markdown view with its toolbar; the source without a markdown adapter */
export const DocViewerMarkdown = factory<DocViewerMarkdownFactory>((_props) => {
  const { language, ...textProps } = use(DocViewerLayoutContext).textProps ?? {};
  const props = useProps('DocViewerMarkdown', null, mergePartProps(textProps, _props));
  useDocViewerContext();
  const { markdown } = useDocViewerAdapters();
  return (
    <LazyView>
      {markdown ? <MarkdownView {...props} /> : <CodeView {...props} language="markdown" />}
    </LazyView>
  );
});

DocViewerMarkdown.classes = classes;
DocViewerMarkdown.displayName = 'mantine-doc-viewer/DocViewerMarkdown';
