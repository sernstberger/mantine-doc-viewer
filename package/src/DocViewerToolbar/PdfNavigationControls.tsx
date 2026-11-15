import {
  ActionIcon,
  Group,
  Popover,
  Radio,
  SegmentedControl,
  Stack,
  Text,
  VisuallyHidden,
} from '@mantine/core';
import React from 'react';
import { softDisabled } from '../utils/a11y';
import { DocViewerTooltip, useControlProps } from './DocViewerTooltip';
import type {
  DocViewerPageLayout,
  DocViewerThumbnailsPosition,
} from '../DocViewerRoot/DocViewerRoot';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FitWidthIcon,
  PanelPositionIcon,
  RotateIcon,
  SidebarIcon,
  TwoPagesIcon,
} from '../utils/icons';
import { formatNumber } from '../utils/format';
import { ZoomControls } from '../DocViewerZoomControls/ZoomControls';
import { fitsToHeight } from '../utils/geometry';
import type { PdfZoom } from '../utils/pdf-zoom';

const POSITIONS = ['left', 'right', 'top', 'bottom'] as const;

const LAYOUTS = [
  ['single', 'layoutSingle'],
  ['two-page', 'layoutTwoPage'],
  ['two-page-cover', 'layoutTwoPageCover'],
  ['horizontal', 'layoutHorizontal'],
  ['wrapped', 'layoutWrapped'],
] as const;

export interface ThumbnailsControlProps {
  opened: boolean;
  onToggle: () => void;
  position: DocViewerThumbnailsPosition;
  onPositionChange: (position: DocViewerThumbnailsPosition) => void;
}

function ThumbnailsPositionPopover(props: ThumbnailsControlProps) {
  const { getStyles, labels, size } = useDocViewerContext();
  const controlProps = useControlProps();

  return (
    <Popover position="bottom-end" shadow="md" withinPortal={false} trapFocus returnFocus>
      <Popover.Target>
        <DocViewerTooltip label={labels.thumbnailsPosition}>
          <ActionIcon {...controlProps()} aria-label={labels.thumbnailsPosition}>
            <PanelPositionIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Popover.Target>
      <Popover.Dropdown p={4} {...getStyles('dropdown')}>
        <SegmentedControl
          size={size.input}
          value={props.position}
          onChange={(value) => props.onPositionChange(value as DocViewerThumbnailsPosition)}
          aria-label={labels.thumbnailsPosition}
          data={POSITIONS.map((value) => ({ value, label: labels[value] }))}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

/** Thumbnails toggle, plus the position popover while the thumbnails are open */
export function ThumbnailsControl(props: ThumbnailsControlProps) {
  const { labels } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  return (
    show('thumbnails') && (
      <>
        <DocViewerTooltip label={props.opened ? labels.hidePages : labels.showPages}>
          <ActionIcon
            {...controlProps(props.opened)}
            aria-label={labels.pageThumbnails}
            aria-pressed={props.opened}
            onClick={props.onToggle}
          >
            <SidebarIcon />
          </ActionIcon>
        </DocViewerTooltip>
        {props.opened && <ThumbnailsPositionPopover {...props} />}
      </>
    )
  );
}

export interface PageNavigationControlProps {
  currentPage: number;
  numPages: number;
  onPage: (page: number) => void;
}

/** Previous and next page buttons around the page indicator */
export function PageNavigationControl({
  currentPage,
  numPages,
  onPage,
}: PageNavigationControlProps) {
  const { getStyles, labels, locale } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  return (
    show('pages') && (
      <Group gap={2} wrap="nowrap">
        <DocViewerTooltip label={labels.previousPage}>
          <ActionIcon
            {...controlProps()}
            aria-label={labels.previousPage}
            {...softDisabled(currentPage <= 1, () => onPage(currentPage - 1))}
          >
            <ChevronUpIcon />
          </ActionIcon>
        </DocViewerTooltip>
        <Text {...getStyles('pageIndicator')} title={labels.pageOf(currentPage, numPages)}>
          {/* Read as "Page 3 of 10"; not a live region, so scrolling stays quiet */}
          <span aria-hidden>
            {formatNumber(currentPage, locale)} / {formatNumber(numPages, locale)}
          </span>
          <VisuallyHidden>{labels.pageOf(currentPage, numPages)}</VisuallyHidden>
        </Text>
        <DocViewerTooltip label={labels.nextPage}>
          <ActionIcon
            {...controlProps()}
            aria-label={labels.nextPage}
            {...softDisabled(currentPage >= numPages, () => onPage(currentPage + 1))}
          >
            <ChevronDownIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Group>
    )
  );
}

export interface PdfZoomControlProps {
  scale: number;
  zoom: PdfZoom;
  onZoom: (zoom: PdfZoom) => void;
  layout: DocViewerPageLayout;
}

/** Zoom buttons with the fit toggle */
export function PdfZoomControl(props: PdfZoomControlProps) {
  const { labels } = useDocViewerContext();
  const show = useShowControl();
  return (
    show('zoom') && (
      <ZoomControls
        scale={props.scale}
        fitted={props.zoom === 'fit-width'}
        fitLabel={fitsToHeight(props.layout) ? labels.fitToView : labels.fitToWidth}
        fitIcon={<FitWidthIcon />}
        onZoom={props.onZoom}
        onFit={() => props.onZoom('fit-width')}
      />
    )
  );
}

/** Rotate button */
export function RotateControl({ onRotate }: { onRotate: () => void }) {
  const { labels } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  return (
    show('rotate') && (
      <DocViewerTooltip label={labels.rotate}>
        <ActionIcon {...controlProps()} aria-label={labels.rotate} onClick={onRotate}>
          <RotateIcon />
        </ActionIcon>
      </DocViewerTooltip>
    )
  );
}

export interface LayoutControlProps {
  layout: DocViewerPageLayout;
  onLayoutChange: (layout: DocViewerPageLayout) => void;
}

/** Page layout popover */
export function LayoutControl({ layout, onLayoutChange }: LayoutControlProps) {
  const { getStyles, labels, size } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  return (
    show('layout') && (
      <Popover position="bottom-end" shadow="md" withinPortal={false} trapFocus returnFocus>
        <Popover.Target>
          <DocViewerTooltip label={labels.pageLayout}>
            <ActionIcon {...controlProps(layout !== 'single')} aria-label={labels.pageLayout}>
              <TwoPagesIcon />
            </ActionIcon>
          </DocViewerTooltip>
        </Popover.Target>
        <Popover.Dropdown {...getStyles('dropdown')}>
          <Radio.Group
            value={layout}
            onChange={(value) => onLayoutChange(value as DocViewerPageLayout)}
            label={labels.pageLayout}
            size={size.input}
          >
            <Stack gap={6} mt={6}>
              {LAYOUTS.map(([value, label]) => (
                <Radio key={value} value={value} label={labels[label]} size={size.input} />
              ))}
            </Stack>
          </Radio.Group>
        </Popover.Dropdown>
      </Popover>
    )
  );
}
