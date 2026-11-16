import {
  Box,
  BoxProps,
  Checkbox,
  DataList,
  ElementProps,
  type GetStylesApiOptions,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useId } from '@mantine/hooks';
import type { Ref } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { downloadAttachment, PdfAttachment, PdfProperty } from '../utils/document-info';
import type { PdfLayer } from '../hooks/pdf/use-pdf-layers';

interface PdfDocumentInfoProps {
  document: PDFDocumentProxy;
  properties: PdfProperty[] | null;
  attachments: PdfAttachment[];
  layers: PdfLayer[];
  onLayerChange: (id: string, visible: boolean) => void;

  /** className, style, classNames and styles of the `documentInfo` element */
  stylesOptions?: GetStylesApiOptions;

  /** Other props of the `documentInfo` element */
  elementProps?: BoxProps & ElementProps<'div'>;
  rootRef?: Ref<HTMLDivElement>;
}

/** Document properties, attachments and layers, shown in a popover from the toolbar */
export function PdfDocumentInfo({
  document,
  properties,
  attachments,
  layers,
  onLayerChange,
  stylesOptions,
  elementProps,
  rootRef,
}: PdfDocumentInfoProps) {
  const { getStyles, labels, unstyled } = useDocViewerContext();
  const id = useId();

  return (
    <Box ref={rootRef} {...getStyles('documentInfo', stylesOptions)} {...elementProps}>
      <section aria-labelledby={`${id}-properties`}>
        <Text id={`${id}-properties`} size="sm" {...getStyles('documentHeading')}>
          {labels.propertiesLabel}
        </Text>
        <DataList
          unstyled={unstyled}
          {...getStyles('properties')}
          size="xs"
          gap={4}
          labelWidth="6.5rem"
        >
          {(properties ?? []).map((property) => (
            <DataList.Item key={property.key}>
              <DataList.ItemLabel>{labels.propertyNameLabels[property.key]}</DataList.ItemLabel>
              <DataList.ItemValue>{property.value}</DataList.ItemValue>
            </DataList.Item>
          ))}
        </DataList>
      </section>

      {attachments.length > 0 && (
        <section aria-labelledby={`${id}-attachments`}>
          <Text id={`${id}-attachments`} size="sm" {...getStyles('documentHeading')}>
            {labels.attachmentsLabel}
          </Text>
          <Stack gap={2}>
            {attachments.map((attachment) => (
              <UnstyledButton
                key={attachment.id}
                {...getStyles('outlineItem')}
                title={attachment.description || undefined}
                aria-label={labels.downloadAttachmentLabel(attachment.filename)}
                onClick={() => downloadAttachment(document, attachment)}
              >
                {attachment.filename}
              </UnstyledButton>
            ))}
          </Stack>
        </section>
      )}

      {layers.length > 0 && (
        <section aria-labelledby={`${id}-layers`}>
          <Text id={`${id}-layers`} size="sm" {...getStyles('documentHeading')}>
            {labels.layersLabel}
          </Text>
          <Stack gap={6}>
            {layers.map((layer) => (
              <Checkbox
                unstyled={unstyled}
                key={layer.id}
                size="xs"
                {...getStyles('documentLayer')}
                label={layer.name}
                checked={layer.visible}
                onChange={(event) => onLayerChange(layer.id, event.currentTarget.checked)}
              />
            ))}
          </Stack>
        </section>
      )}
    </Box>
  );
}
