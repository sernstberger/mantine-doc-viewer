import React from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useCallbackRef } from '@mantine/hooks';
import { useDocViewerContext } from '../doc-viewer.context';
import { useReadyPdfSession } from '../DocViewerRoot/pdf-session-context';
import { useShallowStable } from '../DocViewerRoot/use-shallow-stable';
import { SessionOutline } from '../DocViewerOutline/SessionOutline';
import classes from '../DocViewer.module.css';

export type DocViewerOutlineStylesNames = 'outline' | 'outlineList' | 'outlineItem';

export interface DocViewerOutlineProps
  extends BoxProps, CompoundStylesApiProps<DocViewerOutlineFactory>, ElementProps<'nav'> {}

export type DocViewerOutlineFactory = Factory<{
  props: DocViewerOutlineProps;
  ref: HTMLElement;
  stylesNames: DocViewerOutlineStylesNames;
  compound: true;
}>;

/** Outline (bookmarks) of a PDF, for a sidebar */
export const DocViewerOutline = factory<DocViewerOutlineFactory>((_props) => {
  const { classNames, className, style, styles, vars, ref, ...others } = useProps(
    'DocViewerOutline',
    null,
    _props
  );
  useDocViewerContext();
  const session = useReadyPdfSession();
  const onSelect = useCallbackRef((page: number) => session?.position.goToPage(page));
  const stylesOptions = useShallowStable({ className, style, classNames, styles });
  const elementProps = useShallowStable(others);
  if (!session) {
    return null;
  }

  return (
    <SessionOutline
      document={session.loaded.ready!.document}
      onSelect={onSelect}
      stylesOptions={stylesOptions}
      elementProps={elementProps}
      rootRef={ref}
    />
  );
});

DocViewerOutline.classes = classes;
DocViewerOutline.displayName = 'mantine-doc-viewer/DocViewerOutline';
