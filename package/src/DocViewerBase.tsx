import React, { useMemo } from 'react';
import { factory, Factory, useProps } from '@mantine/core';
import type {
  DocViewerControl,
  DocViewerCssVariables,
  DocViewerStylesNames,
  DocViewerVariant,
} from './doc-viewer.types';
import type { DocViewerBody } from './DocViewerBody/DocViewerBody';
import type { DocViewerCode } from './DocViewerCode/DocViewerCode';
import type { DocViewerDocumentInfo } from './DocViewerDocumentInfo/DocViewerDocumentInfo';
import type { DocViewerDownloadButton } from './DocViewerDownloadButton/DocViewerDownloadButton';
import type { DocViewerFullscreenButton } from './DocViewerFullscreenButton/DocViewerFullscreenButton';
import type { DocViewerImage, DocViewerImageProps } from './DocViewerImage/DocViewerImage';
import type { DocViewerInfoButton } from './DocViewerInfoButton/DocViewerInfoButton';
import type { DocViewerLayoutMenu } from './DocViewerLayoutMenu/DocViewerLayoutMenu';
import type { DocViewerLoading } from './DocViewerLoading/DocViewerLoading';
import type { DocViewerMain } from './DocViewerMain/DocViewerMain';
import type { DocViewerMarkdown } from './DocViewerMarkdown/DocViewerMarkdown';
import type { DocViewerMessage } from './DocViewerMessage/DocViewerMessage';
import type { DocViewerOutline } from './DocViewerOutline/DocViewerOutline';
import type { DocViewerOutlineButton } from './DocViewerOutlineButton/DocViewerOutlineButton';
import type { DocViewerOverlayControls } from './DocViewerOverlayControls/DocViewerOverlayControls';
import type { DocViewerPageControls } from './DocViewerPageControls/DocViewerPageControls';
import type { DocViewerPages, DocViewerPagesProps } from './DocViewerPages/DocViewerPages';
import type { DocViewerPresentationButton } from './DocViewerPresentationButton/DocViewerPresentationButton';
import type { DocViewerPresentationControls } from './DocViewerPresentationControls/DocViewerPresentationControls';
import type { DocViewerPrintButton } from './DocViewerPrintButton/DocViewerPrintButton';
import type { DocViewerRotateButton } from './DocViewerRotateButton/DocViewerRotateButton';
import { LegacyLayout } from './DocViewerRoot/LegacyLayout';
import { DocViewerLayoutContext } from './DocViewerRoot/layout-context';
import {
  DocViewerRoot,
  docViewerRootDefaultProps,
  type DocViewerRootProps,
} from './DocViewerRoot/DocViewerRoot';
import type { DocViewerSearch, DocViewerSearchProps } from './DocViewerSearch/DocViewerSearch';
import type { DocViewerSearchButton } from './DocViewerSearchButton/DocViewerSearchButton';
import type { DocViewerText, DocViewerTextViewProps } from './DocViewerText/DocViewerText';
import type {
  DocViewerThumbnails,
  DocViewerThumbnailsProps,
} from './DocViewerThumbnails/DocViewerThumbnails';
import type { DocViewerThumbnailsButton } from './DocViewerThumbnailsButton/DocViewerThumbnailsButton';
import type { DocViewerTitle } from './DocViewerTitle/DocViewerTitle';
import type { DocViewerToolbar, DocViewerToolbarProps } from './DocViewerToolbar/DocViewerToolbar';
import type { DocViewerViewModeControl } from './DocViewerViewModeControl/DocViewerViewModeControl';
import type { DocViewerWrapButton } from './DocViewerWrapButton/DocViewerWrapButton';
import type { DocViewerZoomControls } from './DocViewerZoomControls/DocViewerZoomControls';

export interface DocViewerProps extends Omit<DocViewerRootProps, 'children'> {
  /** Custom layout, replaces the default layout for the document type */
  children?: React.ReactNode;

  /** Determines whether the toolbar is shown, `true` by default */
  withToolbar?: boolean;

