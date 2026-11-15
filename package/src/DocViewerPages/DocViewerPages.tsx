import React, { use } from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  getSpacing,
  getThemeColor,
  MantineColor,
  MantineSpacing,
  useMantineTheme,
  useProps,
} from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import { usePagesRegistration } from '../hooks/pdf/use-pages-config';
import { DocViewerLayoutContext, mergePartProps } from '../DocViewerRoot/layout-context';
import { MAX_CANVAS_PIXELS } from '../utils/render-page';
import { PartStyles } from './PartStyles';
import type { DocViewerPasswordInputProps, DocViewerReadingProgress } from '../doc-viewer.types';
import { usePdfSession } from '../DocViewerRoot/pdf-session-context';
import type { DocViewerRenderPageOverlay } from '../utils/page-overlay';
import type { DocViewerPageRect } from '../utils/page-points';
import type { DocViewerPageTurning } from '../utils/spreads';
import classes from '../DocViewer.module.css';
import { PdfPagesBody } from './PdfPagesBody';

export type DocViewerPagesStylesNames =
  | 'body'
  | 'pages'
  | 'page'
  | 'canvas'
  | 'textLayer'
  | 'linkLayer'
  | 'pageOverlay'
  | 'highlightLayer'
  | 'highlight'
  | 'empty'
  | 'password'
  | 'passwordInput'
  | 'passwordSubmit';

export interface DocViewerPagesProps
  extends BoxProps, CompoundStylesApiProps<DocViewerPagesFactory>, ElementProps<'div'> {
  /** Key of `theme.spacing` or any valid CSS value for the space between pages, `'md'` by default */
  gap?: MantineSpacing;

  /** Largest canvas drawn for a page, in pixels, `16_777_216` by default */
  maxCanvasPixels?: number;

  /** Determines whether readers can scroll, `true` by default */
  withScroll?: boolean;

  /** Determines whether scrolling stops at the start of each page or spread, `false` by default */
  withScrollSnap?: boolean;

  /** Determines whether pages turn by spread with edge clicks, swipes and keys, `false` by default */
  withPageTurning?: boolean | DocViewerPageTurning;

  /** Content laid over each page, placed in page coordinates times `scale` */
  renderPageOverlay?: DocViewerRenderPageOverlay;

  /** Key of `theme.colors` or any valid CSS color of search matches, `theme.colors.yellow[6]` by default */
  matchColor?: MantineColor;

  /** Key of `theme.colors` or any valid CSS color of the active search match, `theme.colors.orange[6]` by default */
  activeMatchColor?: MantineColor;

  /** Props passed to the password field of a protected PDF */
  passwordInputProps?: DocViewerPasswordInputProps;

  /** Called when a web link in a page is clicked, before it opens. Call `event.preventDefault()` to stop it */
  onLinkClick?: (url: string, event: MouseEvent) => void;

  /** Called when the reader has selected text, with its page and boxes in page coordinates */
  onTextSelect?: (text: string, details: { page: number; rects: DocViewerPageRect[] }) => void;

  /** Called when how much of the document has been seen changes */
  onReadingProgress?: (progress: DocViewerReadingProgress) => void;

  /** Called once when the bottom of the last page is on screen */
  onReachEnd?: () => void;
}

export type DocViewerPagesFactory = Factory<{
  props: DocViewerPagesProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerPagesStylesNames;
  compound: true;
}>;

const defaultProps = {
  maxCanvasPixels: MAX_CANVAS_PIXELS,
} satisfies Partial<DocViewerPagesProps>;

/** The scrolling region with the pages of a PDF */
export const DocViewerPages = factory<DocViewerPagesFactory>((_props) => {
  const layout = use(DocViewerLayoutContext);
  const {
    classNames,
    className,
    style,
    styles,
    vars,
    __vars,
    ref,
    gap,
    maxCanvasPixels,
    withScroll,
    withScrollSnap,
    withPageTurning,
    renderPageOverlay,
    matchColor,
    activeMatchColor,
    passwordInputProps,
    onLinkClick,
    onTextSelect,
    onReadingProgress,
    onReachEnd,
    ...others
  } = useProps('DocViewerPages', defaultProps, mergePartProps(layout.pagesProps, _props));
  const { getStyles } = useDocViewerContext();
  const theme = useMantineTheme();
  const session = usePdfSession();
  usePagesRegistration(
    { withPageTurning, withScrollSnap, withScroll },
    { onLinkClick, onTextSelect, onReadingProgress, onReachEnd }
  );
  if (!session) {
    return null;
  }

  return (
    <PartStyles classNames={classNames} styles={styles}>
      <PdfPagesBody
        session={session}
        bodyRef={ref}
        maxCanvasPixels={maxCanvasPixels!}
        renderPageOverlay={renderPageOverlay}
        passwordInputProps={passwordInputProps}
        bodyProps={{
          ...getStyles('body', { className, style, classNames, styles }),
          ...others,
          __vars: {
            ...__vars,
            '--doc-viewer-page-gap': gap === undefined ? undefined : getSpacing(gap),
            '--doc-viewer-match-color': matchColor ? getThemeColor(matchColor, theme) : undefined,
            '--doc-viewer-active-match-color': activeMatchColor
              ? getThemeColor(activeMatchColor, theme)
              : undefined,
          },
        }}
      />
    </PartStyles>
  );
});

DocViewerPages.classes = classes;
DocViewerPages.displayName = 'mantine-doc-viewer/DocViewerPages';
