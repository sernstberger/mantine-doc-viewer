import { useMergedRef } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { DragHandleIcon } from '../icons';
import { useNearViewport } from './use-near-viewport';
import { usePagePreview } from './use-page-preview';
import { ReorderList, useReorderItem } from './use-reorder-drag';

interface PageTileProps {
  document: PDFDocumentProxy;
  page: number;
  position: number;
  total: number;
  selected: boolean;
  focused: boolean;
  /** How far the page is turned clockwise, in degrees */
  rotation: number;
  scrollRoot: HTMLElement | null;
  reorder: ReorderList;
  onSelect: (event: React.MouseEvent) => void;
}

/** Width of page previews in the editor, in px */
const TILE_WIDTH = 120;

export function PageTile(props: PageTileProps) {
  const { getStyles, labels } = useDocViewerContext();
  const { ref, near } = useNearViewport<HTMLDivElement>(props.scrollRoot, '100% 0px');
  const { itemRef, handleRef } = useReorderItem(props.reorder, props.page);
  const tileRef = useMergedRef(ref, itemRef);
  const { canvasRef, size } = usePagePreview({
    document: props.document,
    pageNumber: props.page,
    width: TILE_WIDTH,
    near,
  });
  const height = size ? (size.height / size.width) * TILE_WIDTH : TILE_WIDTH * 1.3;
  // A turned page keeps the tile's width: sideways, the preview shrinks to fit across it
  const sideways = props.rotation % 180 !== 0;
  const boxHeight = sideways ? (TILE_WIDTH / height) * TILE_WIDTH : height;
  const fit = sideways ? TILE_WIDTH / height : 1;

  return (
    <div
      ref={tileRef}
      {...getStyles('editorPage')}
      {...props.reorder.getItemProps(props.page, props.position - 1)}
      role="option"
      aria-selected={props.selected}
      aria-label={labels.editorPage(props.page, props.position, props.total)}
      tabIndex={props.focused ? 0 : -1}
      data-page={props.page}
      data-selected={props.selected || undefined}
      data-rotation={props.rotation || undefined}
      onClick={(event) => !props.reorder.isDragClick(event) && props.onSelect(event)}
    >
      {/* Touch and pen drag from here, so that swiping the rest of the page scrolls */}
      <span ref={handleRef} {...getStyles('dragHandle')} aria-hidden>
        <DragHandleIcon />
      </span>
      <span
        {...getStyles('thumbnailImage', {
          style: { position: 'relative', width: TILE_WIDTH, height: boxHeight },
        })}
      >
        {near && (
          <canvas
            ref={canvasRef}
            {...getStyles('canvas', {
              style: props.rotation
                ? {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: TILE_WIDTH,
                    height,
                    transform: `translate(-50%, -50%) rotate(${props.rotation}deg) scale(${fit})`,
                  }
                : undefined,
            })}
            aria-hidden
          />
        )}
      </span>
      <span {...getStyles('thumbnailLabel')} aria-hidden>
        {props.page}
      </span>
    </div>
  );
}
