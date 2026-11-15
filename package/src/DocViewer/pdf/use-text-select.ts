import { useDebouncedCallback } from '@mantine/hooks';
import { useEffect } from 'react';
import type { DocViewerEvents } from '../controller';
import { getPageRects } from './page-points';
import type { PdfRotation } from './render-page';

/** How long the selection must stay as it is before it is reported, in ms. Dragging changes it all the time */
const SELECT_SETTLE_TIME = 250;

interface TextSelectInput {
  scrollRoot: HTMLElement | null;
  scale: number;
  rotation: PdfRotation;
  onTextSelect: NonNullable<DocViewerEvents['onTextSelect']>;
}

/**
 * Reports text the reader selected in the pages: the text, the page it starts on and its boxes on
 * that page. Waits for the selection to settle, so dragging or moving a selection handle makes one call
 */
export function useTextSelect({ scrollRoot, scale, rotation, onTextSelect }: TextSelectInput) {
  const report = useDebouncedCallback(() => {
    const selection = window.getSelection()!;
    const text = selection.toString().trim();
    if (selection.isCollapsed || !text) {
      return;
    }

    const range = selection.getRangeAt(0);
    const start = range.startContainer;
    const pageNode = (start instanceof Element ? start : start.parentElement)!.closest<HTMLElement>(
      '[data-page-number]'
    );
    if (!pageNode || !scrollRoot!.contains(pageNode)) {
      return;
    }

    // A range reports the box of each element it covers as well as its text: the same spots
    // twice. Boxes outside the page belong to the pages the selection goes on to, and a box as
    // big as the page is the page itself
    const pageBox = pageNode.getBoundingClientRect();
    const boxes = Array.from(range.getClientRects()).filter(
      (box, index, all) =>
        box.left >= pageBox.left &&
        box.right <= pageBox.right &&
        box.top >= pageBox.top &&
        box.bottom <= pageBox.bottom &&
        (box.width < pageBox.width || box.height < pageBox.height) &&
        all.findIndex(
          (other) =>
            other.left === box.left &&
            other.top === box.top &&
            other.width === box.width &&
            other.height === box.height
        ) === index
    );

    onTextSelect(
      text,
      Number(pageNode.dataset.pageNumber),
      getPageRects(boxes, pageBox, scale, rotation)
    );
  }, SELECT_SETTLE_TIME);

  useEffect(() => {
    if (!scrollRoot) {
      return undefined;
    }

    document.addEventListener('selectionchange', report);
    return () => {
      document.removeEventListener('selectionchange', report);
      report.cancel();
    };
  }, [report, scrollRoot]);
}
