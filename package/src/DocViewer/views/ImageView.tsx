import { ActionIcon } from '@mantine/core';
import { useElementSize, useMergedRef } from '@mantine/hooks';
import React, { useCallback, useEffect, useState } from 'react';
import { useDocumentTitle, useDocViewerContext, useShowControl } from '../DocViewer.context';
import { useRegisterController } from '../controller';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { printImage } from '../print';
import { FitScreenIcon, RotateIcon } from '../icons';
import { zoomIn, zoomOut } from '../zoom';
import { ZoomControls } from '../ZoomControls';
import { getImageFitScale, getRotatedSize, ImageRotation, Size } from './image-fit';
import { getImageKeyAction, nextImageRotation } from './image-zoom';
import { DocViewerLoading, DocViewerMessage } from './MessageView';
import { useDragToPan } from './use-drag-to-pan';
import { useImageZoom } from './use-image-zoom';
import { getRegionProps } from '../a11y';
import { DocViewerTooltip, useControlProps } from '../controls';

export function ImageView() {
  const { getStyles, src, fileName, alt, labels, controller, events, defaultZoom } =
    useDocViewerContext();
  const controlProps = useControlProps();
  const show = useShowControl();
  const title = useDocumentTitle();
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const [failed, setFailed] = useState(false);
  const [rotation, setRotation] = useState<ImageRotation>(0);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const { ref: sizeRef, width, height } = useElementSize<HTMLDivElement>();
  const stageRef = useMergedRef(sizeRef, setStage);
  const panning = useDragToPan(stage);

  const fitScale = naturalSize ? getImageFitScale({ width, height }, naturalSize, rotation) : 1;
  const { zoom, scale, zoomTo, overflowing } = useImageZoom({
    stage,
    defaultZoom,
    fitScale,
    layoutKey: `${rotation}:${width}x${height}`,
  });
  const rotate = () => setRotation(nextImageRotation);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const action = getImageKeyAction(event);
    if (!action) {
      return;
    }

    event.preventDefault();
    const actions = {
      'zoom-in': () => zoomTo(zoomIn(scale)),
      'zoom-out': () => zoomTo(zoomOut(scale)),
      fit: () => zoomTo('fit'),
      rotate,
    };
    actions[action]();
  };

  // A server-rendered image can finish loading before React attaches onLoad
  const checkLoaded = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) {
      setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
    }
  }, []);

  const ready = naturalSize !== null && !failed;
  const imageAlt = alt ?? fileName ?? labels.image;
  const print = () => printImage(src, imageAlt, fileName);

  useEffect(() => {
    if (naturalSize && !failed) {
      events.onDocumentLoad({ type: 'image', ...naturalSize });
    }
  }, [naturalSize, failed, events]);

  useEffect(() => {
    failed && events.onDocumentError(new Error(`Image could not be loaded: ${src}`));
  }, [failed, events, src]);

  useEffect(() => {
    ready && events.onZoomChange(scale, zoom === 'fit');
  }, [ready, scale, zoom, events]);

  useRegisterController(controller, {
    setZoom: (next) => zoomTo(next),
    zoomIn: () => zoomTo(zoomIn(scale)),
    zoomOut: () => zoomTo(zoomOut(scale)),
    rotate,
    print,
  });
  const frameSize = naturalSize ? getRotatedSize(naturalSize, rotation) : null;

  const controls = ready && (
    <>
      {show('zoom') && (
        <ZoomControls
          scale={scale}
          fitted={zoom === 'fit'}
          fitLabel={labels.fitToView}
          fitIcon={<FitScreenIcon />}
          onZoom={zoomTo}
          onFit={() => zoomTo('fit')}
        />
      )}
      {show('rotate') && (
        <DocViewerTooltip label={labels.rotate}>
          <ActionIcon {...controlProps()} aria-label={labels.rotate} onClick={rotate}>
            <RotateIcon />
          </ActionIcon>
        </DocViewerTooltip>
      )}
    </>
  );

  return (
    <>
      <DocViewerToolbar onPrint={ready ? print : undefined}>{controls}</DocViewerToolbar>
      <div {...getStyles('body')}>
        <div
          ref={stageRef}
          {...getStyles('imageStage')}
          {...getRegionProps(ready, title, 'Plus Minus 0 R')}
          onKeyDown={handleKeyDown}
          data-pannable={(ready && overflowing) || undefined}
          data-panning={panning || undefined}
        >
          <div {...getStyles('imageCanvas')}>
            <div
              {...getStyles('imageFrame', {
                style: frameSize
                  ? { width: frameSize.width * scale, height: frameSize.height * scale }
                  : undefined,
              })}
            >
              {!failed && (
                <img
                  ref={checkLoaded}
                  src={src}
                  alt={imageAlt}
                  draggable={false}
                  onLoad={(event) => {
                    const { naturalWidth, naturalHeight } = event.currentTarget;
                    setNaturalSize({ width: naturalWidth, height: naturalHeight });
                  }}
                  onError={() => setFailed(true)}
                  data-loaded={ready || undefined}
                  {...getStyles('image', {
                    style: naturalSize
                      ? {
                          width: naturalSize.width * scale,
                          height: naturalSize.height * scale,
                          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        }
                      : undefined,
                  })}
                />
              )}
            </div>
          </div>
        </div>

        {!ready && (
          <div {...getStyles('imageOverlay')}>
            {failed ? (
              <DocViewerMessage withDownload error>
                {labels.imageError}
              </DocViewerMessage>
            ) : (
              <DocViewerLoading />
            )}
          </div>
        )}
      </div>
    </>
  );
}
