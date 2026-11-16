import type { DocViewerMarkupTool } from './utils/markup';

/** Text of the markup tools, override any of it with the extension's `labels` option */
export interface DocViewerMarkupLabels {
  /** Toolbar button that opens the markup bar, and the bar's screen reader name */
  markupLabel: string;
  /** Names of the markup tools */
  markupToolLabels: Record<DocViewerMarkupTool, string>;
  /** Label of the button that removes the last mark */
  undoMarkLabel: string;
  /** Label of the button that saves the marks */
  saveMarkupLabel: string;
  /** Label of the button that closes the markup bar */
  closeMarkupLabel: string;
  /** Screen reader name of the box a text mark is typed into */
  markupTextLabel: string;
  /** How to add or cancel the text being typed, read after the text box's name */
  markupTextKeysLabel: string;
  /** Read out after the marks were saved */
  markupSavedLabel: string;
  /** Screen reader name of a page while a markup tool is picked, where keys place marks */
  markupLayerLabel: (tool: string, page: number) => string;
  /** How to place marks with the keyboard, read after the page's markup name */
  markupKeysLabel: string;
  /** Read out when a mark is started with the keyboard, with the tool */
  markStartedLabel: (tool: string) => string;
  /** Read out when a mark is finished, with the tool */
  markAddedLabel: (tool: string) => string;
  /** Read out when a mark in progress is cancelled */
  markCancelledLabel: string;
  /** Screen reader name of the hidden list of a page's marks */
  pageMarksLabel: (page: number, count: number) => string;
  /** A text mark in that list, after the tool's name */
  textMarkLabel: (tool: string, text: string) => string;
}

export const DEFAULT_LABELS: DocViewerMarkupLabels = {
  markupLabel: 'Markup',
  markupToolLabels: {
    highlight: 'Highlight',
    pen: 'Pen',
    text: 'Text box',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    cloud: 'Cloud',
    signature: 'Signature',
  },
  undoMarkLabel: 'Undo',
  saveMarkupLabel: 'Save',
  closeMarkupLabel: 'Close markup',
  markupTextLabel: 'Text box text',
  markupTextKeysLabel: 'Control or Command with Enter adds the text, Escape cancels.',
  markupSavedLabel: 'Markup saved',
  markupLayerLabel: (tool, page) => `${tool} on page ${page}`,
  markupKeysLabel:
    'Arrow keys move the cursor. Enter starts and finishes a mark or opens a text box, Shift with arrow keys draws from the cursor, Escape cancels. Page Up and Page Down go to the previous and next page.',
  markStartedLabel: (tool) => `${tool} started`,
  markAddedLabel: (tool) => `${tool} added`,
  markCancelledLabel: 'Mark cancelled',
  pageMarksLabel: (page, count) => `Page ${page}: ${count} ${count === 1 ? 'mark' : 'marks'}`,
  textMarkLabel: (tool, text) => `${tool}: ${text}`,
};

/** Labels to lay over `DEFAULT_LABELS`: any of them, and any of the tool names */
export type DocViewerMarkupLabelsInput = Partial<
  Omit<DocViewerMarkupLabels, 'markupToolLabels'>
> & {
  markupToolLabels?: Partial<DocViewerMarkupLabels['markupToolLabels']>;
};

/** The markup labels with `overrides` laid over the defaults; `markupToolLabels` is merged one level deep */
export function mergeMarkupLabels(
  overrides: DocViewerMarkupLabelsInput | undefined
): DocViewerMarkupLabels {
  return {
    ...DEFAULT_LABELS,
    ...overrides,
    markupToolLabels: { ...DEFAULT_LABELS.markupToolLabels, ...overrides?.markupToolLabels },
  };
}
