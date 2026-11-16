import {
  ActionIcon,
  CompoundStylesApiProps,
  factory,
  Factory,
  Popover,
  SegmentedControl,
  useProps,
} from '@mantine/core';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { docViewerActions } from '../doc-viewer.store';
import type { DocViewerControlProps, DocViewerThumbnailsPosition } from '../doc-viewer.types';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { PDF_ONLY, useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import { PanelPositionIcon, SidebarIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerThumbnailsButtonStylesNames = 'control' | 'dropdown';

export interface DocViewerThumbnailsButtonProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerThumbnailsButtonFactory> {
  /** Determines whether the button has a menu to move the thumbnails while they are shown @default true */
  withPositionMenu?: boolean;
}

export type DocViewerThumbnailsButtonFactory = Factory<{
  props: DocViewerThumbnailsButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerThumbnailsButtonStylesNames;
  compound: true;
}>;

const POSITIONS = ['left', 'right', 'top', 'bottom'] as const;

const defaultProps = {
  withPositionMenu: true,
} satisfies Partial<DocViewerThumbnailsButtonProps>;

/** Shows and hides the PDF page thumbnails, and moves them to another side of the viewer. It is shown while a `DocViewer.Thumbnails` part is mounted */
export const DocViewerThumbnailsButton = factory<DocViewerThumbnailsButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, withPositionMenu, onClick, ...others } =
    useProps('DocViewerThumbnailsButton', defaultProps, _props);
  const { store, getStyles, labels, size, unstyled } = useDocViewerContext();
  const ready = useReadyDocument(PDF_ONLY);
  const available = useDocViewerState(store, (state) => state.thumbnailsAvailable);
  const opened = useDocViewerState(store, (state) => state.thumbnailsOpened);
  const position = useDocViewerState(store, (state) => state.thumbnailsPosition);
  const show = useShowControl();
  const controlProps = useControlProps();
  const stylesApiProps = { classNames, styles };

  if (!ready || !available || !show('thumbnails')) {
    return null;
  }

  return (
    <>
      <DocViewerTooltip label={opened ? labels.hideThumbnailsLabel : labels.showThumbnailsLabel}>
        <ActionIcon
          {...controlProps(opened, { className, style, classNames, styles })}
          aria-label={labels.pageThumbnailsLabel}
          aria-pressed={opened}
          {...others}
          onClick={(event) => {
            docViewerActions.toggleThumbnails(undefined, store);
            onClick?.(event);
          }}
        >
          <SidebarIcon />
        </ActionIcon>
      </DocViewerTooltip>
      {opened && withPositionMenu && (
        <Popover
          unstyled={unstyled}
          position="bottom-end"
          shadow="md"
          withinPortal={false}
          trapFocus
          returnFocus
        >
          <Popover.Target>
            <DocViewerTooltip label={labels.thumbnailsPositionLabel}>
              <ActionIcon
                {...controlProps(false, stylesApiProps)}
                aria-label={labels.thumbnailsPositionLabel}
              >
                <PanelPositionIcon />
              </ActionIcon>
            </DocViewerTooltip>
          </Popover.Target>
          <Popover.Dropdown p={4} {...getStyles('dropdown', stylesApiProps)}>
            <SegmentedControl
              unstyled={unstyled}
              size={size.input}
              value={position}
              onChange={(value) =>
                docViewerActions.setThumbnailsPosition(value as DocViewerThumbnailsPosition, store)
              }
              aria-label={labels.thumbnailsPositionLabel}
              data={POSITIONS.map((value) => ({ value, label: labels[`${value}Label`] }))}
            />
          </Popover.Dropdown>
        </Popover>
      )}
    </>
  );
});

DocViewerThumbnailsButton.classes = classes;
DocViewerThumbnailsButton.displayName = 'mantine-doc-viewer/DocViewerThumbnailsButton';
