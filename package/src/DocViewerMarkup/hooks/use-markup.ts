import { parseThemeColor, useMantineTheme } from '@mantine/core';
import { useCallbackRef, useUncontrolled } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useMemo, useRef, useState } from 'react';
import {
  DocViewerMark,
  DocViewerMarkupTool,
  MARKUP_TOOLS,
  saveMarkedDocument,
} from '../utils/markup';
import { groupMarksByPage } from '../utils/marks-by-page';
import type { PdfRotation } from '../../utils/render-page';
import type { DocViewerMarkupLabels } from '../default-labels';
import type { DocViewerMarkupOptions } from '../markup-extension';

const DEFAULT_WIDTH = 2;
const DEFAULT_FONT_SIZE = 14;

/**
 * What each page's markup layer draws with. The same object until the tool or a setting changes,
 * so a new mark renders only the page it is on
 */
export interface PdfLayerMarkup {
  tool: DocViewerMarkupTool | null;

  /** Text of the markup tools, with the extension's `labels` laid over the defaults */
  labels: DocViewerMarkupLabels;

  /** Color of a new mark made with a tool, resolved from the theme to a CSS color */
  getColor: (tool: DocViewerMarkupTool) => string;
  width: number;
  fontSize: number;

  /** Reads a message out through the viewer's status region, such as a mark placed from the keyboard */
  announce: (message: string) => void;

  /** Adds a mark after the others */
  addMark: (mark: DocViewerMark) => void;

  /** Puts `next` where `mark` is */
  replaceMark: (mark: DocViewerMark, next: DocViewerMark) => void;

  /** Called with each page's markup layer element, and with `null` when it is removed */
  registerLayer: (pageNumber: number, node: HTMLElement | null) => void;

  /** Scrolls to a page and moves keyboard focus to its markup layer, once the layer is there */
  focusPage: (pageNumber: number) => void;
}

/** What the markup layer's hooks read: the page it sits on and the markup state */
export interface MarkupLayerInput {
  pageNumber: number;

  /** Page size at 100%, before the viewer's rotation */
  width: number;
  height: number;
  scale: number;
  rotation: PdfRotation;
  markup: PdfLayerMarkup;

  /** The marks on this page */
  marks: DocViewerMark[];
}

export interface PdfMarkup {
  tools: DocViewerMarkupTool[];
  tool: DocViewerMarkupTool | null;
  setTool: (tool: DocViewerMarkupTool | null) => void;
  marks: DocViewerMark[];
  setMarks: (marks: DocViewerMark[]) => void;

  /** Removes the last mark */
  undo: () => void;

  /** Whether the marks are being written into the PDF */
  saving: boolean;

  /** Writes the marks into the document and returns the new file's bytes */
  save: (document: PDFDocumentProxy) => Promise<Uint8Array>;

  /** What the pages' markup layers draw with */
  layer: PdfLayerMarkup;

  /** The marks of each page; a page keeps its array until its own marks change */
  marksByPage: ReadonlyMap<number, DocViewerMark[]>;
}

/**
 * Focus moving from one page's markup layer to another's. Layers mount only near the view, so
 * the page's layer may not be there yet: it takes focus when it mounts
 */
function useLayerFocus(scrollToPage: (pageNumber: number) => void) {
  const layers = useRef(new Map<number, HTMLElement>());
  const pending = useRef<number | null>(null);

  const registerLayer = useCallbackRef((pageNumber: number, node: HTMLElement | null) => {
    if (!node) {
      layers.current.delete(pageNumber);
      return;
    }
    layers.current.set(pageNumber, node);
    if (pending.current === pageNumber) {
      pending.current = null;
      node.focus({ preventScroll: true });
    }
  });

  const focusPage = useCallbackRef((pageNumber: number) => {
    scrollToPage(pageNumber);
    const node = layers.current.get(pageNumber);
    pending.current = node ? null : pageNumber;
    node?.focus({ preventScroll: true });
  });

  return { registerLayer, focusPage };
}

