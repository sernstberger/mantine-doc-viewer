import { type DocViewerFactory, type DocViewerProps, DocViewerBase } from './DocViewerBase';
import type {
  DocViewerCssVariables,
  DocViewerStylesNames,
  DocViewerVariant,
} from './doc-viewer.types';
import {
  type DocViewerRootProps,
  type DocViewerRootStylesNames,
  DocViewerRoot,
} from './DocViewerRoot/DocViewerRoot';
import {
  type DocViewerToolbarProps,
  type DocViewerToolbarStylesNames,
  DocViewerToolbar,
} from './DocViewerToolbar/DocViewerToolbar';
import {
  type DocViewerTitleProps,
  type DocViewerTitleStylesNames,
  DocViewerTitle,
} from './DocViewerTitle/DocViewerTitle';
import {
  type DocViewerPageControlsProps,
  type DocViewerPageControlsStylesNames,
  DocViewerPageControls,
} from './DocViewerPageControls/DocViewerPageControls';
import {
  type DocViewerZoomControlsProps,
  type DocViewerZoomControlsStylesNames,
  DocViewerZoomControls,
} from './DocViewerZoomControls/DocViewerZoomControls';
import {
  type DocViewerThumbnailsButtonProps,
  type DocViewerThumbnailsButtonStylesNames,
  DocViewerThumbnailsButton,
} from './DocViewerThumbnailsButton/DocViewerThumbnailsButton';
import {
  type DocViewerRotateButtonProps,
  type DocViewerRotateButtonStylesNames,
  DocViewerRotateButton,
} from './DocViewerRotateButton/DocViewerRotateButton';
import {
  type DocViewerLayoutMenuProps,
  type DocViewerLayoutMenuStylesNames,
  DocViewerLayoutMenu,
} from './DocViewerLayoutMenu/DocViewerLayoutMenu';
import {
  type DocViewerOutlineButtonProps,
  type DocViewerOutlineButtonStylesNames,
  DocViewerOutlineButton,
} from './DocViewerOutlineButton/DocViewerOutlineButton';
import {
  type DocViewerInfoButtonProps,
  type DocViewerInfoButtonStylesNames,
  DocViewerInfoButton,
} from './DocViewerInfoButton/DocViewerInfoButton';
import {
  type DocViewerPresentationButtonProps,
  type DocViewerPresentationButtonStylesNames,
  DocViewerPresentationButton,
} from './DocViewerPresentationButton/DocViewerPresentationButton';
import {
  type DocViewerSearchButtonProps,
  type DocViewerSearchButtonStylesNames,
  DocViewerSearchButton,
} from './DocViewerSearchButton/DocViewerSearchButton';
import {
  type DocViewerPrintButtonProps,
  type DocViewerPrintButtonStylesNames,
  DocViewerPrintButton,
} from './DocViewerPrintButton/DocViewerPrintButton';
import {
  type DocViewerDownloadButtonProps,
  type DocViewerDownloadButtonStylesNames,
  DocViewerDownloadButton,
} from './DocViewerDownloadButton/DocViewerDownloadButton';
import {
  type DocViewerFullscreenButtonProps,
  type DocViewerFullscreenButtonStylesNames,
  DocViewerFullscreenButton,
} from './DocViewerFullscreenButton/DocViewerFullscreenButton';
import {
  type DocViewerWrapButtonProps,
  type DocViewerWrapButtonStylesNames,
  DocViewerWrapButton,
} from './DocViewerWrapButton/DocViewerWrapButton';
import {
  type DocViewerViewModeControlProps,
  type DocViewerViewModeControlStylesNames,
  DocViewerViewModeControl,
} from './DocViewerViewModeControl/DocViewerViewModeControl';
import {
  type DocViewerMainProps,
  type DocViewerMainStylesNames,
  DocViewerMain,
} from './DocViewerMain/DocViewerMain';
import {
  type DocViewerBodyProps,
  type DocViewerBodyStylesNames,
  DocViewerBody,
} from './DocViewerBody/DocViewerBody';
import {
  type DocViewerPagesProps,
  type DocViewerPagesStylesNames,
  DocViewerPages,
} from './DocViewerPages/DocViewerPages';
import {
  type DocViewerThumbnailsProps,
  type DocViewerThumbnailsStylesNames,
  DocViewerThumbnails,
} from './DocViewerThumbnails/DocViewerThumbnails';
import {
  type DocViewerSearchProps,
  type DocViewerSearchStylesNames,
  DocViewerSearch,
} from './DocViewerSearch/DocViewerSearch';
import {
  type DocViewerOutlineProps,
  type DocViewerOutlineStylesNames,
  DocViewerOutline,
} from './DocViewerOutline/DocViewerOutline';
import {
  type DocViewerDocumentInfoProps,
  type DocViewerDocumentInfoStylesNames,
  DocViewerDocumentInfo,
} from './DocViewerDocumentInfo/DocViewerDocumentInfo';
import {
  type DocViewerPresentationControlsProps,
  type DocViewerPresentationControlsStylesNames,
  DocViewerPresentationControls,
} from './DocViewerPresentationControls/DocViewerPresentationControls';
import {
  type DocViewerOverlayControlsProps,
  type DocViewerOverlayControlsStylesNames,
  DocViewerOverlayControls,
} from './DocViewerOverlayControls/DocViewerOverlayControls';
import {
  type DocViewerImageProps,
  type DocViewerImageStylesNames,
  DocViewerImage,
} from './DocViewerImage/DocViewerImage';
import {
  type DocViewerTextProps,
  type DocViewerTextStylesNames,
  DocViewerText,
} from './DocViewerText/DocViewerText';
import {
  type DocViewerCodeProps,
  type DocViewerCodeStylesNames,
  DocViewerCode,
} from './DocViewerCode/DocViewerCode';
import {
  type DocViewerMarkdownProps,
  type DocViewerMarkdownStylesNames,
  DocViewerMarkdown,
} from './DocViewerMarkdown/DocViewerMarkdown';
import {
  type DocViewerMessageProps,
  type DocViewerMessageStylesNames,
  DocViewerMessage,
} from './DocViewerMessage/DocViewerMessage';
import {
  type DocViewerLoadingProps,
  type DocViewerLoadingStylesNames,
  DocViewerLoading,
} from './DocViewerLoading/DocViewerLoading';
import classes from './DocViewer.module.css';

