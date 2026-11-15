import { Textarea, VisuallyHidden } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import React from 'react';
import { useDocViewerPageContext } from '../../doc-viewer.context';
import type { DocViewerMarkupLabels } from '../default-labels';
import type { DocViewerMark } from '../utils/markup';
import { getFontStyle, type TextDraft } from '../utils/markup-draft';

/** Text boxes already on the page */
export function MarkupTexts({ marks, scale }: { marks: DocViewerMark[]; scale: number }) {
  const { getStyles } = useDocViewerPageContext();

  return (
    <>
      {marks.map(
        (mark) =>
          mark.type === 'text' && (
            <div
              key={mark.id}
              {...getStyles('markupText', {
                style: {
                  left: mark.x * scale,
                  top: mark.y * scale,
                  ...getFontStyle(mark.fontSize, mark.color, scale),
                },
              })}
              data-mark="text"
            >
              {mark.text}
            </div>
          )
      )}
    </>
  );
}

interface MarkupTextInputProps {
  labels: DocViewerMarkupLabels;
  textDraft: TextDraft;
  setTextDraft: (draft: TextDraft | null) => void;
  commitText: () => void;
  cancelText: () => void;
  scale: number;
  fontSize: number;
  color: string;
}

/** The text box being typed */
export function MarkupTextInput({
  labels,
  textDraft,
  setTextDraft,
  commitText,
  cancelText,
  scale,
  fontSize,
  color,
}: MarkupTextInputProps) {
  const { getStyles } = useDocViewerPageContext();

  return (
    <Textarea
      key={`${textDraft.x},${textDraft.y}`}
      variant="unstyled"
      autosize
      minRows={1}
      autoFocus
      aria-label={labels.markupTextLabel}
      aria-description={labels.markupTextKeysLabel}
      aria-keyshortcuts="Control+Enter Meta+Enter Escape"
      value={textDraft.text}
      onChange={(event) => setTextDraft({ ...textDraft, text: event.currentTarget.value })}
      onBlur={commitText}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={getHotkeyHandler([
        ['mod+Enter', commitText],
        ['Escape', cancelText],
      ])}
      {...getStyles('markupText', {
        style: { left: textDraft.x * scale, top: textDraft.y * scale },
      })}
      classNames={{ input: getStyles('markupInput').className }}
      styles={{ input: getFontStyle(fontSize, color, scale) }}
      data-editing
    />
  );
}

/**
 * The page's marks for screen readers, which skip the drawing: a hidden list beside the markup
 * layer (not in it, since the layer is an application where screen readers pass keys through)
 */
export function MarkList({
  pageNumber,
  marks,
  labels,
}: {
  pageNumber: number;
  marks: DocViewerMark[];
  labels: DocViewerMarkupLabels;
}) {
  return (
    <VisuallyHidden role="list" aria-label={labels.pageMarksLabel(pageNumber, marks.length)}>
      {marks.map((mark) => {
        const tool = labels.markupToolLabels[mark.type];
        return (
          <span key={mark.id} role="listitem">
            {mark.type === 'text' ? labels.textMarkLabel(tool, mark.text) : tool}
          </span>
        );
      })}
    </VisuallyHidden>
  );
}
