import { Fragment, type ReactNode } from 'react';
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
import type { DocViewerLabelsInput } from '../default-labels';
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

  /** File name shown in the title and used for downloads @default taken from `src` */
  fileName?: string;

  /** Keeps zoom, rotation, layout and scroll when `src` changes to a document of the same type @default false */
  keepView?: boolean;

  /** BCP 47 tag for numbers and dates @default the browser's language */
  locale?: string;

  /** Text shown or read out by the viewer, merged with `DEFAULT_LABELS`, `propertyNameLabels` too */
  labels?: DocViewerLabelsInput;

  /** Store created with `createDocViewer` / `useDocViewer` @default an internal store */
  store?: DocViewerStore;

  /** Extensions from `mantine-doc-viewer/editor` and `mantine-doc-viewer/markup` */
  extensions?: DocViewerExtension[];

  /** Size of toolbar, buttons and text @default 'sm' */
  size?: MantineSize;

  /** Key of `theme.radius` or any valid CSS value to set `border-radius` @default theme.defaultRadius */
  radius?: MantineRadius;

  /** Accent color of pressed buttons, current thumbnail and focus outlines @default theme.primaryColor */
  color?: MantineColor;

  /** Makes the viewer as tall as its content so the window scrolls. Fixed heights use `h` @default false */
  autosize?: boolean;

  /** Color behind PDF pages and thumbnails @default white */
  pageBackground?: MantineColor;

  /** `'light'`, `'dark'` (inverted) or `'auto'` (follows the color scheme) @default 'light' */
  pageColorScheme?: 'light' | 'dark' | 'auto';

  /** PDF page thumbnails are shown when a PDF opens @default false */
  defaultThumbnailsOpened?: boolean;

  /** Side the thumbnails start on @default 'left' */
  defaultThumbnailsPosition?: DocViewerThumbnailsPosition;

  /** Page of a PDF to scroll to, counted from 1, whenever it changes. The reader can scroll away, `onPageChange` reports where they are */
  page?: number;

  /** Page of a PDF to show when it opens, counted from 1 */
  defaultPage?: number;

  /** Called when the page in view changes, not for the page the document opens on */
  onPageChange?: (page: number) => void;

  /** Zoom of a PDF or image, for a controlled zoom */
  zoom?: DocViewerZoom;

  /** Zoom when a PDF or image opens @default 'fit' */
  defaultZoom?: DocViewerZoom;

  /** Called with every zoom request and the scale it gives, where 1 is 100% */
  onZoomChange?: (zoom: DocViewerZoom, details: { scale: number }) => void;

  /** Layout of PDF pages, for a controlled layout */
  pageLayout?: DocViewerPageLayout;

  /** Layout of PDF pages when a PDF opens @default 'single' */
  defaultPageLayout?: DocViewerPageLayout;

  /** Called when the reader picks a page layout */
  onPageLayoutChange?: (layout: DocViewerPageLayout) => void;

  /** Enters or leaves full screen whenever it changes. The browser decides, so `onFullscreenChange` reports what happened */
  fullscreen?: boolean;

  /** Called when the viewer enters or leaves full screen */
  onFullscreenChange?: (fullscreen: boolean) => void;

  /** Called when the document is shown */
  onDocumentLoad?: (info: DocViewerLoadInfo) => void;

  /** Called when the document cannot be shown */
  onDocumentError?: (error: Error) => void;

  /** Viewer content: parts */
  children: ReactNode;
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
      '--doc-viewer-page-gap': undefined,
      '--doc-viewer-match-color': undefined,
      '--doc-viewer-active-match-color': undefined,
      '--doc-viewer-thumbnails-width': undefined,
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
  const { value, session, withPdfSession } = useDocViewerRoot(props, getStyles);
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
        {...getRootElementProps(props)}
      >
        <DocViewerExtensionsProvider extensions={extensions}>
          {withPdfSession ? (
            <PdfSession key={keepView ? 'pdf' : src}>{children}</PdfSession>
          ) : (
            <Fragment key={keepView ? 'view' : src}>{children}</Fragment>
          )}
        </DocViewerExtensionsProvider>
      </Box>
    </DocViewerProvider>
  );
});

DocViewerRoot.displayName = 'mantine-doc-viewer/DocViewerRoot';
DocViewerRoot.classes = classes;
