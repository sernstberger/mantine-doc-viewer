import { filterProps } from '@mantine/core';
import { createContext } from 'react';
import type { DocViewerControl } from '../doc-viewer.types';
import type { DocViewerImageProps } from '../DocViewerImage/DocViewerImage';
import type { DocViewerPagesProps } from '../DocViewerPages/DocViewerPages';
import type { DocViewerSearchProps } from '../DocViewerSearch/DocViewerSearch';
import type { DocViewerTextViewProps } from '../DocViewerText/DocViewerText';
import type { DocViewerThumbnailsProps } from '../DocViewerThumbnails/DocViewerThumbnails';
import type { DocViewerToolbarProps } from '../DocViewerToolbar/DocViewerToolbar';

/** What `DocViewer` hands the default layout through Root: its composition props */
export interface DocViewerLayoutConfig {
  withToolbar?: boolean;
  toolbarControls?: Partial<Record<DocViewerControl, boolean>>;
  withOverlayControls?: boolean;
  toolbarProps?: Omit<DocViewerToolbarProps, 'controls' | 'children'>;
  pagesProps?: DocViewerPagesProps;
  thumbnailsProps?: DocViewerThumbnailsProps;
  searchProps?: DocViewerSearchProps;
  imageProps?: DocViewerImageProps;
  textProps?: DocViewerTextViewProps;
}

export const DocViewerLayoutContext = createContext<DocViewerLayoutConfig>({});

/**
 * Props of a part with the ones `DocViewer` passes it (`pagesProps` and the like) under the part's
 * own, given to `useProps` as instance props so that they win over theme `defaultProps`, as
 * `closeButtonProps` of `Modal` do. A prop the part sets to `undefined` keeps the passed value
 */
export function mergePartProps<P extends object>(passed: Partial<P> | undefined, props: P): P {
  return { ...passed, ...filterProps(props) } as P;
}