  /** Toolbar and overlay controls to hide, for example `{ print: false, rotate: false }` */
  toolbarControls?: Partial<Record<DocViewerControl, boolean>>;

  /** Zoom and full screen buttons floating over the document, `false` by default */
  withOverlayControls?: boolean;

  /** Props passed to the default toolbar */
  toolbarProps?: Omit<DocViewerToolbarProps, 'controls' | 'children'>;

  /** Props passed to the PDF pages */
  pagesProps?: DocViewerPagesProps;

  /** Props passed to the PDF page thumbnails */
  thumbnailsProps?: DocViewerThumbnailsProps;

  /** Props passed to the PDF search bar */
  searchProps?: DocViewerSearchProps;

  /** Props passed to the image view */
  imageProps?: DocViewerImageProps;

  /** Applied to whichever of Text, Code or Markdown is shown */
  textProps?: DocViewerTextViewProps;
}

export type DocViewerFactory = Factory<{
  props: DocViewerProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerStylesNames;
  vars: DocViewerCssVariables;
  variant: DocViewerVariant;
  staticComponents: {
    Root: typeof DocViewerRoot;
    Toolbar: typeof DocViewerToolbar;
    Title: typeof DocViewerTitle;
    PageControls: typeof DocViewerPageControls;
    ZoomControls: typeof DocViewerZoomControls;
    ThumbnailsButton: typeof DocViewerThumbnailsButton;
    RotateButton: typeof DocViewerRotateButton;
    LayoutMenu: typeof DocViewerLayoutMenu;
    OutlineButton: typeof DocViewerOutlineButton;
    InfoButton: typeof DocViewerInfoButton;
    PresentationButton: typeof DocViewerPresentationButton;
    SearchButton: typeof DocViewerSearchButton;
    PrintButton: typeof DocViewerPrintButton;
    DownloadButton: typeof DocViewerDownloadButton;
    FullscreenButton: typeof DocViewerFullscreenButton;
    WrapButton: typeof DocViewerWrapButton;
    ViewModeControl: typeof DocViewerViewModeControl;
    Main: typeof DocViewerMain;
    Body: typeof DocViewerBody;
    Pages: typeof DocViewerPages;
    Thumbnails: typeof DocViewerThumbnails;
    Search: typeof DocViewerSearch;
    Outline: typeof DocViewerOutline;
    DocumentInfo: typeof DocViewerDocumentInfo;
    PresentationControls: typeof DocViewerPresentationControls;
    OverlayControls: typeof DocViewerOverlayControls;
    Image: typeof DocViewerImage;
    Text: typeof DocViewerText;
    Code: typeof DocViewerCode;
    Markdown: typeof DocViewerMarkdown;
    Message: typeof DocViewerMessage;
    Loading: typeof DocViewerLoading;
  };
}>;

const defaultProps = {
  ...docViewerRootDefaultProps,
  withToolbar: true,
} satisfies Partial<DocViewerProps>;

export const DocViewerBase = factory<DocViewerFactory>((_props) => {
  const props = useProps('DocViewer', defaultProps, _props);
  const {
    children,
    withToolbar,
    toolbarControls,
    withOverlayControls,
    toolbarProps,
    pagesProps,
    thumbnailsProps,
    searchProps,
    imageProps,
    textProps,
    ...others
  } = props;

  const layout = useMemo(
    () => ({
      withToolbar,
      toolbarControls,
      withOverlayControls,
      toolbarProps,
      pagesProps,
      thumbnailsProps,
      searchProps,
      imageProps,
      textProps,
    }),
    [
      withToolbar,
      toolbarControls,
      withOverlayControls,
      toolbarProps,
      pagesProps,
      thumbnailsProps,
      searchProps,
      imageProps,
      textProps,
    ]
  );

  return (
    <DocViewerLayoutContext value={layout}>
      <DocViewerRoot {...others}>{children ?? <LegacyLayout />}</DocViewerRoot>
    </DocViewerLayoutContext>
  );
});
