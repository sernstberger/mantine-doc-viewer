import React, { useCallback, useState } from 'react';
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
import { useDocumentTitle, useDocViewerContext as useContextValue } from '../doc-viewer.context';
import type { DocViewerLoadInfo } from '../doc-viewer.types';
import { useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { useKeepScroll } from '../hooks/keep-scroll';
import { getRegionProps } from '../utils/a11y';
import classes from '../DocViewer.module.css';

/**
 * Viewer state for custom views and controls: Styles API (`getStyles`), labels, the document's
 * `src`, `type` and `fileName`, toolbar button props (`controlProps`), the title, and two helpers
 * that report the outcome of a custom view to `onDocumentLoad` and `onDocumentError`
 */
export function useDocViewerContext() {
  const context = useContextValue();
  const controlProps = useControlProps();
  const title = useDocumentTitle();
  const { events, type, mimeType } = context;
  const onLoad = useCallback(
    (info?: Partial<DocViewerLoadInfo>) => events.onDocumentLoad({ type, mimeType, ...info }),
    [events, type, mimeType]
  );
  return { ...context, controlProps, title, onLoad, onError: events.onDocumentError };
}

export type DocViewerBodyStylesNames = 'body';

export interface DocViewerBodyProps
  extends BoxProps, CompoundStylesApiProps<DocViewerBodyFactory>, ElementProps<'div'> {
  /** Makes the body a named, focusable region, set it once the content has loaded, `true` by default */
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
  const { getStyles, src, keepView } = useContextValue();
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
