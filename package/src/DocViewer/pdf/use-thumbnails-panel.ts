import { useUncontrolled } from '@mantine/hooks';
import { useState } from 'react';
import type { DocViewerThumbnailsPosition } from '../DocViewer';
import type { DocViewerContextValue } from '../DocViewer.context';

type ThumbnailsSettings = Pick<
  DocViewerContextValue,
  | 'defaultThumbnailsOpened'
  | 'thumbnailsPosition'
  | 'defaultThumbnailsPosition'
  | 'onThumbnailsPositionChange'
>;

/** Whether the thumbnails strip is open, and where it sits (controlled or not) */
export function useThumbnailsPanel(settings: ThumbnailsSettings) {
  const [opened, setOpened] = useState(settings.defaultThumbnailsOpened ?? false);
  const [position, setPosition] = useUncontrolled<DocViewerThumbnailsPosition>({
    value: settings.thumbnailsPosition,
    defaultValue: settings.defaultThumbnailsPosition,
    finalValue: 'left',
    onChange: settings.onThumbnailsPositionChange,
  });

  /** Opens or closes the strip; without an argument, flips it */
  const toggle = (next?: boolean) => setOpened((current) => next ?? !current);

  return { opened, toggle, position, setPosition };
}
