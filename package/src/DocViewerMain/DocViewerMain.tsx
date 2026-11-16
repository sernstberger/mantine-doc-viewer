import type { ReactNode } from 'react';
import {
  Box,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerPages } from '../DocViewerPages/DocViewerPages';
import { DocViewerPresentationControls } from '../DocViewerPresentationControls/DocViewerPresentationControls';
import { useDocViewerExtensions } from '../DocViewerRoot/extensions-context';
import { DocViewerThumbnails } from '../DocViewerThumbnails/DocViewerThumbnails';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { getThumbnailsLayout } from '../utils/geometry';
import classes from '../DocViewer.module.css';

export type DocViewerMainStylesNames = 'main';

export interface DocViewerMainProps
  extends BoxProps, CompoundStylesApiProps<DocViewerMainFactory>, ElementProps<'div'> {
  /** Content of the row under the toolbar @default thumbnails and pages */
  children?: ReactNode;
}

export type DocViewerMainFactory = Factory<{
  props: DocViewerMainProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerMainStylesNames;
  compound: true;
}>;

/** The screen of the extension whose mode is on (the page editor), null in reading mode */
function useExtensionScreen() {
  const { store } = useDocViewerContext();
  const mode = useDocViewerState(store, (state) => state.mode);
  const extensions = useDocViewerExtensions();
  return extensions.find((extension) => extension.screen?.mode === mode)?.screen?.Component;
}

/**
 * The row under the toolbar: thumbnails, pages and presentation controls of a PDF, in the DOM
 * order the thumbnails position needs. While an extension mode is on it shows that screen instead
 */
export const DocViewerMain = factory<DocViewerMainFactory>((_props) => {
  const { classNames, className, style, styles, vars, children, ...others } = useProps(
    'DocViewerMain',
    null,
    _props
  );
  const { getStyles, store, type, pdfAdapter } = useDocViewerContext();
  const position = useDocViewerState(store, (state) => state.thumbnailsPosition);
  const presenting = useDocViewerState(store, (state) => state.presenting);
  const ready = useDocViewerState(store, (state) => state.status === 'ready');
  const Screen = useExtensionScreen();
  if (type !== 'pdf' || !pdfAdapter) {
    return null;
  }
  if (Screen && ready) {
    return <Screen />;
  }

  const { first } = getThumbnailsLayout(position);
  return (
    <Box
      {...getStyles('main', { className, style, classNames, styles })}
      data-thumbnails-position={position}
      data-presenting={presenting || undefined}
      {...others}
    >
      {children ?? (
        <>
          {first && <DocViewerThumbnails />}
          <DocViewerPages />
          {!first && <DocViewerThumbnails />}
          {presenting && <DocViewerPresentationControls />}
        </>
      )}
    </Box>
  );
});

DocViewerMain.classes = classes;
DocViewerMain.displayName = 'mantine-doc-viewer/DocViewerMain';
