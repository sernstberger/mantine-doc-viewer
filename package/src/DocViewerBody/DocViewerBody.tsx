import { useState } from 'react';
import {
  Box,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { useDocumentTitle, useDocViewerContext } from '../doc-viewer.context';
import { useKeepScroll } from '../hooks/keep-scroll';
import { getRegionProps } from '../utils/a11y';
import classes from '../DocViewer.module.css';

export type DocViewerBodyStylesNames = 'body';

export interface DocViewerBodyProps
  extends BoxProps, CompoundStylesApiProps<DocViewerBodyFactory>, ElementProps<'div'> {
  /** Makes the body a named, focusable region, set it once the content has loaded @default true */
  focusable?: boolean;
}

export type DocViewerBodyFactory = Factory<{
  props: DocViewerBodyProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerBodyStylesNames;
  compound: true;
}>;

const defaultProps = {
  focusable: true,
} satisfies Partial<DocViewerBodyProps>;

/** Scrollable area under the toolbar, with the viewer's styles and accessibility, for custom views */
export const DocViewerBody = factory<DocViewerBodyFactory>((_props) => {
  const { classNames, className, style, styles, vars, focusable, children, ref, ...others } =
    useProps('DocViewerBody', defaultProps, _props);
  const { getStyles, src, keepView } = useDocViewerContext();
  const title = useDocumentTitle();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  useKeepScroll(node, focusable, src, keepView);
  const mergedRef = useMergedRef(ref, setNode);

  return (
    <Box
      ref={mergedRef}
      {...getStyles('body', { className, style, classNames, styles })}
      {...getRegionProps(focusable, title)}
      {...others}
    >
      {children}
    </Box>
  );
});

DocViewerBody.classes = classes;
DocViewerBody.displayName = 'mantine-doc-viewer/DocViewerBody';
