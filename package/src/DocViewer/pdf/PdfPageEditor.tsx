import { ActionIcon, Button, ButtonProps, Group, Text, VisuallyHidden } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState } from 'react';
import { softDisabled } from '../a11y';
import { DocViewerTooltip } from '../controls';
import { useDocViewerContext } from '../DocViewer.context';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  DragHandleIcon,
  ExtractIcon,
  RotateIcon,
  TrashIcon,
} from '../icons';
import { useAnnouncement } from './use-announcement';
import { useNearViewport } from './use-near-viewport';
import { usePagePreview } from './use-page-preview';
import { ReorderList, useReorderItem, useReorderList } from './use-reorder-drag';
import {
  buildExtractRequest,
  initialOrder,
  isEdited,
  movePage,
  moveSelected,
  PageOrder,
  removeSelected,
} from './page-edits';

export type PdfSaveReason = 'save' | 'extract' | 'reorder' | 'delete' | 'annotate';

interface PdfPageEditorProps {
  document: PDFDocumentProxy;

  /** Ends editing: with the edited document's bytes, or null when nothing changed */
  onDone: (bytes: Uint8Array | null) => void;
  onCancel: () => void;
  onSave: (bytes: Uint8Array, reason: PdfSaveReason, pages: number[]) => Promise<void> | void;
}

interface PageTileProps {
  document: PDFDocumentProxy;
  page: number;
  position: number;
  total: number;
  selected: boolean;
  focused: boolean;
  scrollRoot: HTMLElement | null;
  reorder: ReorderList;
  onSelect: (event: React.MouseEvent) => void;
}

/** Width of page previews in the editor, in px */
const TILE_WIDTH = 120;

function PageTile(props: PageTileProps) {
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
      onClick={(event) => !props.reorder.isDragClick(event) && props.onSelect(event)}
    >
      {/* Touch and pen drag from here, so that swiping the rest of the page scrolls */}
      <span ref={handleRef} {...getStyles('dragHandle')} aria-hidden>
        <DragHandleIcon />
      </span>
      <span {...getStyles('thumbnailImage', { style: { width: TILE_WIDTH, height } })}>
        {near && <canvas ref={canvasRef} {...getStyles('canvas')} aria-hidden />}
      </span>
      <span {...getStyles('thumbnailLabel')} aria-hidden>
        {props.page}
      </span>
    </div>
  );
}

interface EditorButtonProps extends Pick<ButtonProps, 'variant' | 'loading'> {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  /** Props from `softDisabled`: they carry the click handler */
  [key: string]: unknown;
}

/** An action of the editor bar: a labelled button, or an icon with the label as tooltip when `compactPageEditor` is set */
function EditorButton({ label, icon, variant, loading, ...others }: EditorButtonProps) {
  const { getStyles, size, compactPageEditor } = useDocViewerContext();

  if (!compactPageEditor) {
    return (
      <Button
        {...getStyles('editorButton')}
        size={size.input}
        variant={variant}
        loading={loading}
        {...others}
      >
        {label}
      </Button>
    );
  }

  return (
    <DocViewerTooltip label={label}>
      <ActionIcon
        {...getStyles('editorButton')}
        size={size.input}
        variant={variant}
        loading={loading}
        aria-label={label}
        {...others}
      >
        {icon}
      </ActionIcon>
    </DocViewerTooltip>
  );
}

