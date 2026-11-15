import {
  Box,
  BoxProps,
  createVarsResolver,
  ElementProps,
  factory,
  Factory,
  getRadius,
  MantineRadius,
  StylesApiProps,
  useProps,
  useStyles,
} from '@mantine/core';
import React from 'react';
import { detectDocType, DocType } from './detect-doc-type';
import { DocViewerProvider } from './DocViewer.context';
import classes from './DocViewer.module.css';
import { PdfView } from './pdf/PdfView';
import { CodeView } from './text/CodeView';
import { MarkdownView } from './text/MarkdownView';
import { TextView } from './text/TextView';
import { ImageView } from './views/ImageView';
import { UnsupportedView } from './views/UnsupportedView';

export type DocViewerStylesNames =
  | 'root'
  | 'toolbar'
  | 'title'
  | 'controls'
  | 'body'
  | 'image'
  | 'imageStage'
  | 'imageCanvas'
  | 'imageFrame'
  | 'imageOverlay'
  | 'empty'
  | 'pageIndicator'
  | 'zoomLevel'
  | 'pages'
  | 'page'
  | 'canvas'
  | 'textLayer'
  | 'search'
  | 'searchInput'
  | 'searchCount'
  | 'main'
  | 'thumbnails'
  | 'thumbnail'
  | 'thumbnailImage'
  | 'thumbnailLabel'
  | 'text'
  | 'code'
  | 'markdown';

export type DocViewerCssVariables = {
  root: '--doc-viewer-radius';
};

export interface DocViewerProps
  extends BoxProps, StylesApiProps<DocViewerFactory>, ElementProps<'div'> {
  /** Url of the document: a regular url, blob url or data url */
  src: string;

  /** Document type, detected from `mimeType`, `fileName` or `src` when not set */
  type?: DocType;

  /** MIME type of the document, used to detect `type` */
  mimeType?: string;

  /** File name displayed in the toolbar and used for downloads, taken from `src` by default */
  fileName?: string;

  /** Url of the pdf.js worker file (`pdfjs-dist/build/pdf.worker.min.mjs`), required to display PDF files */
  pdfWorkerSrc?: string;

  /** Determines whether PDF page thumbnails are shown when a PDF opens, `false` by default */
  defaultThumbnailsOpened?: boolean;

  /** Largest text, code or markdown file that is displayed, in bytes, `2_000_000` by default */
  maxTextSize?: number;

  /** Highlighter language for code files, detected from the file extension when not set */
  language?: string;

  /** Key of `theme.radius` or any valid CSS value to set `border-radius`, `theme.defaultRadius` by default */
  radius?: MantineRadius;

  /** Content displayed in the toolbar before the download button */
  toolbarSection?: React.ReactNode;

  /** Determines whether the toolbar is displayed, `true` by default */
  withToolbar?: boolean;
}

export type DocViewerFactory = Factory<{
  props: DocViewerProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerStylesNames;
  vars: DocViewerCssVariables;
}>;

const defaultProps: Partial<DocViewerProps> = {
  withToolbar: true,
  maxTextSize: 2_000_000,
};

const varsResolver = createVarsResolver<DocViewerFactory>((_theme, { radius }) => ({
  root: {
    '--doc-viewer-radius': getRadius(radius),
  },
}));

function getFileName(src: string) {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return undefined;
  }

  const name = src.split(/[?#]/)[0].split('/').pop();
  return name ? decodeURIComponent(name) : undefined;
}

function renderView(type: DocType) {
  switch (type) {
    case 'pdf':
      return <PdfView />;
    case 'image':
      return <ImageView />;
    case 'text':
      return <TextView />;
    case 'code':
      return <CodeView />;
    case 'markdown':
      return <MarkdownView />;
    default:
      return <UnsupportedView type={type} />;
  }
}

export const DocViewer = factory<DocViewerFactory>((_props) => {
  const props = useProps('DocViewer', defaultProps, _props);
  const {
    classNames,
    className,
    style,
    styles,
    unstyled,
    vars,
    src,
    type,
    mimeType,
    fileName,
    pdfWorkerSrc,
    defaultThumbnailsOpened,
    maxTextSize,
    language,
    radius,
    toolbarSection,
    withToolbar,
    ...others
  } = props;

  const getStyles = useStyles<DocViewerFactory>({
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
  });

  const resolvedType = type ?? detectDocType({ src, mimeType, fileName });

  return (
    <DocViewerProvider
      value={{
        getStyles,
        src,
        fileName: fileName ?? getFileName(src),
        withToolbar,
        toolbarSection,
        pdfWorkerSrc,
        defaultThumbnailsOpened,
        maxTextSize: maxTextSize!,
        language,
      }}
    >
      <Box {...getStyles('root')} data-doc-type={resolvedType} {...others}>
        {/* Keyed so that zoom, rotation and search reset when the document changes */}
        <React.Fragment key={`${resolvedType}:${src}`}>{renderView(resolvedType)}</React.Fragment>
      </Box>
    </DocViewerProvider>
  );
});

DocViewer.displayName = 'DocViewer';
DocViewer.classes = classes;
