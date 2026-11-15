import { render, screen } from '@mantine-tests/core';
import { act, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DocViewer, DocViewerProps } from '../DocViewer';
import type { DocViewerMark, DocViewerMarkupTool } from './markup';

import { installIntersectionObserver } from '../../../../test-utils/intersection-observer';
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

  it('makes the current page the one tab stop, and says how to draw', async () => {
    mockPdf();
    renderViewer('rectangle');
    const layer = await screen.findByRole('application', { name: 'Rectangle on page 2' });

    // One tab stop for the pages: the current page's layer. The others are reached by Page Down
    expect(screen.getByRole('application', { name: 'Rectangle on page 1' })).toHaveAttribute(
      'tabindex',
      '0'
    );
    expect(layer).toHaveAttribute('tabindex', '-1');
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
    render(
      <>
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          defaultZoom={1}
          markupTool="text"
        />
        <button type="button">After the viewer</button>
      </>
    );
    await focusLayer('Text box on page 1');
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Text box text' })).toHaveFocus()
    );
    await userEvent.tab();

    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Text box text' })).not.toBeInTheDocument()
    );
    // Tab leaves the pages (the other pages' layers are no tab stops); focus stays where it went
    expect(screen.getByRole('button', { name: 'After the viewer' })).toHaveFocus();
  });

  it('reads out a text mark as it is added or cancelled, and says which keys do that', async () => {
    mockPdf();
    const { onMarkupChange } = renderViewer('text');
    await focusLayer('Text box on page 1');

    await userEvent.keyboard('{Enter}');
    const box = screen.getByRole('textbox', { name: 'Text box text' });
    expect(box).toHaveAttribute('aria-keyshortcuts', 'Control+Enter Meta+Enter Escape');
    expect(box).toHaveAttribute('aria-description', expect.stringContaining('Escape cancels'));
    await waitFor(() => expect(box).toHaveFocus());
    await userEvent.keyboard('Note{Control>}{Enter}{/Control}');
    await status('Text box added');
    expect(onMarkupChange).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Text box text' })).toHaveFocus()
    );
    await userEvent.keyboard('Draft{Escape}');
    await status('Mark cancelled');
    expect(screen.queryByRole('textbox', { name: 'Text box text' })).not.toBeInTheDocument();
    expect(onMarkupChange).toHaveBeenCalledTimes(1);
  });

  it('is no tab stop without a tool', async () => {
    mockPdf();
    renderViewer('pen', { markupTool: null, defaultMarkup: [] });
    await screen.findByRole('group', { name: 'Page 1 of 3' });
    expect(screen.queryByRole('application')).not.toBeInTheDocument();
  });

  it('moves to the layer of the next and previous page with Page Down and Page Up', async () => {
    mockPdf();
    const { onMarkupChange } = renderViewer('rectangle');
    await focusLayer('Rectangle on page 1');
    const layer = (page: number) =>
      screen.getByRole('application', { name: `Rectangle on page ${page}` });

    await userEvent.keyboard('{PageDown}');
    expect(layer(2)).toHaveFocus();
    await userEvent.keyboard('{PageDown}{PageDown}');
    // The last page: nowhere further to go
    expect(layer(3)).toHaveFocus();
    await userEvent.keyboard('{PageUp}{PageUp}{PageUp}');
    expect(layer(1)).toHaveFocus();

    // A mark being drawn is dropped when focus leaves its page
    await userEvent.keyboard('{Enter}{ArrowRight}{PageDown}');
    await status('Mark cancelled');
    expect(layer(2)).toHaveFocus();
    expect(layer(1).querySelectorAll('path')).toHaveLength(0);
    expect(onMarkupChange).not.toHaveBeenCalled();

    // With a modifier the key is the viewer's
    await userEvent.keyboard('{Control>}{PageUp}{/Control}');
    expect(layer(2)).toHaveFocus();
  });

  it('makes the layer of the current page the tab stop as the page changes', async () => {
    mockPdf();
    const view = renderViewer('rectangle', { page: 1 });
    const layer = (page: number) =>
      screen.getByRole('application', { name: `Rectangle on page ${page}` });
    await screen.findByRole('application', { name: 'Rectangle on page 3' });

    view.rerender(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultZoom={1}
        markupTool="rectangle"
        page={3}
      />
    );
    await waitFor(() => expect(layer(3)).toHaveAttribute('tabindex', '0'));
    expect(layer(1)).toHaveAttribute('tabindex', '-1');
  });

  describe('on pages away from the view', () => {
    let io: ReturnType<typeof installIntersectionObserver>;
    beforeEach(() => {
      io = installIntersectionObserver();
    });
    afterEach(() => io.uninstall());

    const pageGroup = (page: number) => screen.getByRole('group', { name: `Page ${page} of 3` });

    it('has no layer, and takes focus once the page comes near', async () => {
      mockPdf();
      renderViewer('rectangle');
      await screen.findByRole('group', { name: 'Page 3 of 3' });
      await act(async () => io.setIntersecting(pageGroup(1), true));
      const first = await focusLayer('Rectangle on page 1');
      // Page 2 is not near the view: no layer to draw on
      expect(screen.queryByRole('application', { name: 'Rectangle on page 2' })).toBeNull();

      await userEvent.keyboard('{PageDown}');
      expect(first).toHaveFocus();
      // Scrolling to page 2 brings it near, and its layer takes focus as it mounts
      await act(async () => io.setIntersecting(pageGroup(2), true));
      expect(screen.getByRole('application', { name: 'Rectangle on page 2' })).toHaveFocus();

      // A layer that leaves is no longer one to move focus to
      await act(async () => io.setIntersecting(pageGroup(1), false));
      expect(screen.queryByRole('application', { name: 'Rectangle on page 1' })).toBeNull();
    });
  });
});

describe('the marks for screen readers', () => {
  beforeEach(() => getDocument.mockReset());

  const marks: DocViewerMark[] = [
    {
      type: 'highlight',
      id: 'a',
      page: 1,
      color: 'yellow',
      rect: { x: 10, y: 10, width: 50, height: 20 },
    },
    {
      type: 'text',
      id: 'b',
      page: 1,
      color: 'red',
      x: 20,
      y: 40,
      text: 'Check this',
      fontSize: 14,
    },
  ];

  it('lists the marks of each page beside its markup layer, and keeps the list up to date', async () => {
    mockPdf();
    renderViewer('rectangle', { defaultMarkup: marks });

    const list = await screen.findByRole('list', { name: 'Page 1: 2 marks' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Highlight', 'Text box: Check this']);
    // Outside the layer, where screen readers read in browse mode
    expect(list.closest('[role="application"]')).toBeNull();
    expect(screen.queryByRole('list', { name: /^Page 2/ })).toBeNull();

    await focusLayer('Rectangle on page 2');
    await userEvent.keyboard('{Enter}{Shift>}{ArrowRight}{ArrowDown}{/Shift}{Enter}');
    expect(await screen.findByRole('list', { name: 'Page 2: 1 mark' })).toHaveTextContent(
      'Rectangle'
    );
  });

  it('lists the marks without a tool too', async () => {
    mockPdf();
    renderViewer('pen', { markupTool: null, defaultMarkup: marks });
    expect(await screen.findByRole('list', { name: 'Page 1: 2 marks' })).toBeInTheDocument();
  });
});
