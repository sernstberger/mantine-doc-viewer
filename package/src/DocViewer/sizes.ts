import type { ActionIconProps, MantineFontSize, MantineSize } from '@mantine/core';

export interface DocViewerSizeConfig {
  /** Size of toolbar buttons */
  control: ActionIconProps['size'];

  /** Size of segmented controls and the search input */
  input: MantineSize;

  /** Font size of the toolbar text */
  fontSize: MantineFontSize;

  /** Smallest toolbar height, in px */
  toolbarHeight: number;
}

/** What each `size` of the viewer means for its toolbar */
export const DOC_VIEWER_SIZES: Record<MantineSize, DocViewerSizeConfig> = {
  xs: { control: 'sm', input: 'xs', fontSize: 'xs', toolbarHeight: 34 },
  sm: { control: 'md', input: 'xs', fontSize: 'sm', toolbarHeight: 44 },
  md: { control: 'lg', input: 'sm', fontSize: 'md', toolbarHeight: 52 },
  lg: { control: 'xl', input: 'md', fontSize: 'lg', toolbarHeight: 60 },
  xl: { control: 'xl', input: 'lg', fontSize: 'xl', toolbarHeight: 68 },
};
