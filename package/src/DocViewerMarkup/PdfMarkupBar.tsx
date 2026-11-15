import { ActionIcon, Button, CloseButton, Divider, Toolbar } from '@mantine/core';
import React from 'react';
import { softDisabled } from '../utils/a11y';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { useDocViewerContext } from '../doc-viewer.context';
import {
  CloudIcon,
  EllipseIcon,
  HighlightIcon,
  PenIcon,
  RectangleIcon,
  SignatureIcon,
  TextBoxIcon,
  UndoIcon,
} from '../utils/icons';
import type { DocViewerMarkupTool } from '../utils/markup';
import type { PdfMarkup } from '../hooks/pdf/use-markup';

const TOOL_ICONS: Record<DocViewerMarkupTool, React.FC> = {
  highlight: HighlightIcon,
  pen: PenIcon,
  text: TextBoxIcon,
  rectangle: RectangleIcon,
  ellipse: EllipseIcon,
  cloud: CloudIcon,
  signature: SignatureIcon,
};

interface PdfMarkupBarProps {
  markup: PdfMarkup;
  onSave: () => void;
  onClose: () => void;
}

/** Markup tools, undo and save, in a bar under the toolbar */
export function PdfMarkupBar({ markup, onSave, onClose }: PdfMarkupBarProps) {
  const { getStyles, labels, size } = useDocViewerContext();
  const controlProps = useControlProps();
  const empty = markup.marks.length === 0;

  return (
    // Mantine's Toolbar: one tab stop, the arrow keys move between the tools
    <Toolbar
      unstyled
      withBorder={false}
      aria-label={labels.markupLabel}
      {...getStyles('markupBar')}
    >
      {markup.tools.map((tool) => {
        const ToolIcon = TOOL_ICONS[tool];
        const active = markup.tool === tool;
        return (
          <DocViewerTooltip key={tool} label={labels.markupToolLabels[tool]}>
            <ActionIcon
              {...controlProps(active)}
              aria-label={labels.markupToolLabels[tool]}
              aria-pressed={active}
              data-tool={tool}
              onClick={() => markup.setTool(active ? null : tool)}
            >
              <ToolIcon />
            </ActionIcon>
          </DocViewerTooltip>
        );
      })}
      <Divider orientation="vertical" {...getStyles('markupDivider')} />
      <DocViewerTooltip label={labels.undoMarkLabel}>
        <ActionIcon
          {...controlProps()}
          aria-label={labels.undoMarkLabel}
          {...softDisabled(empty, markup.undo)}
        >
          <UndoIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <Button
        size={size.input}
        variant="default"
        loading={markup.saving}
        {...getStyles('markupSave')}
        data-toolbar-toggle
        {...softDisabled(empty, onSave)}
      >
        {labels.saveMarkupLabel}
      </Button>
      <CloseButton
        {...getStyles('control')}
        size={size.control}
        aria-label={labels.closeMarkupLabel}
        data-toolbar-toggle
        onClick={onClose}
      />
    </Toolbar>
  );
}
