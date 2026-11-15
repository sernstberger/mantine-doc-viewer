import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerMark, getMarkLines, toPathData } from './markup';
import { getOverlayStyle } from './page-overlay';
import { PdfMarkupTextInput, PdfMarkupTexts } from './PdfMarkupText';
import type { PdfRotation } from './render-page';
import { useMarkupDrawing } from './use-markup-drawing';
import type { PdfMarkup } from './use-markup';
import { useTextDraft } from './use-text-draft';

interface PdfMarkupLayerProps {
  pageNumber: number;

  /** Page size at 100%, before the viewer's rotation */
  width: number;
  height: number;
  scale: number;
  rotation: PdfRotation;
  markup: PdfMarkup;
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
  width,
  height,
  scale,
  rotation,
  markup,
}: PdfMarkupLayerProps) {
  const { getStyles } = useDocViewerContext();
  const { tool, marks } = markup;
  const input = { pageNumber, width, height, scale, rotation, markup };
  const text = useTextDraft(input);
  const { textDraft } = text;
  const { draftMark, handlers } = useMarkupDrawing({ ...input, ...text });
  const pageMarks = marks.filter((mark) => mark.page === pageNumber);

  if (pageMarks.length === 0 && !tool && !textDraft) {
    return null;
  }

  return (
    <div
      {...getStyles('markupLayer', {
        style: getOverlayStyle(width * scale, height * scale, rotation),
      })}
      data-tool={tool ?? undefined}
      data-page-number={pageNumber}
      {...handlers}
    >
      <svg width={width * scale} height={height * scale} aria-hidden>
        {pageMarks.map((mark) => (
          <MarkShape key={mark.id} mark={mark} scale={scale} />
        ))}
        {draftMark && <MarkShape mark={draftMark} scale={scale} />}
      </svg>

      <PdfMarkupTexts marks={pageMarks} scale={scale} />

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
