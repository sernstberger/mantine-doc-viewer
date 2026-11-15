import { MantineColor, parseThemeColor, useMantineTheme } from '@mantine/core';
import { useCallbackRef, useUncontrolled } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useMemo, useState } from 'react';
import { DocViewerMark, DocViewerMarkupTool, MARKUP_TOOLS, saveMarkedDocument } from './markup';

/** Props of the viewer for drawing on PDF pages and saving the marks into the PDF */
export interface DocViewerMarkupProps {
  /** Determines whether the toolbar has a markup button that opens the markup bar, `false` by default */
  withMarkup?: boolean;

  /** Tools in the markup bar, in that order. All are shown by default */
  markupTools?: DocViewerMarkupTool[];

  /**
   * Markup tool readers draw with on PDF pages, for a controlled tool. `null` means no tool: pages
   * scroll and text can be selected. Works without `withMarkup`, for apps with their own buttons
   */
  markupTool?: DocViewerMarkupTool | null;

  /** Markup tool when a PDF opens, `null` (no tool) by default */
  defaultMarkupTool?: DocViewerMarkupTool | null;

  /** Called when the reader picks a markup tool, or `null` when they put it down */
  onMarkupToolChange?: (tool: DocViewerMarkupTool | null) => void;

  /** Marks on PDF pages, for controlled markup. Each mark is placed in page coordinates (PDF points from the page's top-left) */
  markup?: DocViewerMark[];

  /** Marks on PDF pages when a PDF opens, none by default */
  defaultMarkup?: DocViewerMark[];

  /** Called with all marks whenever the reader draws, types or undoes a mark */
  onMarkupChange?: (marks: DocViewerMark[]) => void;

  /** Key of `theme.colors` or any valid CSS color for new marks. Highlights are `'yellow'` and other marks `'red'` by default */
  markupColor?: MantineColor;

  /** Line width of new pen marks, shapes and signatures in PDF points, `2` by default */
  markupWidth?: number;

  /** Font size of new text boxes in PDF points, `14` by default */
  markupFontSize?: number;
}

const DEFAULT_WIDTH = 2;
const DEFAULT_FONT_SIZE = 14;

export interface PdfMarkup {
  tools: DocViewerMarkupTool[];
  tool: DocViewerMarkupTool | null;
  setTool: (tool: DocViewerMarkupTool | null) => void;
  marks: DocViewerMark[];
  setMarks: (marks: DocViewerMark[]) => void;

  /** Colour of a new mark made with a tool, resolved from the theme to a CSS color */
  getColor: (tool: DocViewerMarkupTool) => string;
  width: number;
  fontSize: number;

  /** Removes the last mark */
  undo: () => void;

  /** Whether the marks are being written into the PDF */
  saving: boolean;

  /** Writes the marks into the document and returns the new file's bytes */
  save: (document: PDFDocumentProxy) => Promise<Uint8Array>;
}

/** The markup state pages draw with; the same object until something in it changes, so pages can skip renders */
export function useMarkup(props: DocViewerMarkupProps): PdfMarkup {
  const theme = useMantineTheme();
  const [tool, changeTool] = useUncontrolled<DocViewerMarkupTool | null>({
    value: props.markupTool,
    defaultValue: props.defaultMarkupTool,
    finalValue: null,
    onChange: props.onMarkupToolChange,
  });
  const [marks, changeMarks] = useUncontrolled<DocViewerMark[]>({
    value: props.markup,
    defaultValue: props.defaultMarkup,
    finalValue: [],
    onChange: props.onMarkupChange,
  });
  const setTool = useCallbackRef(changeTool);
  const setMarks = useCallbackRef(changeMarks);
  const [saving, setSaving] = useState(false);
  const { markupTools, markupColor, markupWidth, markupFontSize } = props;

  return useMemo(() => {
    const getColor = (forTool: DocViewerMarkupTool) => {
      const color = markupColor ?? (forTool === 'highlight' ? 'yellow' : 'red');
      return parseThemeColor({ color, theme }).value;
    };

    const save = async (document: PDFDocumentProxy) => {
      setSaving(true);
      try {
        return await saveMarkedDocument(document, marks);
      } finally {
        setSaving(false);
      }
    };

    return {
      tools: markupTools ?? MARKUP_TOOLS,
      tool,
      setTool,
      marks,
      setMarks,
      getColor,
      width: markupWidth ?? DEFAULT_WIDTH,
      fontSize: markupFontSize ?? DEFAULT_FONT_SIZE,
      undo: () => setMarks(marks.slice(0, -1)),
      saving,
      save,
    };
  }, [
    theme,
    tool,
    setTool,
    marks,
    setMarks,
    saving,
    markupTools,
    markupColor,
    markupWidth,
    markupFontSize,
  ]);
}
