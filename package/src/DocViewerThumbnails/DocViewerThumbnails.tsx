import React, { use } from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useCallbackRef, useIsomorphicEffect } from '@mantine/hooks';
import { useDocViewerContext } from '../doc-viewer.context';
import { updateDocViewerStateAction } from '../doc-viewer.store';
import { DocViewerLayoutContext, mergePartProps } from '../DocViewerRoot/layout-context';
import { useReadyPdfSession } from '../DocViewerRoot/pdf-session-context';
import { PartStyles } from '../DocViewerPages/PartStyles';
import { useShallowStable } from '../DocViewerRoot/use-shallow-stable';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { getThumbnailsLayout } from '../utils/geometry';
import classes from '../DocViewer.module.css';
import { DEFAULT_THUMBNAILS_WIDTH, PdfThumbnails } from './PdfThumbnails';

export type DocViewerThumbnailsStylesNames =
  | 'thumbnails'
  | 'thumbnail'
  | 'thumbnailImage'
  | 'thumbnailLabel'
  | 'thumbnailDelete'
  | 'dragHandle'
  | 'canvas';

export interface DocViewerThumbnailsProps
  extends BoxProps, CompoundStylesApiProps<DocViewerThumbnailsFactory>, ElementProps<'div'> {
  /** Width of the thumbnails in px in a side rail, half of it in a top or bottom strip, `112` by default */
  width?: number;
}

export type DocViewerThumbnailsFactory = Factory<{
  props: DocViewerThumbnailsProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerThumbnailsStylesNames;
  compound: true;
}>;

const defaultProps = {
  width: DEFAULT_THUMBNAILS_WIDTH,
} satisfies Partial<DocViewerThumbnailsProps>;

type ThumbnailsRailProps = Omit<DocViewerThumbnailsProps, 'width'> & { width: number };

/** The strip of a loaded document, reading the session for what the thumbnails draw from */
function ThumbnailsRail({
  classNames,
  className,
  style,
  styles,
  vars,
  ref,
  width,
  ...others
}: ThumbnailsRailProps) {
  const session = useReadyPdfSession();
  const { store } = useDocViewerContext();
  const position = useDocViewerState(store, (state) => state.thumbnailsPosition);
  const select = useCallbackRef((page: number) => session?.position.goToPage(page, false));
  const stylesOptions = useShallowStable({ className, style });
  const elementProps = useShallowStable(others);
  if (!session) {
    return null;
  }

  const { ready } = session.loaded;
  return (
    <PartStyles classNames={classNames} styles={styles}>
      <PdfThumbnails
        document={ready!.document}
        placeholderSize={ready!.firstPageSize}
        orientation={getThumbnailsLayout(position).orientation}
        currentPage={session.position.currentPage}
        rotation={session.view.rotation}
        layers={session.content.layers}
        onSelect={select}
        width={width}
        stylesOptions={stylesOptions}
        elementProps={elementProps}
        rootRef={ref}
      />
    </PartStyles>
  );
}

/** PDF page thumbnails, shown while they are opened on a loaded document that is not presented */
export const DocViewerThumbnails = factory<DocViewerThumbnailsFactory>((_props) => {
  const layout = use(DocViewerLayoutContext);
  const { width, ...props } = useProps(
    'DocViewerThumbnails',
    defaultProps,
    mergePartProps(layout.thumbnailsProps, _props)
  );
  const { store } = useDocViewerContext();
  const opened = useDocViewerState(store, (state) => state.thumbnailsOpened);
  const presenting = useDocViewerState(store, (state) => state.presenting);

  useIsomorphicEffect(() => {
    updateDocViewerStateAction({ thumbnailsAvailable: true }, store);
    return () => updateDocViewerStateAction({ thumbnailsAvailable: false }, store);
  }, [store]);

  if (!opened || presenting) {
    return null;
  }

  return <ThumbnailsRail {...props} width={width!} />;
});

DocViewerThumbnails.classes = classes;
DocViewerThumbnails.displayName = 'mantine-doc-viewer/DocViewerThumbnails';
