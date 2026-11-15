import { ActionIcon, Popover } from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useDisclosure } from '@mantine/hooks';
import React from 'react';
import { DocViewerTooltip, useControlProps } from '../controls';
import { useDocViewerContext, useShowControl } from '../DocViewer.context';
import { EditPagesIcon, InfoIcon, OutlineIcon, PresentationIcon, SearchIcon } from '../icons';
import { usePdfAttachments, usePdfProperties } from './document-info';
import { PdfDocumentInfo } from './PdfDocumentInfo';
import { PdfOutline, usePdfOutline } from './PdfOutline';
import type { PdfLayer } from './use-pdf-layers';

export interface OutlineControlProps {
  document: PDFDocumentProxy;
  onPage: (page: number) => void;
}

function OutlinePopover({ document, onPage }: OutlineControlProps) {
  const { labels } = useDocViewerContext();
  const controlProps = useControlProps();
  const outline = usePdfOutline(document);
  const [opened, popover] = useDisclosure(false);
  if (!outline || outline.length === 0) {
    return null;
  }

  return (
    <Popover
      opened={opened}
      onChange={popover.set}
      position="bottom-end"
      shadow="md"
      withinPortal={false}
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <DocViewerTooltip label={labels.outline}>
          <ActionIcon
            {...controlProps(opened)}
            aria-label={labels.outline}
            aria-expanded={opened}
            onClick={popover.toggle}
          >
            <OutlineIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Popover.Target>
      <Popover.Dropdown p={4}>
        <PdfOutline
          document={document}
          items={outline}
          onSelect={(page) => {
            popover.close();
            onPage(page);
          }}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

/** Document outline popover, when the document has an outline */
export function OutlineControl(props: OutlineControlProps) {
  const show = useShowControl();
  return show('outline') && <OutlinePopover {...props} />;
}

export interface InfoControlProps {
  document: PDFDocumentProxy;
  layers: PdfLayer[];
  onLayerChange: (id: string, visible: boolean) => void;
}

function InfoPopover({ document, layers, onLayerChange }: InfoControlProps) {
  const { labels, locale } = useDocViewerContext();
  const controlProps = useControlProps();
  const [opened, popover] = useDisclosure(false);
  const properties = usePdfProperties(document, opened, locale);
  const attachments = usePdfAttachments(document);

  return (
    <Popover
      opened={opened}
      onChange={popover.set}
      position="bottom-end"
      shadow="md"
      withinPortal={false}
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <DocViewerTooltip label={labels.documentInfo}>
          <ActionIcon
            {...controlProps(opened)}
            aria-label={labels.documentInfo}
            aria-expanded={opened}
            onClick={popover.toggle}
          >
            <InfoIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <PdfDocumentInfo
          document={document}
          properties={properties}
          attachments={attachments}
          layers={layers}
          onLayerChange={onLayerChange}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

/** Document information popover */
export function InfoControl(props: InfoControlProps) {
  const show = useShowControl();
  return show('info') && <InfoPopover {...props} />;
}

/** Presentation mode button */
export function PresentationControl({
  onPresent,
  buttonRef,
}: {
  onPresent: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  const { labels } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  return (
    show('presentation') && (
      <DocViewerTooltip label={labels.presentation}>
        <ActionIcon
          ref={buttonRef}
          {...controlProps()}
          aria-label={labels.presentation}
          onClick={onPresent}
        >
          <PresentationIcon />
        </ActionIcon>
      </DocViewerTooltip>
    )
  );
}

/** Page editor button, when page editing is enabled */
export function EditPagesControl({
  onEditPages,
  buttonRef,
}: {
  onEditPages: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  const { labels, withPageEditing } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  return (
    show('editPages') &&
    withPageEditing && (
      <DocViewerTooltip label={labels.editPages}>
        <ActionIcon
          ref={buttonRef}
          {...controlProps()}
          aria-label={labels.editPages}
          onClick={onEditPages}
        >
          <EditPagesIcon />
        </ActionIcon>
      </DocViewerTooltip>
    )
  );
}

export interface SearchControlProps {
  opened: boolean;
  toggleRef: React.Ref<HTMLButtonElement>;
  onToggle: () => void;
}

/** Search toggle */
export function SearchControl({ opened, toggleRef, onToggle }: SearchControlProps) {
  const { labels } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  return (
    show('search') && (
      <DocViewerTooltip label={labels.search}>
        <ActionIcon
          {...controlProps(opened)}
          ref={toggleRef}
          aria-label={labels.search}
          aria-pressed={opened}
          onClick={onToggle}
        >
          <SearchIcon />
        </ActionIcon>
      </DocViewerTooltip>
    )
  );
}
