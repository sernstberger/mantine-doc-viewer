import { useElementSize, useMergedRef } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useDocViewerContext } from '../../doc-viewer.context';
import { updateDocViewerStateAction } from '../../doc-viewer.store';
import { getImageFitScale, type ImageRotation } from '../../utils/image-fit';
import { nextImageRotation } from '../../utils/image-zoom';
import { printImage } from '../../utils/print';
import { useAnnouncement } from '../pdf/use-announcement';
import { useZoomAnnouncement } from '../use-zoom-announcement';
import { useDragToPan } from './use-drag-to-pan';
import { useImageController } from './use-image-controller';
import { useImageKeys } from './use-image-keys';
import { useImageLoad } from './use-image-load';
import { useImageZoom } from './use-image-zoom';

/** Everything the image view shows: load state, zoom, rotation, panning, keys and announcements */
export function useImageView(alt: string | undefined) {
  const ctx = useDocViewerContext();
  const { src, fileName, labels, zoom: zoomProp, defaultZoom, events, store } = ctx;
  const [rotation, setRotation] = useState<ImageRotation>(0);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const { ref: sizeRef, width, height } = useElementSize<HTMLDivElement>();
  const pan = useDragToPan<HTMLDivElement>();
  const stageRef = useMergedRef(sizeRef, setStage, pan.ref);
  const load = useImageLoad();
  const [announcement, announce] = useAnnouncement();
  const fitScale = load.naturalSize
    ? getImageFitScale({ width, height }, load.naturalSize, rotation)
    : 1;
  const { zoom, scale, zoomTo, overflowing } = useImageZoom({
    stage,
    zoom: zoomProp,
    defaultZoom,
    fitScale,
    ready: load.ready,
    onZoomChange: events.onZoomChange,
    store,
    layoutKey: `${rotation}:${width}x${height}`,
    onZoom: () => markZoom(),
  });
  const markZoom = useZoomAnnouncement(scale, announce);
  const rotate = () => setRotation(nextImageRotation);
  const onKeyDown = useImageKeys({ scale, zoomTo, rotate });
  const imageAlt = alt ?? fileName ?? labels.imageLabel;
  const print = () => printImage(src, imageAlt, fileName);
  useImageController({ ready: load.ready, scale, zoomTo, rotate, print });
  useEffect(() => updateDocViewerStateAction({ rotation }, store), [rotation, store]);

  return {
    ...load,
    stageRef,
    pan,
    rotation,
    zoom,
    scale,
    zoomTo,
    overflowing,
    rotate,
    onKeyDown,
    announcement,
    imageAlt,
    print,
  };
}
