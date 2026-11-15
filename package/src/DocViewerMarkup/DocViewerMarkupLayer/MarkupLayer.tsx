import React from 'react';
import { useDocViewerPageContext } from '../../doc-viewer.context';
import { getOverlayStyle } from '../../utils/page-overlay';
import type { PdfRotation } from '../../utils/render-page';
import type { PdfLayerMarkup } from '../hooks/use-markup';
import { useMarkupDrawing } from '../hooks/use-markup-drawing';
import { useMarkupKeyboard } from '../hooks/use-markup-keyboard';
import { useTextDraft } from '../hooks/use-text-draft';
import { type DocViewerMark, getMarkLines, toPathData } from '../utils/markup';
import { MarkupTextInput, MarkupTexts } from './MarkupText';

interface MarkupLayerProps {
  pageNumber: number;
  numPages: number;

  /** The layer the Tab key reaches while a tool is picked: the current page's */
  tabStop: boolean;

  /** Page size at 100%, before the viewer's rotation */
  width: number;
  height: number;
  scale: number;
  rotation: PdfRotation;
  markup: PdfLayerMarkup;

  /** The marks on this page */
  marks: DocViewerMark[];
}

function MarkShape({ mark, scale }: { mark: DocViewerMark; scale: number }) {
  if (mark.type === 'text') {
    return null;
  }

  if (mark.type === 'highlight') {
    const { x, y, width, height } = mark.rect;
    return (
      <rect
        data-mark="highlight"
        x={x * scale}
        y={y * scale}
        width={width * scale}
        height={height * scale}
        fill={mark.color}
      />
    );
  }

  return (
    <path
      data-mark={mark.type}
      d={toPathData(getMarkLines(mark), scale)}
      stroke={mark.color}
      strokeWidth={mark.width * scale}
    />
  );
}

/** Marks on one PDF page, and drawing new ones with the current markup tool */
export function MarkupLayer({
  pageNumber,
  numPages,
  tabStop,
  width,
  height,
  scale,
  rotation,
  markup,
  marks,
}: MarkupLayerProps) {
  const { getStyles } = useDocViewerPageContext();
  const { tool } = markup;
  const input = { pageNumber, width, height, scale, rotation, markup, marks };
  const text = useTextDraft(input);
  const { textDraft } = text;
  const drawing = useMarkupDrawing({ ...input, ...text });
  const { draftMark, handlers } = drawing;
  const keyboard = useMarkupKeyboard({ ...input, ...text, ...drawing, numPages, tabStop });
  const { caret } = keyboard;

  if (marks.length === 0 && !tool && !textDraft) {
    return null;
  }

  return (
    <div
      {...getStyles('markupLayer', {
        style: getOverlayStyle(width * scale, height * scale, rotation),
      })}
      data-tool={tool ?? undefined}
      data-page-number={pageNumber}
      ref={keyboard.layerRef}
      {...keyboard.keyboardProps}
      {...handlers}
    >
      <svg width={width * scale} height={height * scale} aria-hidden>
        {marks.map((mark) => (
          <MarkShape key={mark.id} mark={mark} scale={scale} />
        ))}
        {draftMark && <MarkShape mark={draftMark} scale={scale} />}
        {caret && (
          <g data-markup-caret stroke={markup.getColor(tool!)}>
            <line
              x1={caret[0] * scale - 6}
              x2={caret[0] * scale + 6}
              y1={caret[1] * scale}
              y2={caret[1] * scale}
            />
            <line
              x1={caret[0] * scale}
              x2={caret[0] * scale}
              y1={caret[1] * scale - 6}
              y2={caret[1] * scale + 6}
            />
          </g>
        )}
      </svg>

      <MarkupTexts marks={marks} scale={scale} />

      {textDraft && (
        <MarkupTextInput
          {...text}
          labels={markup.labels}
          textDraft={textDraft}
          scale={scale}
          fontSize={markup.fontSize}
          color={markup.getColor('text')}
        />
      )}
    </div>
  );
}
