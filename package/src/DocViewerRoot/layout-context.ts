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
