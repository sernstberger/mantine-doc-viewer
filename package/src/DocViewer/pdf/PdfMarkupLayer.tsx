import { Textarea } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import {
  createMarkId,
  DocViewerMark,
  DocViewerMarkPoint,
  DocViewerStrokeMark,
  getMarkLines,
  MIN_MARK_SIZE,
  rectFromPoints,
  TEXT_LINE_HEIGHT,
  toPagePoint,
  toPathData,
} from './markup';
import { getOverlayStyle } from './page-overlay';
import type { PdfRotation } from './render-page';
import type { PdfMarkup } from './use-markup';

interface PdfMarkupLayerProps {
  pageNumber: number;

  /** Page size at 100%, before the viewer's rotation */
  width: number;
  height: number;
  scale: number;
  rotation: PdfRotation;
  markup: PdfMarkup;
}

/** Points of the drag or stroke being drawn */
type Draft = DocViewerMarkPoint[];

interface TextDraft {
  x: number;
  y: number;
  text: string;
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
  const { getStyles, labels } = useDocViewerContext();
  const { tool, marks, setMarks } = markup;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [textDraft, setTextDraft] = useState<TextDraft | null>(null);
  // The signature being written: strokes join it until the reader picks another tool
  const signature = useRef<string | null>(null);
  useEffect(() => {
    signature.current = null;
  }, [tool]);
  const pageMarks = marks.filter((mark) => mark.page === pageNumber);

  if (pageMarks.length === 0 && !tool && !textDraft) {
    return null;
  }

  const getPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return toPagePoint(
      event.clientX - box.left,
      event.clientY - box.top,
      width,
      height,
      scale,
      rotation
    );
  };

  const add = (mark: DocViewerMark) => setMarks([...marks, mark]);

  const commitText = () => {
    const text = textDraft?.text.trimEnd();
    setTextDraft(null);
    text &&
      add({
        type: 'text',
        id: createMarkId(),
        page: pageNumber,
        color: markup.getColor('text'),
        x: textDraft!.x,
        y: textDraft!.y,
        text,
        fontSize: markup.fontSize,
      });
  };

  const addStroke = (points: Draft) => {
    const existing =
      tool === 'signature'
        ? marks.find((mark): mark is DocViewerStrokeMark => mark.id === signature.current)
        : undefined;
    if (existing) {
      setMarks(
        marks.map((mark) =>
          mark === existing ? { ...existing, strokes: [...existing.strokes, points] } : mark
        )
      );
      return;
    }

    const id = createMarkId();
    signature.current = id;
    add({
      type: tool as 'pen' | 'signature',
      id,
      page: pageNumber,
      color: markup.getColor(tool!),
      width: markup.width,
      strokes: [points],
    });
  };

  const commit = (points: Draft) => {
    if (tool === 'pen' || tool === 'signature') {
      addStroke(points);
      return;
    }

    const rect = rectFromPoints(points[0], points[points.length - 1]);
    if (rect.width < MIN_MARK_SIZE || rect.height < MIN_MARK_SIZE) {
      return;
    }
    const id = createMarkId();
    const color = markup.getColor(tool!);
    add(
      tool === 'highlight'
        ? { type: 'highlight', id, page: pageNumber, color, rect }
        : {
            type: tool as 'rectangle' | 'ellipse' | 'cloud',
            id,
            page: pageNumber,
            color,
            rect,
            width: markup.width,
          }
    );
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!tool || event.button !== 0) {
      return;
    }
    event.preventDefault();
    const [x, y] = getPoint(event);

    if (tool === 'text') {
      textDraft && commitText();
      setTextDraft({ x, y, text: '' });
      return;
    }

    // Keeps the stroke going when the pointer leaves the page
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDraft([[x, y]]);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    draft && setDraft([...draft, getPoint(event)]);
  };

  const handlePointerUp = () => {
    draft && commit(draft);
    setDraft(null);
  };

  const draftMark: DocViewerMark | null =
    draft && tool
      ? tool === 'pen' || tool === 'signature'
        ? {
            type: tool,
            id: 'draft',
            page: pageNumber,
            color: markup.getColor(tool),
            width: markup.width,
            strokes: [draft],
          }
        : tool === 'highlight'
          ? {
              type: 'highlight',
              id: 'draft',
              page: pageNumber,
              color: markup.getColor(tool),
              rect: rectFromPoints(draft[0], draft[draft.length - 1]),
            }
          : {
              type: tool as 'rectangle' | 'ellipse' | 'cloud',
              id: 'draft',
              page: pageNumber,
              color: markup.getColor(tool),
              width: markup.width,
              rect: rectFromPoints(draft[0], draft[draft.length - 1]),
            }
      : null;

  const fontStyle = (fontSize: number, color: string) => ({
    fontSize: fontSize * scale,
    lineHeight: TEXT_LINE_HEIGHT,
    color,
  });

  return (
    <div
      {...getStyles('markupLayer', {
        style: getOverlayStyle(width * scale, height * scale, rotation),
      })}
      data-tool={tool ?? undefined}
      data-page-number={pageNumber}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDraft(null)}
    >
      <svg width={width * scale} height={height * scale} aria-hidden>
        {pageMarks.map((mark) => (
          <MarkShape key={mark.id} mark={mark} scale={scale} />
        ))}
        {draftMark && <MarkShape mark={draftMark} scale={scale} />}
      </svg>

      {pageMarks.map(
        (mark) =>
          mark.type === 'text' && (
            <div
              key={mark.id}
              {...getStyles('markupText', {
                style: {
                  left: mark.x * scale,
                  top: mark.y * scale,
                  ...fontStyle(mark.fontSize, mark.color),
                },
              })}
              data-mark="text"
            >
              {mark.text}
            </div>
          )
      )}

      {textDraft && (
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
          styles={{ input: fontStyle(markup.fontSize, markup.getColor('text')) }}
          data-editing
        />
      )}
    </div>
  );
}
