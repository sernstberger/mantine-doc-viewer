import type { MantineColor } from '@mantine/core';
import type { DocViewerExtension } from '../doc-viewer.types';
import type { DocViewerMark, DocViewerMarkupTool } from '../utils/markup';
import type { DocViewerMarkupLabels } from './default-labels';
import { DocViewerMarkupBar } from './DocViewerMarkupBar/DocViewerMarkupBar';
import { DocViewerMarkupButton } from './DocViewerMarkupButton/DocViewerMarkupButton';
import { MarkupSetup } from './markup-setup';
import { MarkupPageLayer } from './MarkupPageLayer';

export interface DocViewerMarkupOptions {
  /** Tools in the markup bar, in that order. All are shown by default */
  tools?: DocViewerMarkupTool[];

  /** Markup tool readers draw with, for a controlled tool. `null` means no tool */
  tool?: DocViewerMarkupTool | null;

  /** Markup tool when a PDF opens, `null` (no tool) by default */
  defaultTool?: DocViewerMarkupTool | null;

  /** Called when the reader picks a markup tool, or `null` when they put it down */
  onToolChange?: (tool: DocViewerMarkupTool | null) => void;

  /** Marks on PDF pages, for controlled markup */
  value?: DocViewerMark[];

  /** Marks on PDF pages when a PDF opens, none by default */
  defaultValue?: DocViewerMark[];

  /** Called with all marks whenever the reader draws, types or undoes a mark */
  onChange?: (marks: DocViewerMark[]) => void;

  /** Key of `theme.colors` or any valid CSS color for new marks. Highlights are `'yellow'` and other marks `'red'` by default */
  color?: MantineColor;

  /** Line width of new pen marks, shapes and signatures in PDF points, `2` by default */
  width?: number;

  /** Font size of new text boxes in PDF points, `14` by default */
  fontSize?: number;

  /** Bytes of the PDF with the marks written in; without it the marked up PDF is downloaded */
  onDocumentChange?: (
    bytes: Uint8Array,
    details: { reason: 'annotate'; pages: number[] }
  ) => void | Promise<void>;

  /** Text of the markup tools, merged with `DEFAULT_LABELS` of `mantine-doc-viewer/markup` */
  labels?: Partial<DocViewerMarkupLabels>;
}

/** Markup tools for `extensions`: highlight, draw, write and sign on PDF pages */
export function createMarkupExtension(options: DocViewerMarkupOptions = {}): DocViewerExtension {
  return {
    name: 'markup',
    options,
    setup: MarkupSetup,
    toolbarControls: [{ control: 'markup', after: 'search', Component: DocViewerMarkupButton }],
    bar: DocViewerMarkupBar,
    pageLayer: MarkupPageLayer,
  };
}
