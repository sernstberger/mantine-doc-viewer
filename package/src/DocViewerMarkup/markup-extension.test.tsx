import { useState } from 'react';
import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { createDocViewer } from '../doc-viewer.store';
import { DEFAULT_LABELS, mergeMarkupLabels } from './default-labels';
import { DocViewerMarkupBar } from './DocViewerMarkupBar/DocViewerMarkupBar';
import { DocViewerMarkupButton } from './DocViewerMarkupButton/DocViewerMarkupButton';
import { MarkupPageLayer } from './DocViewerMarkupLayer/MarkupPageLayer';
import { setMarkupTool } from './markup-actions';
import { createMarkupExtension } from './markup-extension';
import { MarkupSetup } from './markup-setup';
import { MarkupViewer } from './test-utils';
import type { DocViewerMark } from './utils/markup';

beforeEach(() => getDocument.mockReset());

describe('createMarkupExtension', () => {
  it('plugs the setup, the toolbar button, the bar and the page layer into the slots', () => {
    const options = { color: 'blue' };
    expect(createMarkupExtension(options)).toEqual({
      name: 'markup',
      options,
      setup: MarkupSetup,
      toolbarControls: [{ control: 'markup', after: 'search', Component: DocViewerMarkupButton }],
      bar: DocViewerMarkupBar,
      pageLayer: MarkupPageLayer,
    });
    expect(createMarkupExtension().options).toEqual({});
  });

  it('writes the tool in use into the store', async () => {
    mockPdf();
    const [store] = createDocViewer();
    render(<MarkupViewer store={store} />);
    await screen.findByRole('button', { name: 'Markup' });
    expect(store.getState().markupTool).toBeNull();

    act(() => setMarkupTool('highlight', store));
    expect(store.getState().markupTool).toBe('highlight');
    act(() => setMarkupTool(null, store));
    expect(store.getState().markupTool).toBeNull();
  });

  it('renders no page again for a new options object with equal options', async () => {
    mockPdf();
    const renderPageOverlay = jest.fn(() => null);
    const marks: DocViewerMark[] = [
      { type: 'pen', id: 'p', page: 1, color: '#000', width: 1, strokes: [[[1, 1]]] },
    ];

    function App() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setCount(count + 1)}>
            Render {count}
          </button>
          <MarkupViewer
            pagesProps={{ renderPageOverlay }}
            markup={{
              tool: 'pen',
              value: marks,
              onChange: () => {},
              labels: { markupLabel: 'Markup', markupToolLabels: { pen: 'Pen' } },
            }}
          />
        </>
      );
    }

    render(<App />);
    await screen.findByRole('application', { name: 'Pen on page 1' });
    await act(async () => {});

    const pages = renderPageOverlay.mock.calls.length;
    const layer = screen.getByRole('application', { name: 'Pen on page 1' });
    await userEvent.click(screen.getByRole('button', { name: 'Render 0' }));
    await userEvent.click(screen.getByRole('button', { name: 'Render 1' }));
    await act(async () => {});
    expect(renderPageOverlay.mock.calls.length).toBe(pages);
    expect(screen.getByRole('application', { name: 'Pen on page 1' })).toBe(layer);
  });
});

describe('mergeMarkupLabels', () => {
  it('lays the overrides over the defaults, the tool names one level deep', () => {
    const labels = mergeMarkupLabels({ undoMarkLabel: 'Back', markupToolLabels: { pen: 'Ink' } });
    expect(labels.undoMarkLabel).toBe('Back');
    expect(labels.markupToolLabels).toEqual({ ...DEFAULT_LABELS.markupToolLabels, pen: 'Ink' });
    expect(mergeMarkupLabels(undefined)).toEqual(DEFAULT_LABELS);
  });
});
