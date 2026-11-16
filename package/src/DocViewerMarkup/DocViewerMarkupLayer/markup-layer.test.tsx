import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import { createDocViewer } from '../../doc-viewer.store';
import { saveMarkup, setMarkupTool } from '../markup-actions';
import type { DocViewerMarkupOptions } from '../markup-extension';
import { MarkupViewer, type MarkupViewerProps } from '../test-utils';
import type { DocViewerMark } from '../utils/markup';

function renderViewer(markup: DocViewerMarkupOptions = {}, props: MarkupViewerProps = {}) {
  const [store] = createDocViewer();
  return { ...render(<MarkupViewer markup={markup} store={store} {...props} />), store };
}

async function layerOf(page: number) {
  await screen.findByRole('group', { name: `Page ${page} of 3` });
  return document.querySelector<HTMLElement>(
    `.mantine-DocViewer-markupLayer[data-page-number="${page}"]`
  )!;
}

/** Presses at the first point, moves through the rest and lets go */
function draw(layer: HTMLElement, points: [number, number][], options: { button?: number } = {}) {
  const [[x, y], ...rest] = points;
  fireEvent.pointerDown(layer, { clientX: x, clientY: y, button: options.button ?? 0 });
  rest.forEach(([clientX, clientY]) => fireEvent.pointerMove(layer, { clientX, clientY }));
  fireEvent.pointerUp(layer);
}

async function pickTool(name: string) {
  await userEvent.click(screen.getByRole('button', { name }));
}

