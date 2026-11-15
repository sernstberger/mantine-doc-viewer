import { ActionIcon, Group, Popover, Radio, SegmentedControl, Stack, Text } from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useDisclosure } from '@mantine/hooks';
import React from 'react';
import { softDisabled } from '../a11y';
import { DocViewerTooltip, useControlProps } from '../controls';
import type { DocViewerPageLayout, DocViewerThumbnailsPosition } from '../DocViewer';
import { useDocViewerContext, useShowControl } from '../DocViewer.context';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FitWidthIcon,
  InfoIcon,
  EditPagesIcon,
  OutlineIcon,
  PresentationIcon,
  PanelPositionIcon,
  RotateIcon,
  SearchIcon,
  SidebarIcon,
  TwoPagesIcon,
} from '../icons';
import { ZoomControls } from '../ZoomControls';
import { usePdfAttachments, usePdfProperties } from './document-info';
import { fitsToHeight } from './geometry';
import { PdfDocumentInfo } from './PdfDocumentInfo';
import type { PdfLayer } from './use-pdf-layers';
import { PdfOutline, usePdfOutline } from './PdfOutline';
import type { PdfZoom } from './zoom';

const POSITIONS = ['left', 'right', 'top', 'bottom'] as const;

const LAYOUTS = [
  ['single', 'layoutSingle'],
  ['two-page', 'layoutTwoPage'],
  ['two-page-cover', 'layoutTwoPageCover'],
  ['horizontal', 'layoutHorizontal'],
  ['wrapped', 'layoutWrapped'],
] as const;

export interface PdfControlsProps {
  document: PDFDocumentProxy;
  currentPage: number;
  onPage: (page: number) => void;

  scale: number;
  zoom: PdfZoom;
  onZoom: (zoom: PdfZoom) => void;
  onRotate: () => void;

  layout: DocViewerPageLayout;
  onLayoutChange: (layout: DocViewerPageLayout) => void;

  thumbnailsOpened: boolean;
  onToggleThumbnails: () => void;
  position: DocViewerThumbnailsPosition;
  onPositionChange: (position: DocViewerThumbnailsPosition) => void;

  layers: PdfLayer[];
  onLayerChange: (id: string, visible: boolean) => void;

  onPresent: () => void;
  onEditPages: () => void;

  searchOpened: boolean;
  searchToggleRef: React.Ref<HTMLButtonElement>;
  onToggleSearch: () => void;
}

/** Toolbar buttons for PDFs: thumbnails, paging, zoom, rotation, layout, outline and search */
export function PdfControls(props: PdfControlsProps) {
  const { getStyles, labels, size, withPageEditing } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  const outline = usePdfOutline(props.document);
  const [outlineOpened, outlinePopover] = useDisclosure(false);
  const [infoOpened, infoPopover] = useDisclosure(false);
  const properties = usePdfProperties(props.document, infoOpened);
  const attachments = usePdfAttachments(props.document);
  const { currentPage, onPage, thumbnailsOpened, layout, searchOpened } = props;
  const numPages = props.document.numPages;

  return (
    <>
      {show('thumbnails') && (
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
        </>
      )}

      {show('pages') && (
        <>
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
        </>
      )}

      {show('zoom') && (
        <>
          <ZoomControls
            scale={props.scale}
            fitted={props.zoom === 'fit-width'}
            fitLabel={fitsToHeight(layout) ? labels.fitToView : labels.fitToWidth}
            fitIcon={<FitWidthIcon />}
            onZoom={props.onZoom}
            onFit={() => props.onZoom('fit-width')}
          />
        </>
      )}

      {show('rotate') && (
        <>
          <DocViewerTooltip label={labels.rotate}>
            <ActionIcon {...controlProps()} aria-label={labels.rotate} onClick={props.onRotate}>
              <RotateIcon />
            </ActionIcon>
          </DocViewerTooltip>
        </>
      )}

      {show('layout') && (
        <>
          <Popover position="bottom-end" shadow="md" withinPortal={false} trapFocus returnFocus>
            <Popover.Target>
              <DocViewerTooltip label={labels.pageLayout}>
                <ActionIcon {...controlProps(layout !== 'single')} aria-label={labels.pageLayout}>
                  <TwoPagesIcon />
                </ActionIcon>
              </DocViewerTooltip>
            </Popover.Target>
            <Popover.Dropdown>
              <Radio.Group
                value={layout}
                onChange={(value) => props.onLayoutChange(value as DocViewerPageLayout)}
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
        </>
      )}

      {show('outline') && (
        <>
          {outline && outline.length > 0 && (
            <Popover
              opened={outlineOpened}
              onChange={outlinePopover.set}
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
                    onClick={outlinePopover.toggle}
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
                    outlinePopover.close();
                    onPage(page);
                  }}
                />
              </Popover.Dropdown>
            </Popover>
          )}
        </>
      )}

      {show('info') && (
        <>
          <Popover
            opened={infoOpened}
            onChange={infoPopover.set}
            position="bottom-end"
            shadow="md"
            withinPortal={false}
            trapFocus
            returnFocus
          >
            <Popover.Target>
              <DocViewerTooltip label={labels.documentInfo}>
                <ActionIcon
                  {...controlProps(infoOpened)}
                  aria-label={labels.documentInfo}
                  aria-expanded={infoOpened}
                  onClick={infoPopover.toggle}
                >
                  <InfoIcon />
                </ActionIcon>
              </DocViewerTooltip>
            </Popover.Target>
            <Popover.Dropdown>
              <PdfDocumentInfo
                document={props.document}
                properties={properties}
                attachments={attachments}
                layers={props.layers}
                onLayerChange={props.onLayerChange}
              />
            </Popover.Dropdown>
          </Popover>
        </>
      )}

      {show('presentation') && (
        <>
          <DocViewerTooltip label={labels.presentation}>
            <ActionIcon
              {...controlProps()}
              aria-label={labels.presentation}
              onClick={props.onPresent}
            >
              <PresentationIcon />
            </ActionIcon>
          </DocViewerTooltip>
        </>
      )}

      {show('editPages') && (
        <>
          {withPageEditing && (
            <DocViewerTooltip label={labels.editPages}>
              <ActionIcon
                {...controlProps()}
                aria-label={labels.editPages}
                onClick={props.onEditPages}
              >
                <EditPagesIcon />
              </ActionIcon>
            </DocViewerTooltip>
          )}
        </>
      )}

      {show('search') && (
        <>
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
      )}
    </>
  );
}
