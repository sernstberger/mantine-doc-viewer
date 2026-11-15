import { ActionIcon, Popover } from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useDisclosure } from '@mantine/hooks';
import React from 'react';
import { DocViewerTooltip, useControlProps } from './DocViewerTooltip';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { EditPagesIcon, InfoIcon, OutlineIcon, PresentationIcon, SearchIcon } from '../utils/icons';
import { usePdfAttachments, usePdfProperties } from '../utils/document-info';
import { PdfDocumentInfo } from '../DocViewerDocumentInfo/PdfDocumentInfo';
import { PdfOutline, usePdfOutline } from '../DocViewerOutline/PdfOutline';
import type { PdfLayer } from '../hooks/pdf/use-pdf-layers';

export interface OutlineControlProps {
  document: PDFDocumentProxy;
  onPage: (page: number) => void;
}

function OutlinePopover({ document, onPage }: OutlineControlProps) {
  const { getStyles, labels } = useDocViewerContext();
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
        <DocViewerTooltip label={labels.outlineLabel}>
          <ActionIcon
            {...controlProps(opened)}
            aria-label={labels.outlineLabel}
            aria-expanded={opened}
            onClick={popover.toggle}
          >
            <OutlineIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Popover.Target>
      <Popover.Dropdown p={4} {...getStyles('dropdown')}>
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
  const { getStyles, labels, locale } = useDocViewerContext();
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
        <DocViewerTooltip label={labels.documentInfoLabel}>
          <ActionIcon
            {...controlProps(opened)}
            aria-label={labels.documentInfoLabel}
            aria-expanded={opened}
            onClick={popover.toggle}
          >
            <InfoIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Popover.Target>
      <Popover.Dropdown {...getStyles('dropdown')}>
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
      <DocViewerTooltip label={labels.presentationLabel}>
        <ActionIcon
          ref={buttonRef}
          {...controlProps()}
          aria-label={labels.presentationLabel}
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
      <DocViewerTooltip label={labels.editPagesLabel}>
        <ActionIcon
          ref={buttonRef}
          {...controlProps()}
          aria-label={labels.editPagesLabel}
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
      <DocViewerTooltip label={labels.searchLabel}>
        <ActionIcon
          {...controlProps(opened)}
          ref={toggleRef}
          aria-label={labels.searchLabel}
          aria-pressed={opened}
          onClick={onToggle}
        >
          <SearchIcon />
        </ActionIcon>
      </DocViewerTooltip>
    )
  );
}
