import {
  ActionIcon,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  GetStylesApiOptions,
  Popover,
  useProps,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { PdfDocumentInfo } from '../DocViewerDocumentInfo/PdfDocumentInfo';
import { useReadyPdfSession } from '../DocViewerRoot/pdf-session-context';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import type { PdfLayer } from '../hooks/pdf/use-pdf-layers';
import { usePdfAttachments, usePdfProperties } from '../utils/document-info';
import { InfoIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerInfoButtonStylesNames = 'control' | 'dropdown';

export interface DocViewerInfoButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerInfoButtonFactory>, ElementProps<'button'> {}

export type DocViewerInfoButtonFactory = Factory<{
  props: DocViewerInfoButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerInfoButtonStylesNames;
  compound: true;
}>;

interface InfoPopoverProps {
  document: PDFDocumentProxy;
  layers: PdfLayer[];
  onLayerChange: (id: string, visible: boolean) => void;
  stylesApiProps: GetStylesApiOptions;
  buttonProps: Omit<
    DocViewerInfoButtonProps,
    'classNames' | 'className' | 'style' | 'styles' | 'vars'
  >;
}

function InfoPopover({
  document,
  layers,
  onLayerChange,
  stylesApiProps,
  buttonProps,
}: InfoPopoverProps) {
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
            {...controlProps(opened, stylesApiProps)}
            aria-label={labels.documentInfoLabel}
            aria-expanded={opened}
            onClick={popover.toggle}
            {...buttonProps}
          >
            <InfoIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Popover.Target>
      <Popover.Dropdown
        {...getStyles('dropdown', {
          classNames: stylesApiProps.classNames,
          styles: stylesApiProps.styles,
        })}
      >
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

/** Opens the properties, attachments and layers of a PDF in a popover */
export const DocViewerInfoButton = factory<DocViewerInfoButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, ...others } = useProps(
    'DocViewerInfoButton',
    null,
    _props
  );
  useDocViewerContext();
  const session = useReadyPdfSession();
  const show = useShowControl();

  if (!session || !show('info')) {
    return null;
  }

  const { pdfLayers } = session.content;
  return (
    <InfoPopover
      document={session.loaded.ready!.document}
      layers={pdfLayers.layers}
      onLayerChange={pdfLayers.setVisible}
      stylesApiProps={{ className, style, classNames, styles }}
      buttonProps={others}
    />
  );
});

DocViewerInfoButton.classes = classes;
DocViewerInfoButton.displayName = 'mantine-doc-viewer/DocViewerInfoButton';
