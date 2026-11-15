import { VisuallyHidden } from '@mantine/core';
import { useElementSize, useMergedRef } from '@mantine/hooks';
import React, { useState } from 'react';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { printImage } from '../print';
import { getRegionProps } from '../a11y';
import { useAnnouncement } from '../pdf/use-announcement';
import { useZoomAnnouncement } from '../use-zoom-announcement';
import { getFrameStyle, getImageFitScale, getImageStyle, ImageRotation } from './image-fit';
import { nextImageRotation } from './image-zoom';
import { ImageControls } from './ImageControls';
import { ImageOverlay } from './ImageOverlay';
import { useDragToPan } from './use-drag-to-pan';
import { useImageController } from './use-image-controller';
import { useImageKeys } from './use-image-keys';
import { useImageLoad } from './use-image-load';
import { useImageZoom } from './use-image-zoom';

export function ImageView() {
  const {
    getStyles,
    src,
    fileName,
    alt,
    labels,
    zoom: zoomProp,
    defaultZoom,
    events,
  } = useDocViewerContext();
  const title = useDocumentTitle();
  const [rotation, setRotation] = useState<ImageRotation>(0);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const { ref: sizeRef, width, height } = useElementSize<HTMLDivElement>();
  const pan = useDragToPan<HTMLDivElement>();
  const stageRef = useMergedRef(sizeRef, setStage, pan.ref);
  const { naturalSize, failed, ready, checkLoaded, onLoad, onError } = useImageLoad();

  const [announcement, announce] = useAnnouncement();
  const fitScale = naturalSize ? getImageFitScale({ width, height }, naturalSize, rotation) : 1;
  const { zoom, scale, zoomTo, overflowing } = useImageZoom({
    stage,
    zoom: zoomProp,
    defaultZoom,
    fitScale,
    ready,
    onZoomChange: events.onZoomChange,
    layoutKey: `${rotation}:${width}x${height}`,
    onZoom: () => markZoom(),
  });
  const markZoom = useZoomAnnouncement(scale, announce);
  const rotate = () => setRotation(nextImageRotation);
  const handleKeyDown = useImageKeys({ scale, zoomTo, rotate });
  const imageAlt = alt ?? fileName ?? labels.image;
  const print = () => printImage(src, imageAlt, fileName);
  useImageController({ ready, scale, zoomTo, rotate, print });

  return (
    <>
      <DocViewerToolbar onPrint={ready ? print : undefined}>
        {ready && <ImageControls scale={scale} zoom={zoom} zoomTo={zoomTo} rotate={rotate} />}
      </DocViewerToolbar>
      <div {...getStyles('body')}>
        {/* Once the image is ready getRegionProps makes this a focusable, labelled region (role and
            tabIndex come through the spread), and the keys are for that region */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          ref={stageRef}
          {...getStyles('imageStage')}
          {...getRegionProps(ready, title, 'Plus Minus 0 R')}
          onKeyDown={handleKeyDown}
          data-pannable={(ready && overflowing) || undefined}
          data-panning={pan.panning || undefined}
        >
          <div {...getStyles('imageCanvas')}>
            <div
              {...getStyles('imageFrame', { style: getFrameStyle(naturalSize, rotation, scale) })}
            >
              {!failed && (
                <img
                  ref={checkLoaded}
                  src={src}
                  alt={imageAlt}
                  draggable={false}
                  onLoad={onLoad}
                  onError={onError}
                  data-loaded={ready || undefined}
                  {...getStyles('image', { style: getImageStyle(naturalSize, rotation, scale) })}
                />
              )}
            </div>
          </div>
        </div>

        {!ready && <ImageOverlay failed={failed} />}
      </div>

      {ready && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
    </>
  );
}
