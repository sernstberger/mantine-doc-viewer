import { ActionIcon, Button, ButtonProps, Group, Text, useDirection } from '@mantine/core';
import React from 'react';
import { softDisabled } from '../a11y';
import { DocViewerTooltip } from '../controls';
import { useDocViewerContext } from '../DocViewer.context';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  ExtractIcon,
  RotateIcon,
  TrashIcon,
  UndoIcon,
} from '../icons';
import type { PageOrder } from './page-edits';

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

interface EditorBarProps {
  order: PageOrder;
  selection: PageOrder;
  selectedCount: number;
  edited: boolean;
  busy: boolean;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onRotate: () => void;
  onExtract: () => void;
  onReset: () => void;
  onCancel: () => void;
  onDone: () => void;
  onSave: () => void;
}

/** The editing actions, from moving pages to saving */
function EditorActions(props: EditorBarProps) {
  const { labels } = useDocViewerContext();
  const rtl = useDirection().dir === 'rtl';

  return (
    <Group gap={6} wrap="wrap">
      <EditorButton
        label={labels.moveEarlier}
        icon={rtl ? <ArrowRightIcon /> : <ArrowLeftIcon />}
        variant="default"
        onClick={() => props.onMove(-1)}
      />
      <EditorButton
        label={labels.moveLater}
        icon={rtl ? <ArrowLeftIcon /> : <ArrowRightIcon />}
        variant="default"
        onClick={() => props.onMove(1)}
      />
      <EditorButton
        label={labels.deletePages}
        icon={<TrashIcon />}
        variant="default"
        {...softDisabled(props.order.length <= 1, props.onRemove)}
      />
      <EditorButton
        label={labels.rotatePages}
        icon={<RotateIcon />}
        variant="default"
        onClick={props.onRotate}
      />
      <EditorButton
        label={labels.extractPages}
        icon={<ExtractIcon />}
        variant="default"
        {...softDisabled(props.selection.length === 0 || props.busy, props.onExtract)}
      />
      <EditorButton
        label={labels.resetPages}
        icon={<UndoIcon />}
        variant="subtle"
        {...softDisabled(!props.edited, props.onReset)}
      />
      <EditorButton
        label={labels.cancel}
        icon={<CloseIcon />}
        variant="subtle"
        onClick={props.onCancel}
      />
      <EditorButton
        label={labels.done}
        icon={<CheckIcon />}
        variant="default"
        loading={props.busy}
        onClick={props.onDone}
      />
      <EditorButton
        label={labels.savePages}
        icon={<DownloadIcon />}
        loading={props.busy}
        onClick={props.onSave}
      />
    </Group>
  );
}

/** The bar above the pages: the title and count of selected pages, and the actions */
export function EditorBar(props: EditorBarProps) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <Group {...getStyles('editorBar')} gap="xs" justify="space-between" wrap="wrap">
      <Group gap="xs" wrap="wrap">
        <Text size="sm" {...getStyles('editorTitle')}>
          {labels.editPages}
        </Text>
        <Text size="sm" c="dimmed" aria-live="polite">
          {labels.selectedCount(props.selectedCount)}
        </Text>
      </Group>
      <EditorActions {...props} />
    </Group>
  );
}
