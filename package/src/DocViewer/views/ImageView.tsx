import { ActionIcon, Tooltip } from '@mantine/core';
import { useElementSize, useMergedRef } from '@mantine/hooks';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { FitScreenIcon, RotateIcon } from '../icons';
import { clampZoom, zoomIn, zoomOut } from '../zoom';
import { ZoomControls } from '../ZoomControls';
import { getImageFitScale, getRotatedSize, ImageRotation, Size } from './image-fit';
import { DocViewerLoading, DocViewerMessage } from './MessageView';
import { TOOLTIP_EVENTS } from '../a11y';

type ImageZoom = number | 'fit';

/** Point that stays under the pointer (or the middle of the view) while zooming */
interface ZoomAnchor {
  x: number;
  y: number;
  ratioX: number;
  ratioY: number;
}

function getAnchor(stage: HTMLElement, clientX?: number, clientY?: number): ZoomAnchor {
  const rect = stage.getBoundingClientRect();
  const x = clientX === undefined ? stage.clientWidth / 2 : clientX - rect.left;
  const y = clientY === undefined ? stage.clientHeight / 2 : clientY - rect.top;

  return {
    x,
    y,
    ratioX: stage.scrollWidth > 0 ? (stage.scrollLeft + x) / stage.scrollWidth : 0.5,
    ratioY: stage.scrollHeight > 0 ? (stage.scrollTop + y) / stage.scrollHeight : 0.5,
  };
}

/** Drag with the mouse to scroll around an image larger than the view, touch scrolls natively */
function useDragToPan(stage: HTMLDivElement | null) {
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    if (!stage) {
      return undefined;
    }

    let last: { x: number; y: number } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      const overflowing =
        stage.scrollWidth > stage.clientWidth || stage.scrollHeight > stage.clientHeight;
      if (event.button !== 0 || event.pointerType !== 'mouse' || !overflowing) {
        return;
      }

      last = { x: event.clientX, y: event.clientY };
      stage.setPointerCapture?.(event.pointerId);
      setPanning(true);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!last) {
        return;
      }

      stage.scrollLeft -= event.clientX - last.x;
      stage.scrollTop -= event.clientY - last.y;
      last = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = () => {
      last = null;
      setPanning(false);
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);

    return () => {
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
    };
  }, [stage]);

  return panning;
}

export function ImageView() {
  const { getStyles, src, fileName, alt, labels } = useDocViewerContext();
  const title = useDocumentTitle();
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState<ImageZoom>('fit');
  const [rotation, setRotation] = useState<ImageRotation>(0);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const { ref: sizeRef, width, height } = useElementSize<HTMLDivElement>();
  const stageRef = useMergedRef(sizeRef, setStage);
  const pendingAnchor = useRef<ZoomAnchor | null>(null);
  const panning = useDragToPan(stage);

  const fitScale = naturalSize ? getImageFitScale({ width, height }, naturalSize, rotation) : 1;
  const scale = zoom === 'fit' ? fitScale : zoom;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const zoomTo = useCallback(
    (next: ImageZoom, clientX?: number, clientY?: number) => {
      if (stage) {
        pendingAnchor.current = getAnchor(stage, clientX, clientY);
      }
      setZoom(next === 'fit' ? next : clampZoom(next));
    },
    [stage]
  );

  // Keep the anchor point in place once the new size has been laid out
  useLayoutEffect(() => {
    const anchor = pendingAnchor.current;
    if (stage && anchor) {
      pendingAnchor.current = null;
      stage.scrollLeft = anchor.ratioX * stage.scrollWidth - anchor.x;
      stage.scrollTop = anchor.ratioY * stage.scrollHeight - anchor.y;
    }

    if (stage) {
      setOverflowing(
        stage.scrollWidth > stage.clientWidth + 1 || stage.scrollHeight > stage.clientHeight + 1
      );
    }
  }, [stage, scale, rotation, width, height]);

  // Pinch on a trackpad arrives as a wheel event with ctrlKey set
  useEffect(() => {
    if (!stage) {
      return undefined;
    }

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();
      zoomTo(scaleRef.current * Math.exp(-event.deltaY * 0.01), event.clientX, event.clientY);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [stage, zoomTo]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const actions: Record<string, () => void> = {
      '+': () => zoomTo(zoomIn(scale)),
      '=': () => zoomTo(zoomIn(scale)),
      '-': () => zoomTo(zoomOut(scale)),
      '0': () => zoomTo('fit'),
      r: () => setRotation((current) => ((current + 90) % 360) as ImageRotation),
    };

    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  // A server-rendered image can finish loading before React attaches onLoad
  const checkLoaded = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) {
      setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
    }
  }, []);

  const ready = naturalSize !== null && !failed;
  const frameSize = naturalSize ? getRotatedSize(naturalSize, rotation) : null;

  const controls = ready && (
    <>
      <ZoomControls
        scale={scale}
        fitted={zoom === 'fit'}
        fitLabel={labels.fitToView}
        fitIcon={<FitScreenIcon />}
        onZoom={zoomTo}
        onFit={() => zoomTo('fit')}
      />
      <Tooltip events={TOOLTIP_EVENTS} label={labels.rotate}>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={labels.rotate}
          onClick={() => setRotation((current) => ((current + 90) % 360) as ImageRotation)}
        >
          <RotateIcon />
        </ActionIcon>
      </Tooltip>
    </>
  );

  return (
    <>
      <DocViewerToolbar>{controls}</DocViewerToolbar>
      <div {...getStyles('body')}>
        <div
          ref={stageRef}
          {...getStyles('imageStage')}
          tabIndex={ready ? 0 : undefined}
          role={ready ? 'region' : undefined}
          aria-label={ready ? title : undefined}
          aria-keyshortcuts={ready ? 'Plus Minus 0 R' : undefined}
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
                  alt={alt ?? fileName ?? labels.image}
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
