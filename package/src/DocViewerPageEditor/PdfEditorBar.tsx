import { ActionIcon, Button, ButtonProps, Group, Text, useDirection } from '@mantine/core';
import React from 'react';
import { softDisabled } from '../utils/a11y';
import { DocViewerTooltip } from '../DocViewerToolbar/DocViewerTooltip';
import { useDocViewerContext } from '../doc-viewer.context';
import { usePageEditor } from './page-editor-setup';
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
} from '../utils/icons';
import type { PageOrder } from '../utils/page-edits';

interface EditorButtonProps extends Pick<ButtonProps, 'variant' | 'loading'> {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  /** Props from `softDisabled`: they carry the click handler */
  [key: string]: unknown;
}

/** An action of the editor bar: a labelled button, or an icon with the label as tooltip with the `compact` option */
function EditorButton({ label, icon, variant, loading, ...others }: EditorButtonProps) {
  const { getStyles, size } = useDocViewerContext();
  const compact = usePageEditor()?.compact;

  if (!compact) {
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
        label={labels.moveEarlierLabel}
        icon={rtl ? <ArrowRightIcon /> : <ArrowLeftIcon />}
        variant="default"
        onClick={() => props.onMove(-1)}
      />
      <EditorButton
        label={labels.moveLaterLabel}
        icon={rtl ? <ArrowLeftIcon /> : <ArrowRightIcon />}
        variant="default"
        onClick={() => props.onMove(1)}
      />
      <EditorButton
        label={labels.deletePagesLabel}
        icon={<TrashIcon />}
        variant="default"
        {...softDisabled(props.order.length <= 1, props.onRemove)}
      />
      <EditorButton
        label={labels.rotatePagesLabel}
        icon={<RotateIcon />}
        variant="default"
        onClick={props.onRotate}
      />
      <EditorButton
        label={labels.extractPagesLabel}
        icon={<ExtractIcon />}
        variant="default"
        {...softDisabled(props.selection.length === 0 || props.busy, props.onExtract)}
      />
      <EditorButton
        label={labels.resetPagesLabel}
        icon={<UndoIcon />}
        variant="subtle"
        {...softDisabled(!props.edited, props.onReset)}
      />
      <EditorButton
        label={labels.cancelLabel}
        icon={<CloseIcon />}
        variant="subtle"
        onClick={props.onCancel}
      />
      <EditorButton
        label={labels.doneLabel}
        icon={<CheckIcon />}
        variant="default"
        loading={props.busy}
        onClick={props.onDone}
      />
      <EditorButton
        label={labels.savePagesLabel}
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
          {labels.editPagesLabel}
        </Text>
        <Text size="sm" aria-live="polite" {...getStyles('editorCount')}>
          {labels.selectedCountLabel(props.selectedCount)}
        </Text>
      </Group>
      <EditorActions {...props} />
    </Group>
  );
}
