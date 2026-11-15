import { Box, VisuallyHidden } from '@mantine/core';
import React from 'react';
import { useDocumentTitle, useDocViewerContext } from '../doc-viewer.context';
import { useImageView } from '../hooks/image/use-image-view';
import { getRegionProps } from '../utils/a11y';
import { getFrameStyle, getImageStyle } from '../utils/image-fit';
import type { DocViewerImageProps } from './DocViewerImage';
import { ImageOverlay } from './ImageOverlay';

export function ImageView({
  alt,
  classNames,
  className,
  style,
  styles,
  vars,
  ...others
}: DocViewerImageProps) {
  const { getStyles, src } = useDocViewerContext();
  const title = useDocumentTitle();
  const view = useImageView(alt);
  const { naturalSize, failed, ready, rotation, scale } = view;
  const stylesProps = { classNames, styles };

  return (
    <>
      <Box {...getStyles('body', { className, style, ...stylesProps })} {...others}>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          ref={view.stageRef}
          {...getStyles('imageStage', stylesProps)}
          {...getRegionProps(ready, title, 'Plus Minus 0 R')}
          onKeyDown={view.onKeyDown}
          data-pannable={(ready && view.overflowing) || undefined}
          data-panning={view.pan.panning || undefined}
        >
          <div {...getStyles('imageCanvas', stylesProps)}>
            <div
              {...getStyles('imageFrame', {
                ...stylesProps,
                style: getFrameStyle(naturalSize, rotation, scale),
              })}
            >
              {!failed && (
                <img
                  ref={view.checkLoaded}
                  src={src}
                  alt={view.imageAlt}
                  draggable={false}
                  onLoad={view.onLoad}
                  onError={view.onError}
                  data-loaded={ready || undefined}
                  {...getStyles('image', {
                    ...stylesProps,
                    style: getImageStyle(naturalSize, rotation, scale),
                  })}
                />
              )}
            </div>
          </div>
        </div>

        {!ready && <ImageOverlay failed={failed} {...stylesProps} />}
      </Box>

      {ready && <VisuallyHidden role="status">{view.announcement}</VisuallyHidden>}
    </>
  );
}
