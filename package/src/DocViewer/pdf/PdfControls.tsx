import { ActionIcon, Group, Popover, SegmentedControl, Text } from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState } from 'react';
import { softDisabled } from '../a11y';
import { DocViewerTooltip, useControlProps } from '../controls';
import type { DocViewerThumbnailsPosition } from '../DocViewer';
import { useDocViewerContext } from '../DocViewer.context';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FitWidthIcon,
  OutlineIcon,
  PanelPositionIcon,
  RotateIcon,
  SearchIcon,
  SidebarIcon,
  TwoPagesIcon,
} from '../icons';
import { ZoomControls } from '../ZoomControls';
import { PdfOutline, usePdfOutline } from './PdfOutline';
import type { PdfZoom } from './zoom';

const POSITIONS = ['left', 'right', 'top', 'bottom'] as const;

export interface PdfControlsProps {
  document: PDFDocumentProxy;
  currentPage: number;
  onPage: (page: number) => void;

  scale: number;
  zoom: PdfZoom;
  onZoom: (zoom: PdfZoom) => void;
  onRotate: () => void;

  twoPages: boolean;
  onToggleTwoPages: () => void;

  thumbnailsOpened: boolean;
  onToggleThumbnails: () => void;
  position: DocViewerThumbnailsPosition;
  onPositionChange: (position: DocViewerThumbnailsPosition) => void;

  searchOpened: boolean;
  searchToggleRef: React.Ref<HTMLButtonElement>;
  onToggleSearch: () => void;
}

/** Toolbar buttons for PDFs: thumbnails, paging, zoom, rotation, layout, outline and search */
export function PdfControls(props: PdfControlsProps) {
  const { getStyles, labels, size } = useDocViewerContext();
  const controlProps = useControlProps();
  const outline = usePdfOutline(props.document);
  const [outlineOpened, setOutlineOpened] = useState(false);
  const { currentPage, onPage, thumbnailsOpened, twoPages, searchOpened } = props;
  const numPages = props.document.numPages;

  return (
    <>
      <DocViewerTooltip label={thumbnailsOpened ? labels.hidePages : labels.showPages}>
        <ActionIcon
          {...controlProps(thumbnailsOpened)}
          aria-label={labels.pageThumbnails}
          aria-pressed={thumbnailsOpened}
          onClick={props.onToggleThumbnails}
        >
          <SidebarIcon />
        </ActionIcon>
      </DocViewerTooltip>

      {thumbnailsOpened && (
        <Popover position="bottom-end" shadow="md" withinPortal={false} trapFocus returnFocus>
          <Popover.Target>
            <DocViewerTooltip label={labels.thumbnailsPosition}>
              <ActionIcon {...controlProps()} aria-label={labels.thumbnailsPosition}>
                <PanelPositionIcon />
              </ActionIcon>
            </DocViewerTooltip>
          </Popover.Target>
          <Popover.Dropdown p={4}>
            <SegmentedControl
              size={size.input}
              value={props.position}
              onChange={(value) => props.onPositionChange(value as DocViewerThumbnailsPosition)}
              aria-label={labels.thumbnailsPosition}
              data={POSITIONS.map((value) => ({ value, label: labels[value] }))}
            />
          </Popover.Dropdown>
        </Popover>
      )}

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
          {currentPage} / {numPages}
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

      <ZoomControls
        scale={props.scale}
        fitted={props.zoom === 'fit-width'}
        fitLabel={labels.fitToWidth}
        fitIcon={<FitWidthIcon />}
        onZoom={props.onZoom}
        onFit={() => props.onZoom('fit-width')}
      />

      <DocViewerTooltip label={labels.rotate}>
        <ActionIcon {...controlProps()} aria-label={labels.rotate} onClick={props.onRotate}>
          <RotateIcon />
        </ActionIcon>
      </DocViewerTooltip>

      <DocViewerTooltip label={labels.twoPages}>
        <ActionIcon
          {...controlProps(twoPages)}
          aria-label={labels.twoPages}
          aria-pressed={twoPages}
          onClick={props.onToggleTwoPages}
        >
          <TwoPagesIcon />
        </ActionIcon>
      </DocViewerTooltip>

      {outline && outline.length > 0 && (
        <Popover
          opened={outlineOpened}
          onChange={setOutlineOpened}
          position="bottom-end"
          shadow="md"
          withinPortal={false}
          trapFocus
          returnFocus
        >
          <Popover.Target>
            <DocViewerTooltip label={labels.outline}>
              <ActionIcon
                {...controlProps(outlineOpened)}
                aria-label={labels.outline}
                aria-expanded={outlineOpened}
                onClick={() => setOutlineOpened((opened) => !opened)}
              >
                <OutlineIcon />
              </ActionIcon>
            </DocViewerTooltip>
          </Popover.Target>
          <Popover.Dropdown p={4}>
            <PdfOutline
              document={props.document}
              items={outline}
              onSelect={(page) => {
                setOutlineOpened(false);
                onPage(page);
              }}
            />
          </Popover.Dropdown>
        </Popover>
      )}

      <DocViewerTooltip label={labels.search}>
        <ActionIcon
          {...controlProps(searchOpened)}
          ref={props.searchToggleRef}
          aria-label={labels.search}
          aria-pressed={searchOpened}
          onClick={props.onToggleSearch}
        >
          <SearchIcon />
        </ActionIcon>
      </DocViewerTooltip>
    </>
  );
}
