import { type ComponentProps, memo } from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useCallbackRef } from '@mantine/hooks';
import { useDocViewerContext } from '../doc-viewer.context';
import { PartStyles } from '../DocViewerPages/PartStyles';
import { useReadyPdfSession } from '../DocViewerRoot/pdf-session-context';
import { useShallowStable } from '../DocViewerRoot/use-shallow-stable';
import { usePdfAttachments, usePdfProperties } from '../utils/document-info';
import classes from '../DocViewer.module.css';
import { PdfDocumentInfo } from './PdfDocumentInfo';

export type DocViewerDocumentInfoStylesNames =
  | 'documentInfo'
  | 'documentHeading'
  | 'documentLayer'
  | 'properties'
  | 'outlineItem';

export interface DocViewerDocumentInfoProps
  extends BoxProps, CompoundStylesApiProps<DocViewerDocumentInfoFactory>, ElementProps<'div'> {}

export type DocViewerDocumentInfoFactory = Factory<{
  props: DocViewerDocumentInfoProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerDocumentInfoStylesNames;
  compound: true;
}>;

type InfoProps = Omit<ComponentProps<typeof PdfDocumentInfo>, 'properties' | 'attachments'>;

/** The properties and attachments of a document, read once and not for each session render */
const DocumentInfoView = memo(function DocumentInfoView({ document, ...props }: InfoProps) {
  const { locale } = useDocViewerContext();
  const properties = usePdfProperties(document, true, locale);
  const attachments = usePdfAttachments(document);
  return (
    <PdfDocumentInfo
      document={document}
      properties={properties}
      attachments={attachments}
      {...props}
    />
  );
});

/** Properties, attachments and layers of a PDF */
export const DocViewerDocumentInfo = factory<DocViewerDocumentInfoFactory>((_props) => {
  const { classNames, className, style, styles, vars, ref, ...others } = useProps(
    'DocViewerDocumentInfo',
    null,
    _props
  );
  useDocViewerContext();
  const session = useReadyPdfSession();
  const setVisible = session?.content.pdfLayers.setVisible;
  const onLayerChange = useCallbackRef((id: string, visible: boolean) => setVisible?.(id, visible));
  const stylesOptions = useShallowStable({ className, style });
  const elementProps = useShallowStable(others);
  if (!session) {
    return null;
  }

  return (
    <PartStyles classNames={classNames} styles={styles}>
      <DocumentInfoView
        document={session.loaded.ready!.document}
        layers={session.content.pdfLayers.layers}
        onLayerChange={onLayerChange}
        stylesOptions={stylesOptions}
        elementProps={elementProps}
        rootRef={ref}
      />
    </PartStyles>
  );
});

DocViewerDocumentInfo.classes = classes;
DocViewerDocumentInfo.displayName = 'mantine-doc-viewer/DocViewerDocumentInfo';