/** Reorder, remove and extract pages. Edits make a new document; the original file is not changed */
export function PdfPageEditor({ document, onDone, onCancel, onSave }: PdfPageEditorProps) {
  const { getStyles, labels } = useDocViewerContext();
  const [order, setOrder] = useState<PageOrder>(() => initialOrder(document.numPages));
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [announcement, announce] = useAnnouncement();
  const edited = isEdited(order, document.numPages);
  const selection = order.filter((page) => selected.has(page));
  const reorder = useReorderList({
    container: scrollRoot,
    layout: 'grid',
    order,
    onReorder: (page, toIndex) => {
      const next = movePage(order, page, toIndex);
      setOrder(next);
      setFocusedIndex(toIndex);
      announce(labels.pageMoved(page, toIndex + 1));
    },
  });

  const focusIndex = (index: number) => {
    const next = Math.min(Math.max(index, 0), order.length - 1);
    setFocusedIndex(next);
    scrollRoot?.querySelector<HTMLElement>(`[data-page="${order[next]}"]`)?.focus();
  };

  const toggle = (page: number) =>
    setSelected((current) => {
      const next = new Set(current);
      next.has(page) ? next.delete(page) : next.add(page);
      return next;
    });

  /** Pages an action applies to: the selection, or the focused page when nothing is selected */
  const targets = () => (selected.size > 0 ? selected : new Set([order[focusedIndex]]));

  const move = (direction: -1 | 1) => {
    const pages = targets();
    const next = moveSelected(order, pages, direction);
    setOrder(next);
    const moved = [...pages][0];
    announce(labels.pageMoved(moved, next.indexOf(moved) + 1));
    requestAnimationFrame(() => focusIndex(next.indexOf(order[focusedIndex])));
  };

  const remove = () => {
    const pages = targets();
    const next = removeSelected(order, pages);
    if (next.length === order.length) {
      return;
    }
    setOrder(next);
    setSelected(new Set());
    setFocusedIndex(Math.min(focusedIndex, next.length - 1));
    announce(labels.pagesRemoved(order.length - next.length));
  };

  const build = (pages: PageOrder) =>
    document.extractPages(buildExtractRequest(pages)) as Promise<Uint8Array>;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const page = order[focusedIndex];
    const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key);

    if (isArrow && event.altKey) {
      event.preventDefault();
      move(step);
    } else if (isArrow) {
      event.preventDefault();
      focusIndex(focusedIndex + step);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusIndex(event.key === 'Home' ? 0 : order.length - 1);
    } else if (event.key === ' ') {
      event.preventDefault();
      toggle(page);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      remove();
    } else if (event.key.toLowerCase() === 'a' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      setSelected(new Set(order));
    }
  };

  return (
    <div {...getStyles('editor')}>
      <Group {...getStyles('editorBar')} gap="xs" justify="space-between" wrap="wrap">
        <Group gap="xs" wrap="wrap">
          <Text fw={600} size="sm">
            {labels.editPages}
          </Text>
          <Text size="sm" c="dimmed" aria-live="polite">
            {labels.selectedCount(selected.size)}
          </Text>
        </Group>
        <Group gap={6} wrap="wrap">
          <EditorButton
            label={labels.moveEarlier}
            icon={<ArrowLeftIcon />}
            variant="default"
            onClick={() => move(-1)}
          />
          <EditorButton
            label={labels.moveLater}
            icon={<ArrowRightIcon />}
            variant="default"
            onClick={() => move(1)}
          />
          <EditorButton
            label={labels.deletePages}
            icon={<TrashIcon />}
            variant="default"
            {...softDisabled(order.length <= 1, remove)}
          />
          <EditorButton
            label={labels.extractPages}
            icon={<ExtractIcon />}
            variant="default"
            {...softDisabled(selection.length === 0 || busy, () =>
              run(async () => onSave(await build(selection), 'extract', selection))
            )}
          />
          <EditorButton
            label={labels.resetPages}
            icon={<RotateIcon />}
            variant="subtle"
            {...softDisabled(!edited, () => {
              setOrder(initialOrder(document.numPages));
              setSelected(new Set());
            })}
          />
          <EditorButton
            label={labels.cancel}
            icon={<CloseIcon />}
            variant="subtle"
            onClick={onCancel}
          />
          <EditorButton
            label={labels.done}
            icon={<CheckIcon />}
            variant="default"
            loading={busy}
            onClick={() => run(async () => onDone(edited ? await build(order) : null))}
          />
          <EditorButton
            label={labels.savePages}
            icon={<DownloadIcon />}
            loading={busy}
            onClick={() =>
              run(async () => {
                const bytes = await build(order);
                await onSave(bytes, 'save', order);
                onDone(bytes);
              })
            }
          />
        </Group>
      </Group>

      <div
        ref={setScrollRoot}
        {...getStyles('editorPages')}
        role="listbox"
        aria-multiselectable
        aria-label={labels.pages}
        aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Delete Space Control+A"
        onKeyDown={handleKeyDown}
        data-dragging={reorder.dragging || undefined}
      >
        {order.map((page, index) => (
          <PageTile
            key={page}
            document={document}
            page={page}
            position={index + 1}
            total={order.length}
            selected={selected.has(page)}
            focused={index === focusedIndex}
            scrollRoot={scrollRoot}
            reorder={reorder}
            onSelect={(event) => {
              setFocusedIndex(index);
              event.shiftKey || event.metaKey || event.ctrlKey
                ? toggle(page)
                : setSelected(new Set(selected.has(page) && selected.size === 1 ? [] : [page]));
            }}
          />
        ))}
      </div>

      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </div>
  );
}
