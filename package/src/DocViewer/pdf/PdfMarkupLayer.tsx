import React from 'react';
import { useDocViewerPageContext } from '../DocViewer.context';
import { DocViewerMark, getMarkLines, toPathData } from './markup';
import { getOverlayStyle } from './page-overlay';
import { PdfMarkupTextInput, PdfMarkupTexts } from './PdfMarkupText';
import type { PdfRotation } from './render-page';
import { useMarkupDrawing } from './use-markup-drawing';
import { useMarkupKeyboard } from './use-markup-keyboard';
import type { PdfLayerMarkup } from './use-markup';
import { useTextDraft } from './use-text-draft';

interface PdfMarkupLayerProps {
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
export function PdfMarkupLayer({
  pageNumber,
  numPages,
  tabStop,
  width,
  height,
  scale,
  rotation,
  markup,
  marks,
}: PdfMarkupLayerProps) {
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
          // The keyboard cursor, shown while the layer has keyboard focus
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

      <PdfMarkupTexts marks={marks} scale={scale} />

      {textDraft && (
        <PdfMarkupTextInput
          {...text}
          textDraft={textDraft}
          scale={scale}
          fontSize={markup.fontSize}
          color={markup.getColor('text')}
        />
      )}
    </div>
  );
}
