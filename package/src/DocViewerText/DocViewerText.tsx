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
import type { DocViewerCodeProps } from '../DocViewerCode/DocViewerCode';
import type { DocViewerMarkdownProps } from '../DocViewerMarkdown/DocViewerMarkdown';
import { DocViewerLayoutContext, mergePartProps } from '../DocViewerRoot/layout-context';
import classes from '../DocViewer.module.css';
import { TextView } from './TextView';

export type DocViewerTextStylesNames = 'body' | 'text' | 'empty';

export interface DocViewerTextProps
  extends BoxProps, CompoundStylesApiProps<DocViewerTextFactory>, ElementProps<'div'> {
  /** Largest file that is shown, in bytes @default 2_000_000 */
  maxSize?: number;
}

export type DocViewerTextFactory = Factory<{
  props: DocViewerTextProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerTextStylesNames;
  compound: true;
}>;

/** Props of whichever of Text, Code or Markdown is shown, for the simple component's `textProps` */
export type DocViewerTextViewProps = DocViewerTextProps &
  DocViewerCodeProps &
  DocViewerMarkdownProps;

/** Plain text view with its toolbar */
export const DocViewerText = factory<DocViewerTextFactory>((_props) => {
  const { language, codeHighlightProps, ...textProps } =
    use(DocViewerLayoutContext).textProps ?? {};
  const props = useProps('DocViewerText', null, mergePartProps(textProps, _props));
  useDocViewerContext();
  return <TextView {...props} />;
});

DocViewerText.classes = classes;
DocViewerText.displayName = 'mantine-doc-viewer/DocViewerText';
