import React from 'react';
import {
  Box,
  BoxProps,
  createVarsResolver,
  ElementProps,
  factory,
  Factory,
  getFontSize,
  getRadius,
  getThemeColor,
  isNumberLike,
  MantineColor,
  MantineRadius,
  MantineSize,
  rem,
  StylesApiProps,
  useProps,
  useStyles,
} from '@mantine/core';
import type { DocViewerLabels } from '../default-labels';
import { DocViewerProvider } from '../doc-viewer.context';
import type { DocViewerStore } from '../doc-viewer.store';
import type {
  DocViewerCssVariables,
  DocViewerExtension,
  DocViewerLoadInfo,
  DocViewerPageLayout,
  DocViewerStylesNames,
  DocViewerThumbnailsPosition,
  DocViewerVariant,
  DocViewerZoom,
} from '../doc-viewer.types';
import type { DocViewerType } from '../utils/get-doc-viewer-type';
import { DOC_VIEWER_SIZES } from '../utils/sizes';
import classes from '../DocViewer.module.css';
import { DocViewerExtensionsProvider } from './extensions-context';
import { PdfSession } from './PdfSession';
import { getRootElementProps } from './root-element-props';
import { useBehaviorStyles } from './use-behavior-styles';
import { useDocViewerRoot } from './use-doc-viewer-root';

export type DocViewerRootStylesNames = DocViewerStylesNames;

export interface DocViewerRootProps
  extends BoxProps, StylesApiProps<DocViewerRootFactory>, ElementProps<'div', 'color'> {
  /** Url of the document: a regular url, blob url or data url */
  src: string;

  /** Document type, detected from `mimeType`, `fileName` or `src` when not set */
  type?: DocViewerType;

  /** MIME type of the document, used to detect `type` */
  mimeType?: string;

  /** File name shown in the title and used for downloads, taken from `src` by default */
  fileName?: string;

  /** Keeps zoom, rotation, layout and scroll when `src` changes to a document of the same type, `false` by default */
  keepView?: boolean;

  /** BCP 47 tag for numbers and dates, the browser's language by default */
  locale?: string;

  /** Text shown or read out by the viewer, merged with `DEFAULT_LABELS` */
  labels?: Partial<DocViewerLabels>;

  /** Store created with `createDocViewer` / `useDocViewer`, an internal one by default */
  store?: DocViewerStore;

  /** Extensions from `mantine-doc-viewer/editor` and `mantine-doc-viewer/markup` */
  extensions?: DocViewerExtension[];

  /** Size of toolbar, buttons and text, `'sm'` by default */
  size?: MantineSize;

  /** Key of `theme.radius` or any valid CSS value to set `border-radius`, `theme.defaultRadius` by default */
  radius?: MantineRadius;

  /** Accent colour of pressed buttons, current thumbnail and focus outlines, `theme.primaryColor` by default */
  color?: MantineColor;

  /** Makes the viewer as tall as its content so the window scrolls, `false` by default. Fixed heights use `h` */
  autosize?: boolean;

  /** Colour behind PDF pages and thumbnails, white by default */
  pageBackground?: MantineColor;

  /** `'light'` (default) | `'dark'` (inverted) | `'auto'` (follows the color scheme) */
  pageColorScheme?: 'light' | 'dark' | 'auto';

  /** PDF page thumbnails are shown when a PDF opens, `false` by default */
  defaultThumbnailsOpened?: boolean;

  /** Side the thumbnails start on, `'left'` by default */
  defaultThumbnailsPosition?: DocViewerThumbnailsPosition;

  /** Page of a PDF to show, counted from 1, for a controlled page */
  page?: number;

  /** Page of a PDF to show when it opens, counted from 1 */
  defaultPage?: number;

  /** Called when the page in view changes */
  onPageChange?: (page: number) => void;

  /** Zoom of a PDF or image, for a controlled zoom */
  zoom?: DocViewerZoom;

  /** Zoom when a PDF or image opens, `'fit'` by default */
  defaultZoom?: DocViewerZoom;

  /** Called with every zoom request and the scale it gives, where 1 is 100% */
  onZoomChange?: (zoom: DocViewerZoom, details: { scale: number }) => void;

  /** Layout of PDF pages, for a controlled layout */
  pageLayout?: DocViewerPageLayout;

  /** Layout of PDF pages when a PDF opens, `'single'` by default */
  defaultPageLayout?: DocViewerPageLayout;

  /** Called when the reader picks a page layout */
  onPageLayoutChange?: (layout: DocViewerPageLayout) => void;

  /** Whether the viewer is full screen, for a controlled state */
  fullscreen?: boolean;

  /** Called when the viewer enters or leaves full screen */
  onFullscreenChange?: (fullscreen: boolean) => void;

  /** Called when the document is shown */
  onDocumentLoad?: (info: DocViewerLoadInfo) => void;

  /** Called when the document cannot be shown */
  onDocumentError?: (error: Error) => void;

  /** Viewer content: parts */
  children: React.ReactNode;
}