interface LayerMarkupInput {
  options: DocViewerMarkupOptions;
  labels: DocViewerMarkupLabels;
  tool: DocViewerMarkupTool | null;
  marks: DocViewerMark[];
  setMarks: (marks: DocViewerMark[]) => void;
  announce: (message: string) => void;
  scrollToPage: (pageNumber: number) => void;
}

/** The layers' part of the markup: stable while the tool and its settings are */
function useLayerMarkup({
  options,
  labels,
  tool,
  marks,
  setMarks,
  announce,
  scrollToPage,
}: LayerMarkupInput): PdfLayerMarkup {
  const theme = useMantineTheme();
  const addMark = useCallbackRef((mark: DocViewerMark) => setMarks([...marks, mark]));
  const replaceMark = useCallbackRef((mark: DocViewerMark, next: DocViewerMark) =>
    setMarks(marks.map((item) => (item === mark ? next : item)))
  );
  const { registerLayer, focusPage } = useLayerFocus(scrollToPage);
  const { color: markupColor, width, fontSize } = options;

  return useMemo(
    () => ({
      tool,
      labels,
      getColor: (forTool: DocViewerMarkupTool) => {
        const color = markupColor ?? (forTool === 'highlight' ? 'yellow' : 'red');
        return parseThemeColor({ color, theme }).value;
      },
      width: width ?? DEFAULT_WIDTH,
      fontSize: fontSize ?? DEFAULT_FONT_SIZE,
      announce,
      addMark,
      replaceMark,
      registerLayer,
      focusPage,
    }),
    [
      tool,
      labels,
      theme,
      markupColor,
      width,
      fontSize,
      announce,
      addMark,
      replaceMark,
      registerLayer,
      focusPage,
    ]
  );
}

/** The marks grouped by page, keeping each page's array while its marks stay the same */
function useMarksByPage(marks: DocViewerMark[]) {
  const previous = useRef<ReadonlyMap<number, DocViewerMark[]>>(undefined);
  return useMemo(() => {
    previous.current = groupMarksByPage(marks, previous.current);
    return previous.current;
  }, [marks]);
}

/** The markup state pages draw with; the same object until something in it changes, so pages can skip renders */
export function useMarkup({
  options,
  labels,
  announce,
  scrollToPage,
}: {
  options: DocViewerMarkupOptions;
  labels: DocViewerMarkupLabels;
  announce: (message: string) => void;
  scrollToPage: (pageNumber: number) => void;
}): PdfMarkup {
  const [tool, changeTool] = useUncontrolled<DocViewerMarkupTool | null>({
    value: options.tool,
    defaultValue: options.defaultTool,
    finalValue: null,
    onChange: options.onToolChange,
  });
  const [marks, changeMarks] = useUncontrolled<DocViewerMark[]>({
    value: options.value,
    defaultValue: options.defaultValue,
    finalValue: [],
    onChange: options.onChange,
  });
  const setTool = useCallbackRef(changeTool);
  const setMarks = useCallbackRef(changeMarks);
  const [saving, setSaving] = useState(false);
  const layer = useLayerMarkup({ options, labels, tool, marks, setMarks, announce, scrollToPage });
  const marksByPage = useMarksByPage(marks);
  const { tools } = options;

  return useMemo(() => {
    const save = async (document: PDFDocumentProxy) => {
      setSaving(true);
      try {
        return await saveMarkedDocument(document, marks);
      } finally {
        setSaving(false);
      }
    };

    return {
      tools: tools ?? MARKUP_TOOLS,
      tool,
      setTool,
      marks,
      setMarks,
      undo: () => setMarks(marks.slice(0, -1)),
      saving,
      save,
      layer,
      marksByPage,
    };
  }, [tool, setTool, marks, setMarks, saving, tools, layer, marksByPage]);
}
