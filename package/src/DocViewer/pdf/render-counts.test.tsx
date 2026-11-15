import { render, screen } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { DocViewer } from '../DocViewer';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';

/**
 * renderPageOverlay is called once each time a PdfPage renders, so it counts page renders.
 * A long document has a PdfPage per page: work that is not about a page must not render it
 */
const NUM_PAGES = 12;

function countPageRenders() {
  return jest.fn((_info: { pageNumber: number }) => null);
}

async function allTextLayersRendered(container: HTMLElement) {
  await waitFor(() => expect(container.querySelectorAll('.endOfContent')).toHaveLength(NUM_PAGES));
}

beforeEach(() => getDocument.mockReset());

describe('page renders', () => {
  it('does not render every page again when a text layer renders', async () => {
    const { document } = mockPdf({ numPages: NUM_PAGES });
    // Text layers finish one after another, as they do in a browser
    const getPage = document.getPage.getMockImplementation()!;
    document.getPage.mockImplementation((pageNumber: number) =>
      getPage(pageNumber).then((page: any) => ({
        ...page,
        getTextContent: () =>
          new Promise((resolve) => setTimeout(resolve, pageNumber * 5)).then(() =>
            page.getTextContent()
          ),
      }))
    );
    const renderPageOverlay = countPageRenders();
    const { container } = render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultZoom={1}
        renderPageOverlay={renderPageOverlay}
      />
    );
    await allTextLayersRendered(container);
    await act(async () => {});

    // Each page renders a few times while it loads (size known, drawn); a page list rendered
    // again for each text layer would be NUM_PAGES times that
    const perPage = renderPageOverlay.mock.calls.length / NUM_PAGES;
    expect(perPage).toBeLessThan(5);
  });

  it('does not render the pages when the app renders with the same props', async () => {
    mockPdf({ numPages: NUM_PAGES });
    const renderPageOverlay = countPageRenders();
    function App() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setCount(count + 1)}>
            Render {count}
          </button>
          <DocViewer
            src="/files/report.pdf"
            pdfWorkerSrc="/worker.mjs"
            defaultZoom={1}
            renderPageOverlay={renderPageOverlay}
            // Written inline, so a new object on every render of the app
            labels={{ search: 'Find' }}
            pdfOptions={undefined}
          />
        </>
      );
    }
    const { container } = render(<App />);
    await allTextLayersRendered(container);
    await act(async () => {});

    const before = renderPageOverlay.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Render 0' }));
    await userEvent.click(screen.getByRole('button', { name: 'Render 1' }));
    await act(async () => {});
    expect(renderPageOverlay.mock.calls.length).toBe(before);
  });

  it('renders the pages again when the app changes a prop they show', async () => {
    mockPdf({ numPages: 2 });
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        renderPageOverlay={({ pageNumber }) => <span>A{pageNumber}</span>}
      />
    ).rerender(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        renderPageOverlay={({ pageNumber }) => <span>B{pageNumber}</span>}
      />
    );
    expect(await screen.findByText('B2')).toBeInTheDocument();
    expect(screen.queryByText('A2')).not.toBeInTheDocument();
  });
});
