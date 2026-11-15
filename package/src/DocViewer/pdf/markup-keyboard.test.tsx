import { render, screen } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DocViewer, DocViewerProps } from '../DocViewer';
import type { DocViewerMarkupTool } from './markup';

import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';

function renderViewer(tool: DocViewerMarkupTool, props: Partial<DocViewerProps> = {}) {
  const onMarkupChange = jest.fn();
  const view = render(
    <DocViewer
      src="/files/report.pdf"
      pdfWorkerSrc="/worker.mjs"
      defaultZoom={1}
      markupTool={tool}
      onMarkupChange={onMarkupChange}
      {...props}
    />
  );
  return { ...view, onMarkupChange };
}

/** The page's markup layer, focused as a keyboard user reaches it */
async function focusLayer(name: string) {
  const layer = await screen.findByRole('application', { name });
  act(() => layer.focus());
  return layer;
}

const status = (text: string) =>
  waitFor(() => expect(screen.getByRole('status').textContent).toContain(text));

describe('markup from the keyboard', () => {
  beforeEach(() => getDocument.mockReset());

  it('makes each page a tab stop that says how to draw', async () => {
    mockPdf();
    renderViewer('rectangle');
    const layer = await screen.findByRole('application', { name: 'Rectangle on page 2' });

    expect(layer).toHaveAttribute('tabindex', '0');
    expect(layer).toHaveAttribute('aria-description', expect.stringContaining('Arrow keys'));
    expect(layer).toHaveAttribute('aria-keyshortcuts', expect.stringContaining('Enter'));
    // The cursor starts in the middle of the page
    const [across, down] = Array.from(layer.querySelectorAll('[data-markup-caret] line'));
    expect(across).toHaveAttribute('x1', '300');
    expect(down).toHaveAttribute('y1', '390');
  });

  it('draws a box from the cursor with Enter, arrows and Enter', async () => {
    mockPdf();
    const { onMarkupChange } = renderViewer('rectangle');
    const layer = await focusLayer('Rectangle on page 1');

    await userEvent.keyboard('{ArrowLeft}{ArrowUp}{Enter}');
    await status('Rectangle started');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
    // The box being drawn shows before it is finished
    expect(layer.querySelectorAll('path[data-mark="rectangle"]')).toHaveLength(1);
    await userEvent.keyboard('{Enter}');

    expect(onMarkupChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        type: 'rectangle',
        page: 1,
        rect: { x: 296, y: 386, width: 20, height: 10 },
      }),
    ]);
    await status('Rectangle added');
    expect(layer).toHaveFocus();
  });

  it('draws with Shift+arrows, and cancels with Escape or a box too small to see', async () => {
    mockPdf();
    const { onMarkupChange } = renderViewer('highlight');
    const layer = await focusLayer('Highlight on page 1');

    await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowDown}{/Shift}');
    await status('Highlight started');
    await userEvent.keyboard('{Escape}');
    await status('Mark cancelled');
    expect(layer.querySelectorAll('rect')).toHaveLength(0);

    await userEvent.keyboard('{Enter}{Enter}');
    await status('Mark cancelled');
    expect(onMarkupChange).not.toHaveBeenCalled();

    // Escape with nothing drawn and other keys are left to the viewer
    await userEvent.keyboard('{Escape}a');
    await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowDown}{/Shift}{Enter}');
    expect(onMarkupChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        type: 'highlight',
        rect: { x: 316, y: 406, width: 10, height: 10 },
      }),
    ]);
  });

  it('draws pen strokes point by point, and joins a signature', async () => {
    mockPdf();
    const { onMarkupChange } = renderViewer('signature');
    await focusLayer('Signature on page 1');

    await userEvent.keyboard('{Enter}{ArrowRight}{ArrowDown}{Enter}');
    await status('Signature added');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}{Enter}');

    expect(onMarkupChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        type: 'signature',
        strokes: [
          [
            [306, 396],
            [316, 396],
            [316, 406],
          ],
          [
            [316, 406],
            [306, 406],
          ],
        ],
      }),
    ]);
  });

  it('opens a text box at the cursor and comes back to the page after it', async () => {
    mockPdf();
    const { onMarkupChange } = renderViewer('text');
    const layer = await focusLayer('Text box on page 1');

    await userEvent.keyboard('{ArrowDown}{Shift>}{ArrowRight}{/Shift}{Enter}');
    const box = screen.getByRole('textbox', { name: 'Text box text' });
    await waitFor(() => expect(box).toHaveFocus());
    // Enter in the box is a new line, not a new box
    await userEvent.keyboard('Hello{Enter}there{Control>}{Enter}{/Control}');

    expect(onMarkupChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ type: 'text', x: 316, y: 406, text: 'Hello\nthere' }),
    ]);
    await waitFor(() => expect(layer).toHaveFocus());

    // Leaving an open box for the page writes it, and Enter opens the next one
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('One');
    act(() => layer.focus());
    await userEvent.keyboard('{Enter}');
    expect(onMarkupChange).toHaveBeenLastCalledWith([
      expect.anything(),
      expect.objectContaining({ text: 'One' }),
    ]);
  });

  it('leaves focus where it went when the text box closes by Tab', async () => {
    mockPdf();
    renderViewer('text');
    await focusLayer('Text box on page 1');
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Text box text' })).toHaveFocus()
    );
    await userEvent.tab();

    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Text box text' })).not.toBeInTheDocument()
    );
    expect(screen.getByRole('application', { name: 'Text box on page 2' })).toHaveFocus();
  });

  it('is no tab stop without a tool', async () => {
    mockPdf();
    renderViewer('pen', { markupTool: null, defaultMarkup: [] });
    await screen.findByRole('group', { name: 'Page 1 of 3' });
    expect(screen.queryByRole('application')).not.toBeInTheDocument();
  });
});
