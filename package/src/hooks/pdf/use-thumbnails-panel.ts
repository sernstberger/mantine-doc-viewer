import { useUncontrolled } from '@mantine/hooks';
import type { DocViewerThumbnailsPosition } from '../../DocViewerRoot/DocViewerRoot';
import type { DocViewerContextValue } from '../../doc-viewer.context';

type ThumbnailsSettings = Pick<
  DocViewerContextValue,
  | 'thumbnailsOpened'
  | 'defaultThumbnailsOpened'
  | 'onThumbnailsOpenedChange'
  | 'thumbnailsPosition'
  | 'defaultThumbnailsPosition'
  | 'onThumbnailsPositionChange'
>;

/** Whether the thumbnails strip is open and where it sits, each controlled or not */
export function useThumbnailsPanel(settings: ThumbnailsSettings) {
  const [opened, setOpened] = useUncontrolled<boolean>({
    value: settings.thumbnailsOpened,
    defaultValue: settings.defaultThumbnailsOpened,
    finalValue: false,
    onChange: settings.onThumbnailsOpenedChange,
  });
  const [position, setPosition] = useUncontrolled<DocViewerThumbnailsPosition>({
    value: settings.thumbnailsPosition,
    defaultValue: settings.defaultThumbnailsPosition,
    finalValue: 'left',
    onChange: settings.onThumbnailsPositionChange,
  });

  /** Opens or closes the strip; without an argument, flips it */
  const toggle = (next?: boolean) => {
    const value = next ?? !opened;
    value !== opened && setOpened(value);
  };

  return { opened, toggle, position, setPosition };
}