export type { DocViewerFactory, DocViewerProps } from './DocViewerBase';

export const DocViewer = DocViewerBase;

DocViewer.classes = classes;
DocViewer.displayName = 'mantine-doc-viewer/DocViewer';
DocViewer.Root = DocViewerRoot;
DocViewer.Toolbar = DocViewerToolbar;
DocViewer.Title = DocViewerTitle;
DocViewer.PageControls = DocViewerPageControls;
DocViewer.ZoomControls = DocViewerZoomControls;
DocViewer.ThumbnailsButton = DocViewerThumbnailsButton;
DocViewer.RotateButton = DocViewerRotateButton;
DocViewer.LayoutMenu = DocViewerLayoutMenu;
DocViewer.OutlineButton = DocViewerOutlineButton;
DocViewer.InfoButton = DocViewerInfoButton;
DocViewer.PresentationButton = DocViewerPresentationButton;
DocViewer.SearchButton = DocViewerSearchButton;
DocViewer.PrintButton = DocViewerPrintButton;
DocViewer.DownloadButton = DocViewerDownloadButton;
DocViewer.FullscreenButton = DocViewerFullscreenButton;
DocViewer.WrapButton = DocViewerWrapButton;
DocViewer.ViewModeControl = DocViewerViewModeControl;
DocViewer.Main = DocViewerMain;
DocViewer.Body = DocViewerBody;
DocViewer.Pages = DocViewerPages;
DocViewer.Thumbnails = DocViewerThumbnails;
DocViewer.Search = DocViewerSearch;
DocViewer.Outline = DocViewerOutline;
DocViewer.DocumentInfo = DocViewerDocumentInfo;
DocViewer.PresentationControls = DocViewerPresentationControls;
DocViewer.OverlayControls = DocViewerOverlayControls;
DocViewer.Image = DocViewerImage;
DocViewer.Text = DocViewerText;
DocViewer.Code = DocViewerCode;
DocViewer.Markdown = DocViewerMarkdown;
DocViewer.Message = DocViewerMessage;
DocViewer.Loading = DocViewerLoading;

export namespace DocViewer {
  export type Props = DocViewerProps;
  export type StylesNames = DocViewerStylesNames;
  export type Factory = DocViewerFactory;
  export type CssVariables = DocViewerCssVariables;
  export type Variant = DocViewerVariant;

  export namespace Root {
    export type Props = DocViewerRootProps;
    export type StylesNames = DocViewerRootStylesNames;
  }

  export namespace Toolbar {
    export type Props = DocViewerToolbarProps;
    export type StylesNames = DocViewerToolbarStylesNames;
  }