export type DocViewerRootFactory = Factory<{
  props: DocViewerRootProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerRootStylesNames;
  vars: DocViewerCssVariables;
  variant: DocViewerVariant;
}>;

export const docViewerRootDefaultProps = {
  size: 'sm',
  defaultZoom: 'fit',
} satisfies Partial<DocViewerRootProps>;

const varsResolver = createVarsResolver<DocViewerRootFactory>(
  (theme, { radius, size, color, pageBackground }) => ({
    root: {
      '--doc-viewer-radius': getRadius(radius),
      '--doc-viewer-color': color ? getThemeColor(color, theme) : undefined,
      '--doc-viewer-font-size': getFontSize(
        (DOC_VIEWER_SIZES[size!] ?? DOC_VIEWER_SIZES.sm).fontSize
      ),
      '--doc-viewer-toolbar-height': rem(
        (DOC_VIEWER_SIZES[size!] ?? DOC_VIEWER_SIZES.sm).toolbarHeight
      ),
      '--doc-viewer-page-background': pageBackground
        ? getThemeColor(pageBackground, theme)
        : undefined,
    },
  })
);

export const DocViewerRoot = factory<DocViewerRootFactory>((_props) => {
  const props = useProps('DocViewerRoot', docViewerRootDefaultProps, _props);
  const { classNames, className, style, styles, unstyled, vars, attributes, mod, children } = props;
  const getStyles = useBehaviorStyles(
    useStyles<DocViewerRootFactory>({
      name: 'DocViewer',
      classes,
      props,
      className,
      style,
      classNames,
      styles,
      unstyled,
      vars,
      varsResolver,
      attributes,
      stable: true,
    })
  );
  const { value, session, partVars, withPdfSession } = useDocViewerRoot(props, getStyles);
  const { size, autosize, pageColorScheme, keepView, src, extensions } = props;

  return (
    <DocViewerProvider value={value}>
      <Box
        ref={session.rootRef}
        {...getStyles('root')}
        mod={[
          {
            size: isNumberLike(size) ? undefined : size,
            fullscreen: session.fullscreen.fullscreen,
            'auto-height': autosize,
            'doc-type': session.type,
            'page-color-scheme': pageColorScheme === 'light' ? undefined : pageColorScheme,
          },
          mod,
        ]}
        __vars={partVars}
        {...getRootElementProps(props)}
      >
        <DocViewerExtensionsProvider extensions={extensions}>
          {withPdfSession ? (
            <PdfSession key={keepView ? 'pdf' : src}>{children}</PdfSession>
          ) : (
            children
          )}
        </DocViewerExtensionsProvider>
      </Box>
    </DocViewerProvider>
  );
});

DocViewerRoot.displayName = 'mantine-doc-viewer/DocViewerRoot';
DocViewerRoot.classes = classes;
