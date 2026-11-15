import type { DocViewerProps } from './DocViewer';
import { useResponsiveValue } from './responsive';

export const DEFAULT_THUMBNAIL_WIDTH = 112;

/** Resolves the responsive props for the current viewport */
export function useResolvedProps(
  props: Pick<
    DocViewerProps,
    | 'size'
    | 'pageGap'
    | 'thumbnailWidth'
    | 'thumbnailsPosition'
    | 'defaultPageLayout'
    | 'pageLayout'
  >
) {
  return {
    size: useResponsiveValue(props.size) ?? 'sm',
    pageGap: useResponsiveValue(props.pageGap),
    thumbnailWidth: useResponsiveValue(props.thumbnailWidth) ?? DEFAULT_THUMBNAIL_WIDTH,
    thumbnailsPosition: useResponsiveValue(props.thumbnailsPosition),
    defaultPageLayout: useResponsiveValue(props.defaultPageLayout),
    pageLayout: useResponsiveValue(props.pageLayout),
  };
}
