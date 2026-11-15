import { Textarea, VisuallyHidden } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import React from 'react';
import { useDocViewerPageContext } from '../DocViewer.context';
import type { DocViewerMark } from './markup';
import { getFontStyle, type TextDraft } from './markup-draft';

/** Text boxes already on the page */
export function PdfMarkupTexts({ marks, scale }: { marks: DocViewerMark[]; scale: number }) {
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

interface PdfMarkupTextInputProps {
  textDraft: TextDraft;
  setTextDraft: (draft: TextDraft | null) => void;
  commitText: () => void;
  cancelText: () => void;
  scale: number;
  fontSize: number;
  color: string;
}

/** The text box being typed */
export function PdfMarkupTextInput({
  textDraft,
  setTextDraft,
  commitText,
  cancelText,
  scale,
  fontSize,
  color,
}: PdfMarkupTextInputProps) {
  const { getStyles, labels } = useDocViewerPageContext();

  return (
    <Textarea
      key={`${textDraft.x},${textDraft.y}`}
      variant="unstyled"
      autosize
      minRows={1}
      autoFocus
      aria-label={labels.markupText}
      aria-description={labels.markupTextKeys}
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
export function PdfMarkList({ pageNumber, marks }: { pageNumber: number; marks: DocViewerMark[] }) {
  const { labels } = useDocViewerPageContext();

  return (
    <VisuallyHidden role="list" aria-label={labels.pageMarks(pageNumber, marks.length)}>
      {marks.map((mark) => {
        const tool = labels.markupTools[mark.type];
        return (
          <span key={mark.id} role="listitem">
            {mark.type === 'text' ? labels.textMark(tool, mark.text) : tool}
          </span>
        );
      })}
    </VisuallyHidden>
  );
}
