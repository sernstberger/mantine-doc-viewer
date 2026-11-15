import { Checkbox, DataList, Stack, Text, UnstyledButton } from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useId } from '@mantine/hooks';
import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { downloadAttachment, PdfAttachment, PdfProperty } from '../utils/document-info';
import type { PdfLayer } from '../hooks/pdf/use-pdf-layers';

interface PdfDocumentInfoProps {
  document: PDFDocumentProxy;
  properties: PdfProperty[] | null;
  attachments: PdfAttachment[];
  layers: PdfLayer[];
  onLayerChange: (id: string, visible: boolean) => void;
}

/** Document properties, attachments and layers, shown in a popover from the toolbar */
export function PdfDocumentInfo({
  document,
  properties,
  attachments,
  layers,
  onLayerChange,
}: PdfDocumentInfoProps) {
  const { getStyles, labels } = useDocViewerContext();
  // Several viewers on one page each name their own sections
  const id = useId();

  return (
    <div {...getStyles('documentInfo')}>
      <section aria-labelledby={`${id}-properties`}>
        <Text id={`${id}-properties`} size="sm" {...getStyles('documentHeading')}>
          {labels.properties}
        </Text>
        <DataList {...getStyles('properties')} size="xs" gap={4} labelWidth="6.5rem">
          {(properties ?? []).map((property) => (
            <DataList.Item key={property.key}>
              <DataList.ItemLabel>{labels.propertyNames[property.key]}</DataList.ItemLabel>
              <DataList.ItemValue>{property.value}</DataList.ItemValue>
            </DataList.Item>
          ))}
        </DataList>
      </section>

      {attachments.length > 0 && (
        <section aria-labelledby={`${id}-attachments`}>
          <Text id={`${id}-attachments`} size="sm" {...getStyles('documentHeading')}>
            {labels.attachments}
          </Text>
          <Stack gap={2}>
            {attachments.map((attachment) => (
              <UnstyledButton
                key={attachment.id}
                {...getStyles('outlineItem')}
                title={attachment.description || undefined}
                aria-label={labels.downloadAttachment(attachment.filename)}
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
            {labels.layers}
          </Text>
          <Stack gap={6}>
            {layers.map((layer) => (
              <Checkbox
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
    </div>
  );
}