  export namespace Title {
    export type Props = DocViewerTitleProps;
    export type StylesNames = DocViewerTitleStylesNames;
  }

  export namespace PageControls {
    export type Props = DocViewerPageControlsProps;
    export type StylesNames = DocViewerPageControlsStylesNames;
  }

  export namespace ZoomControls {
    export type Props = DocViewerZoomControlsProps;
    export type StylesNames = DocViewerZoomControlsStylesNames;
  }

  export namespace ThumbnailsButton {
    export type Props = DocViewerThumbnailsButtonProps;
    export type StylesNames = DocViewerThumbnailsButtonStylesNames;
  }

  export namespace RotateButton {
    export type Props = DocViewerRotateButtonProps;
    export type StylesNames = DocViewerRotateButtonStylesNames;
  }

  export namespace LayoutMenu {
    export type Props = DocViewerLayoutMenuProps;
    export type StylesNames = DocViewerLayoutMenuStylesNames;
  }

  export namespace OutlineButton {
    export type Props = DocViewerOutlineButtonProps;
    export type StylesNames = DocViewerOutlineButtonStylesNames;
  }

  export namespace InfoButton {
    export type Props = DocViewerInfoButtonProps;
    export type StylesNames = DocViewerInfoButtonStylesNames;
  }

  export namespace PresentationButton {
    export type Props = DocViewerPresentationButtonProps;
    export type StylesNames = DocViewerPresentationButtonStylesNames;
  }

  export namespace SearchButton {
    export type Props = DocViewerSearchButtonProps;
    export type StylesNames = DocViewerSearchButtonStylesNames;
  }

  export namespace PrintButton {
    export type Props = DocViewerPrintButtonProps;
    export type StylesNames = DocViewerPrintButtonStylesNames;
  }

  export namespace DownloadButton {
    export type Props = DocViewerDownloadButtonProps;
    export type StylesNames = DocViewerDownloadButtonStylesNames;
  }

  export namespace FullscreenButton {
    export type Props = DocViewerFullscreenButtonProps;
    export type StylesNames = DocViewerFullscreenButtonStylesNames;
  }

  export namespace WrapButton {
    export type Props = DocViewerWrapButtonProps;
    export type StylesNames = DocViewerWrapButtonStylesNames;
  }

  export namespace ViewModeControl {
    export type Props = DocViewerViewModeControlProps;
    export type StylesNames = DocViewerViewModeControlStylesNames;
  }

  export namespace Main {
    export type Props = DocViewerMainProps;
    export type StylesNames = DocViewerMainStylesNames;
  }

  export namespace Body {
    export type Props = DocViewerBodyProps;
    export type StylesNames = DocViewerBodyStylesNames;
  }

  export namespace Pages {
    export type Props = DocViewerPagesProps;
    export type StylesNames = DocViewerPagesStylesNames;
  }

  export namespace Thumbnails {
    export type Props = DocViewerThumbnailsProps;
    export type StylesNames = DocViewerThumbnailsStylesNames;
  }

  export namespace Search {
    export type Props = DocViewerSearchProps;
    export type StylesNames = DocViewerSearchStylesNames;
  }

  export namespace Outline {
    export type Props = DocViewerOutlineProps;
    export type StylesNames = DocViewerOutlineStylesNames;
  }

  export namespace DocumentInfo {
    export type Props = DocViewerDocumentInfoProps;
    export type StylesNames = DocViewerDocumentInfoStylesNames;
  }

  export namespace PresentationControls {
    export type Props = DocViewerPresentationControlsProps;
    export type StylesNames = DocViewerPresentationControlsStylesNames;
  }

  export namespace OverlayControls {
    export type Props = DocViewerOverlayControlsProps;
    export type StylesNames = DocViewerOverlayControlsStylesNames;
  }

  export namespace Image {
    export type Props = DocViewerImageProps;
    export type StylesNames = DocViewerImageStylesNames;
  }

  export namespace Text {
    export type Props = DocViewerTextProps;
    export type StylesNames = DocViewerTextStylesNames;
  }

  export namespace Code {
    export type Props = DocViewerCodeProps;
    export type StylesNames = DocViewerCodeStylesNames;
  }

  export namespace Markdown {
    export type Props = DocViewerMarkdownProps;
    export type StylesNames = DocViewerMarkdownStylesNames;
  }

  export namespace Message {
    export type Props = DocViewerMessageProps;
    export type StylesNames = DocViewerMessageStylesNames;
  }

  export namespace Loading {
    export type Props = DocViewerLoadingProps;
    export type StylesNames = DocViewerLoadingStylesNames;
  }
}
