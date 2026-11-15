import { Textarea } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import type { DocViewerMark } from './markup';
import { getFontStyle, type TextDraft } from './markup-draft';

/** Text boxes already on the page */
export function PdfMarkupTexts({ marks, scale }: { marks: DocViewerMark[]; scale: number }) {
  const { getStyles } = useDocViewerContext();

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
  scale: number;
  fontSize: number;
  color: string;
}

/** The text box being typed */
export function PdfMarkupTextInput({
  textDraft,
  setTextDraft,
  commitText,
  scale,
  fontSize,
  color,
}: PdfMarkupTextInputProps) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <Textarea
      key={`${textDraft.x},${textDraft.y}`}
      variant="unstyled"
      autosize
      minRows={1}
      autoFocus
      aria-label={labels.markupText}
      value={textDraft.text}
      onChange={(event) => setTextDraft({ ...textDraft, text: event.currentTarget.value })}
      onBlur={commitText}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={getHotkeyHandler([
        ['mod+Enter', commitText],
        ['Escape', () => setTextDraft(null)],
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
