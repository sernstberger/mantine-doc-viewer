import type { PDFDocumentProxy } from 'pdfjs-dist';
import React from 'react';
import type { DocViewerPageLayout, DocViewerThumbnailsPosition } from '../doc-viewer.types';
import {
  LayoutControl,
  PageNavigationControl,
  PdfZoomControl,
  RotateControl,
  ThumbnailsControl,
} from '../DocViewerToolbar/PdfNavigationControls';
import {
  EditPagesControl,
  InfoControl,
  OutlineControl,
  PresentationControl,
  SearchControl,
} from '../DocViewerToolbar/PdfPanelControls';
import type { PdfLayer } from '../hooks/pdf/use-pdf-layers';
import type { PdfZoom } from '../utils/pdf-zoom';

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

  /** Take focus back after a presentation or the page editor ends */
  presentRef?: React.Ref<HTMLButtonElement>;
  editPagesRef?: React.Ref<HTMLButtonElement>;

  searchOpened: boolean;
  searchToggleRef: React.Ref<HTMLButtonElement>;
  onToggleSearch: () => void;
}

/** Toolbar buttons for PDFs: thumbnails, paging, zoom, rotation, layout, outline and search */
export function PdfControls(props: PdfControlsProps) {
  return (
    <>
      <ThumbnailsControl
        opened={props.thumbnailsOpened}
        onToggle={props.onToggleThumbnails}
        position={props.position}
        onPositionChange={props.onPositionChange}
      />
      <PageNavigationControl
        currentPage={props.currentPage}
        numPages={props.document.numPages}
        onPage={props.onPage}
      />
      <PdfZoomControl
        scale={props.scale}
        zoom={props.zoom}
        onZoom={props.onZoom}
        layout={props.layout}
      />
      <RotateControl onRotate={props.onRotate} />
      <LayoutControl layout={props.layout} onLayoutChange={props.onLayoutChange} />
      <OutlineControl document={props.document} onPage={props.onPage} />
      <InfoControl
        document={props.document}
        layers={props.layers}
        onLayerChange={props.onLayerChange}
      />
      <PresentationControl onPresent={props.onPresent} buttonRef={props.presentRef} />
      <EditPagesControl onEditPages={props.onEditPages} buttonRef={props.editPagesRef} />
      <SearchControl
        opened={props.searchOpened}
        toggleRef={props.searchToggleRef}
        onToggle={props.onToggleSearch}
      />
    </>
  );
}
