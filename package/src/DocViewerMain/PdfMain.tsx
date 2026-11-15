import React from 'react';
import type { DocViewerThumbnailsPosition } from '../DocViewerRoot/DocViewerRoot';
import { useDocViewerContext } from '../doc-viewer.context';
import { getThumbnailsLayout } from '../utils/geometry';
import { PdfThumbnails, type PdfThumbnailsProps } from '../DocViewerThumbnails/PdfThumbnails';
import type { PdfDocumentState } from '../hooks/pdf/use-pdf-document';

interface PdfMainProps {
  position: DocViewerThumbnailsPosition;
  presenting: boolean;
  /** The thumbnails strip, put before or after the pages so focus order follows the layout */
  thumbnails: React.ReactNode;
  /** Shown only while presenting */
  presentationControls: React.ReactNode;
  /** The scrolling body with the pages */
  children: React.ReactNode;
}

/** The area under the toolbar: the pages, the thumbnails beside them, and presentation controls */
export function PdfMain({
  position,
  presenting,
  thumbnails,
  presentationControls,
  children,
}: PdfMainProps) {
  const { getStyles } = useDocViewerContext();
  const { first } = getThumbnailsLayout(position);

  return (
    <div
      {...getStyles('main')}
      data-thumbnails-position={position}
      data-presenting={presenting || undefined}
    >
      {first && thumbnails}
      {children}
      {!first && thumbnails}
      {presenting && presentationControls}
    </div>
  );
}

type Ready = Extract<PdfDocumentState, { status: 'ready' }>;

interface PdfThumbnailsPanelProps extends Omit<
  PdfThumbnailsProps,
  'document' | 'placeholderSize' | 'orientation'
> {
  /** The loaded document, or null while it loads */
  ready: Ready | null;
  opened: boolean;
  presenting: boolean;
  position: DocViewerThumbnailsPosition;
}

/** The thumbnails strip, when it is open on a loaded document that is not being presented */
export function PdfThumbnailsPanel({
  ready,
  opened,
  presenting,
  position,
  onReorder,
  onDelete,
  ...props
}: PdfThumbnailsPanelProps) {
  const { withPageEditing } = useDocViewerContext();
  if (!ready || !opened || presenting) {
    return null;
  }
  // Page editing lets the thumbnails reorder and delete pages too
  const edits = withPageEditing ? { onReorder, onDelete } : {};

  return (
    <PdfThumbnails
      document={ready.document}
      placeholderSize={ready.firstPageSize}
      orientation={getThumbnailsLayout(position).orientation}
      {...edits}
      {...props}
    />
  );
}
