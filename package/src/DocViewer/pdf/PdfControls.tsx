import type { PDFDocumentProxy } from 'pdfjs-dist';
import React from 'react';
import type { DocViewerPageLayout, DocViewerThumbnailsPosition } from '../DocViewer';
import {
  LayoutControl,
  PageNavigationControl,
  PdfZoomControl,
  RotateControl,
  ThumbnailsControl,
} from './PdfNavigationControls';
import {
  EditPagesControl,
  InfoControl,
  OutlineControl,
  PresentationControl,
  SearchControl,
} from './PdfPanelControls';
import type { PdfLayer } from './use-pdf-layers';
import type { PdfZoom } from './zoom';

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
      <PresentationControl onPresent={props.onPresent} />
      <EditPagesControl onEditPages={props.onEditPages} />
      <SearchControl
        opened={props.searchOpened}
        toggleRef={props.searchToggleRef}
        onToggle={props.onToggleSearch}
      />
    </>
  );
}
