import type { BoxProps, ElementProps, StylesApiProps } from '@mantine/core';
import type { DocViewerRootFactory, DocViewerRootProps } from './DocViewerRoot';

const OWN_PROP_NAMES = [
  'classNames',
  'className',
  'style',
  'styles',
  'unstyled',
  'vars',
  'attributes',
  'mod',
  'ref',
  'children',
  'src',
  'type',
  'mimeType',
  'fileName',
  'keepView',
  'locale',
  'labels',
  'store',
  'extensions',
  'size',
  'radius',
  'color',
  'autosize',
  'pageBackground',
  'pageColorScheme',
  'defaultThumbnailsOpened',
  'defaultThumbnailsPosition',
  'page',
  'defaultPage',
  'onPageChange',
  'zoom',
  'defaultZoom',
  'onZoomChange',
  'pageLayout',
  'defaultPageLayout',
  'onPageLayoutChange',
  'fullscreen',
  'onFullscreenChange',
  'onDocumentLoad',
  'onDocumentError',
] as const satisfies readonly (keyof DocViewerRootProps | 'ref')[];

type MissingOwnProps = Exclude<
  keyof DocViewerRootProps,
  | keyof BoxProps
  | keyof StylesApiProps<DocViewerRootFactory>
  | keyof ElementProps<'div', 'color'>
  | 'variant'
  | (typeof OWN_PROP_NAMES)[number]
>;
const ownPropsListed: [MissingOwnProps] extends [never] ? true : MissingOwnProps = true;
void ownPropsListed;

const OWN_PROPS = new Set<string>(OWN_PROP_NAMES);

/** The props left for the root element: everything Root does not read itself */
export function getRootElementProps<T extends object>(props: T) {
  return Object.fromEntries(Object.entries(props).filter(([name]) => !OWN_PROPS.has(name))) as Omit<
    T,
    (typeof OWN_PROP_NAMES)[number]
  >;
}