describe('markup', () => {
  beforeEach(() => getDocument.mockReset());

  it('moves between the markup tools with the arrow keys, from one tab stop', async () => {
    mockPdf();
    renderViewer({ tools: ['pen', 'text'] });
    await userEvent.click(await screen.findByRole('button', { name: 'Markup' }));
    const bar = screen.getByRole('toolbar', { name: 'Markup' });
    const stops = () =>
      Array.from(bar.querySelectorAll<HTMLElement>('button')).filter((b) => b.tabIndex === 0);

    // Undo is disabled with no marks yet, and is not a tab stop of its own
    await waitFor(() => expect(stops()).toEqual([screen.getByRole('button', { name: 'Pen' })]));
    act(() => screen.getByRole('button', { name: 'Pen' }).focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Text box' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Close markup' })).toHaveFocus();
  });

  it('opens the markup bar from the toolbar and draws with the pen', async () => {
    mockPdf();
    const onMarkupChange = jest.fn();
    const onMarkupToolChange = jest.fn();
    renderViewer({ onChange: onMarkupChange, onToolChange: onMarkupToolChange });

    await userEvent.click(await screen.findByRole('button', { name: 'Markup' }));
    expect(screen.getByRole('toolbar', { name: 'Markup' })).toBeInTheDocument();
    await pickTool('Pen');
    expect(onMarkupToolChange).toHaveBeenLastCalledWith('pen');
    expect(screen.getByRole('button', { name: 'Pen' })).toHaveAttribute('aria-pressed', 'true');

    const layer = await layerOf(1);
    expect(layer).toHaveAttribute('data-tool', 'pen');
    fireEvent.pointerDown(layer, { clientX: 10, clientY: 20, button: 0 });
    fireEvent.pointerMove(layer, { clientX: 30, clientY: 40 });
    // The stroke shows while it is drawn
    expect(layer.querySelector('path')).toHaveAttribute('d', 'M10 20L30 40');
    fireEvent.pointerUp(layer);

    expect(onMarkupChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        type: 'pen',
        page: 1,
        width: 2,
        color: '#fa5252',
        strokes: [
          [
            [10, 20],
            [30, 40],
          ],
        ],
      }),
    ]);
    expect(layer.querySelectorAll('path')).toHaveLength(1);

    await pickTool('Undo');
    expect(onMarkupChange).toHaveBeenLastCalledWith([]);
    expect(layer.querySelectorAll('path')).toHaveLength(0);

    // Pressing the tool again puts it down
    await pickTool('Pen');
    expect(onMarkupToolChange).toHaveBeenLastCalledWith(null);
  });

  it('draws boxes, ellipses and clouds, and drops drags too small to see', async () => {
    mockPdf();
    const onMarkupChange = jest.fn();
    renderViewer({ onChange: onMarkupChange, color: 'blue', width: 3 });
    await userEvent.click(await screen.findByRole('button', { name: 'Markup' }));
    await pickTool('Highlight');
    const layer = await layerOf(2);

    draw(layer, [
      [100, 50],
      [20, 30],
    ]);
    // The box being dragged shows before it is let go
    fireEvent.pointerDown(layer, { clientX: 0, clientY: 0, button: 0 });
    fireEvent.pointerMove(layer, { clientX: 1, clientY: 1 });
    expect(layer.querySelectorAll('rect')).toHaveLength(2);
    fireEvent.pointerUp(layer);
    expect(layer.querySelectorAll('rect')).toHaveLength(1);

    for (const tool of ['Rectangle', 'Ellipse', 'Cloud']) {
      await pickTool(tool);
      fireEvent.pointerDown(layer, { clientX: 10, clientY: 10, button: 0 });
      fireEvent.pointerMove(layer, { clientX: 60, clientY: 60 });
      expect(layer.querySelector(`path[data-mark="${tool.toLowerCase()}"]`)).toBeInTheDocument();
      fireEvent.pointerUp(layer);
    }

    const marks = onMarkupChange.mock.lastCall[0] as DocViewerMark[];
    expect(marks.map((mark) => mark.type)).toEqual(['highlight', 'rectangle', 'ellipse', 'cloud']);
    expect(marks[0]).toMatchObject({
      page: 2,
      color: '#228be6',
      rect: { x: 20, y: 30, width: 80, height: 20 },
    });
    expect(marks[1]).toMatchObject({ width: 3, rect: { x: 10, y: 10, width: 50, height: 50 } });
    expect(layer.querySelector('path[data-mark="cloud"]')).toHaveAttribute('stroke-width', '3');
  });

  it('ignores other buttons, moves without a press and cancelled strokes', async () => {
    mockPdf();
    const onMarkupChange = jest.fn();
    renderViewer({ defaultTool: 'pen', onChange: onMarkupChange });
    const layer = await layerOf(1);

    draw(
      layer,
      [
        [0, 0],
        [5, 5],
      ],
      { button: 2 }
    );
    fireEvent.pointerMove(layer, { clientX: 9, clientY: 9 });
    fireEvent.pointerDown(layer, { clientX: 0, clientY: 0, button: 0 });
    fireEvent.pointerCancel(layer);
    fireEvent.pointerUp(layer);
    expect(onMarkupChange).not.toHaveBeenCalled();
  });

  it('types text boxes onto the page', async () => {
    mockPdf();
    const onMarkupChange = jest.fn();
    renderViewer({ tool: 'text', onChange: onMarkupChange, fontSize: 12 });
    const layer = await layerOf(1);

    // A click places a box; typing and leaving it adds the text
    fireEvent.pointerDown(layer, { clientX: 40, clientY: 50, button: 0 });
    const box = await screen.findByRole('textbox', { name: 'Text box text' });
    await userEvent.type(box, 'Check this{Enter}figure  ');
    // Pressing in the box itself does not start another one
    fireEvent.pointerDown(box, { clientX: 41, clientY: 51, button: 0 });
    fireEvent.blur(box);
    expect(onMarkupChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        type: 'text',
        x: 40,
        y: 50,
        text: 'Check this\nfigure',
        fontSize: 12,
      }),
    ]);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('commits with Mod+Enter, cancels with Escape and drops empty boxes', async () => {
    mockPdf();
    const onMarkupChange = jest.fn();
    renderViewer({ defaultTool: 'text', onChange: onMarkupChange });
    const layer = await layerOf(1);

    fireEvent.pointerDown(layer, { clientX: 1, clientY: 1, button: 0 });
    await userEvent.type(await screen.findByRole('textbox'), 'First');
    // Clicking elsewhere on the page keeps the first box and starts the next
    fireEvent.pointerDown(layer, { clientX: 100, clientY: 100, button: 0 });
    await waitFor(() => expect(onMarkupChange).toHaveBeenCalledTimes(1));
    const second = await screen.findByRole('textbox');
    await userEvent.type(second, 'Second');
    fireEvent.keyDown(second, { key: 'Enter', ctrlKey: true });
    expect(onMarkupChange).toHaveBeenCalledTimes(2);

    fireEvent.pointerDown(layer, { clientX: 5, clientY: 5, button: 0 });
    await userEvent.type(await screen.findByRole('textbox'), 'Gone');
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    fireEvent.pointerDown(layer, { clientX: 5, clientY: 5, button: 0 });
    fireEvent.blur(await screen.findByRole('textbox'));
    expect(onMarkupChange).toHaveBeenCalledTimes(2);

    const texts = document.querySelectorAll('[data-mark="text"]');
    expect([...texts].map((text) => text.textContent)).toEqual(['First', 'Second']);
    expect(texts[1]).toHaveStyle({ left: '100px', top: '100px', fontSize: '14px' });
  });

  it('joins the strokes of a signature until another tool is picked', async () => {
    mockPdf();
    const onMarkupChange = jest.fn();
    renderViewer({
      onChange: onMarkupChange,
      color: '#1d3a8a',
      defaultValue: [
        { type: 'text', id: 't', page: 2, color: '#000', x: 5, y: 5, text: 'Note', fontSize: 9 },
      ],
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Markup' }));
    await pickTool('Signature');
    const layer = await layerOf(1);

    draw(layer, [
      [0, 0],
      [5, 5],
    ]);
    draw(layer, [
      [10, 0],
      [15, 5],
    ]);
    let marks = onMarkupChange.mock.lastCall[0] as DocViewerMark[];
    expect(marks).toHaveLength(2);
    expect(marks[1]).toMatchObject({ type: 'signature', color: '#1d3a8a' });
    expect((marks[1] as { strokes: unknown[] }).strokes).toHaveLength(2);

    await pickTool('Pen');
    await pickTool('Signature');
    draw(layer, [[20, 0]]);
    marks = onMarkupChange.mock.lastCall[0] as DocViewerMark[];
    expect(marks.map((mark) => mark.type)).toEqual(['text', 'signature', 'signature']);
  });

  it('highlights in yellow and draws in red by default', async () => {
    mockPdf();
    const onMarkupChange = jest.fn();
    renderViewer({ tool: 'highlight', onChange: onMarkupChange });
    draw(await layerOf(1), [
      [0, 0],
      [50, 20],
    ]);
    expect(onMarkupChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ type: 'highlight', color: '#fab005' }),
    ]);
  });

  it('saves the marks into the PDF through onSave', async () => {
    const { saved, annotationStorage } = mockPdf();
    const onSave = jest.fn();
    renderViewer({
      onDocumentChange: onSave,
      defaultValue: [
        {
          type: 'highlight',
          id: 'h',
          page: 3,
          color: '#ffd43b',
          rect: { x: 0, y: 0, width: 10, height: 10 },
        },
        { type: 'text', id: 't', page: 1, color: '#000', x: 5, y: 5, text: 'OK', fontSize: 10 },
      ],
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Markup' }));

    // Marks given by the app show without a tool
    expect(document.querySelector('[data-mark="highlight"]')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(new Uint8Array([37, 80, 68, 70, 46]), {
        reason: 'annotate',
        pages: [1, 3],
      })
    );
    expect([...saved[0].values()]).toEqual([
      expect.objectContaining({ annotationType: 9, pageIndex: 2 }),
      expect.objectContaining({ annotationType: 3, pageIndex: 0, value: 'OK' }),
    ]);
    expect(annotationStorage.values.size).toBe(0);
    expect(await screen.findByText(/^Markup saved/)).toBeInTheDocument();
  });

  it('downloads the marked up PDF without onSave', async () => {
    URL.createObjectURL = jest.fn(() => 'blob:annotated');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mockPdf();
    const { store } = renderViewer(
      {
        defaultValue: [
          { type: 'text', id: 't', page: 1, color: '#000', x: 5, y: 5, text: 'OK', fontSize: 10 },
        ],
      },
      { fileName: 'report.pdf' }
    );
    await layerOf(1);

    await act(() => saveMarkup(store));
    expect(click).toHaveBeenCalled();
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('report-annotated.pdf');
    click.mockRestore();
  });

  it('logs a save that fails from the bar', async () => {
    const { document: pdf } = mockPdf();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    pdf.saveDocument.mockImplementationOnce(() => Promise.reject(new Error('Worker gone')));
    renderViewer({
      defaultTool: 'pen',
      onDocumentChange: jest.fn(),
      defaultValue: [
        { type: 'pen', id: 'p', page: 1, color: '#000', width: 1, strokes: [[[1, 1]]] },
      ],
    });

    // A tool picked from the start opens the bar
    await userEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(new Error('Worker gone')));
    consoleError.mockRestore();
  });

  it('does nothing when saving without marks, and closes the bar', async () => {
    mockPdf();
    const onSave = jest.fn();
    const onMarkupToolChange = jest.fn();
    const { store } = renderViewer({
      tools: ['cloud', 'text'],
      onDocumentChange: onSave,
      onToolChange: onMarkupToolChange,
    });
    await screen.findByRole('button', { name: 'Markup' });

    act(() => setMarkupTool('cloud', store));
    expect(screen.getAllByRole('button', { name: /^(Cloud|Text box|Pen)$/ })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await act(() => saveMarkup(store));
    expect(onSave).not.toHaveBeenCalled();

    // The toolbar button closes the bar and puts the tool down
    await userEvent.click(screen.getByRole('button', { name: 'Markup' }));
    expect(onMarkupToolChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('toolbar', { name: 'Markup' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Markup' }));
    await pickTool('Text box');
    await userEvent.click(screen.getByRole('button', { name: 'Close markup' }));
    expect(onMarkupToolChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('toolbar', { name: 'Markup' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Markup' })).toHaveFocus();
  });

  it('adds no layer to pages without marks while no tool is picked', async () => {
    mockPdf();
    renderViewer(
      { value: [{ type: 'pen', id: 'p', page: 2, color: '#000', width: 1, strokes: [[[1, 1]]] }] },
      { toolbarControls: { markup: false } }
    );
    await layerOf(2);

    expect(document.querySelectorAll('.mantine-DocViewer-markupLayer')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Markup' })).not.toBeInTheDocument();
  });

  it('places marks on a rotated page where the pointer is', async () => {
    mockPdf();
    const onMarkupChange = jest.fn();
    renderViewer({ tool: 'pen', onChange: onMarkupChange });
    const layer = await layerOf(1);
    await userEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    await waitFor(() => expect(layer.style.transform).toContain('rotate(90deg)'));

    draw(layer, [[100, 10]]);
    expect(onMarkupChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ strokes: [[[10, 692]]] }),
    ]);
  });
});
