import { render, screen } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { DocViewer } from '../DocViewer';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import type { DocViewerMark } from './markup';

/**
 * Counts thumbnail and page tile renders: each names itself with its label once per render. One
 * labels object for the whole file, so the viewer gets the same functions on every render
 */
const thumbnailRenders = jest.fn((page: number) => `Thumbnail ${page}`);
const tileRenders = jest.fn((page: number, position: number) => `Page ${page} at ${position}`);
const countingLabels = { thumbnail: thumbnailRenders, editorPage: tileRenders };

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
    function App() {
      const [mark, setMark] = useState('A');
      return (
        <>
          <button type="button" onClick={() => setMark('B')}>
            Change
          </button>
          <DocViewer
            src="/files/report.pdf"
            pdfWorkerSrc="/worker.mjs"
            renderPageOverlay={({ pageNumber }) => (
              <span>
                {mark}
                {pageNumber}
              </span>
            )}
          />
        </>
      );
    }
    render(<App />);
    expect(await screen.findByText('A2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(await screen.findByText('B2')).toBeInTheDocument();
    expect(screen.queryByText('A2')).not.toBeInTheDocument();
  });

  it('does not draw the link layers again when the app passes new labels', async () => {
    const { document: pdf } = mockPdf({
      links: [{ id: 'costs', annotationType: 2, dest: 'costs' }],
    });
    const firstPage = await pdf.getPage(1);
    function App() {
      const [word, setWord] = useState('Go to');
      return (
        <>
          <button type="button" onClick={() => setWord('Page')}>
            Rename
          </button>
          <DocViewer
            src="/files/report.pdf"
            pdfWorkerSrc="/worker.mjs"
            defaultZoom={1}
            labels={{ linkToPage: (page) => `${word} ${page}` }}
          />
        </>
      );
    }
    render(<App />);
    const link = () => document.querySelector('a[data-element-id="costs"]');
    await waitFor(() => expect(link()).toHaveAttribute('aria-label', 'Go to 2'));
    await act(async () => {});
    const drawn = firstPage.getAnnotations.mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await act(async () => {});
    expect(firstPage.getAnnotations.mock.calls.length).toBe(drawn);
  });
});

/** Page numbers of the renders since `from`, from a mock called once per page render */
function rendersSince(mock: jest.Mock, from: number) {
  return mock.mock.calls
    .slice(from)
    .map(([info]) => (typeof info === 'number' ? info : (info.pageNumber as number)))
    .sort((a, b) => a - b);
}

describe('page renders on a page turn and a new mark', () => {
  it('renders no page again when the app turns a controlled page', async () => {
    mockPdf({ numPages: NUM_PAGES });
    const renderPageOverlay = countPageRenders();
    function App() {
      const [page, setPage] = useState(1);
      return (
        <>
          <button type="button" onClick={() => setPage(page + 2)}>
            Turn
          </button>
          <DocViewer
            src="/files/report.pdf"
            pdfWorkerSrc="/worker.mjs"
            defaultZoom={1}
            page={page}
            onPageChange={setPage}
            renderPageOverlay={renderPageOverlay}
          />
        </>
      );
    }
    const { container } = render(<App />);
    await allTextLayersRendered(container);
    await act(async () => {});

    const before = renderPageOverlay.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Turn' }));
    await userEvent.click(screen.getByRole('button', { name: 'Turn' }));
    await act(async () => {});
    expect(rendersSince(renderPageOverlay, before)).toEqual([]);
  });

  it('renders only the page a new mark is on', async () => {
    mockPdf({ numPages: NUM_PAGES });
    const renderPageOverlay = countPageRenders();
    function App() {
      const [marks, setMarks] = useState<DocViewerMark[]>([]);
      const add = () =>
        setMarks([
          ...marks,
          {
            type: 'highlight',
            id: `mark-${marks.length}`,
            page: 2,
            color: 'yellow',
            rect: { x: 10, y: 10, width: 50, height: 20 },
          },
        ]);
      return (
        <>
          <button type="button" onClick={add}>
            Mark
          </button>
          <DocViewer
            src="/files/report.pdf"
            pdfWorkerSrc="/worker.mjs"
            defaultZoom={1}
            markup={marks}
            onMarkupChange={setMarks}
            renderPageOverlay={renderPageOverlay}
          />
        </>
      );
    }
    const { container } = render(<App />);
    await allTextLayersRendered(container);
    await act(async () => {});

    const before = renderPageOverlay.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Mark' }));
    await userEvent.click(screen.getByRole('button', { name: 'Mark' }));
    await act(async () => {});
    expect(rendersSince(renderPageOverlay, before)).toEqual([2, 2]);
    expect(container.querySelectorAll('rect[data-mark="highlight"]')).toHaveLength(2);
  });
});

describe('thumbnail and page tile renders', () => {
  it('renders only the thumbnails whose page became or stopped being current', async () => {
    mockPdf({ numPages: NUM_PAGES });
    function App() {
      const [page, setPage] = useState(1);
      return (
        <>
          <button type="button" onClick={() => setPage(3)}>
            Turn
          </button>
          <DocViewer
            src="/files/report.pdf"
            pdfWorkerSrc="/worker.mjs"
            defaultZoom={1}
            defaultThumbnailsOpened
            withPageEditing
            page={page}
            onPageChange={setPage}
            labels={countingLabels}
          />
        </>
      );
    }
    const { container } = render(<App />);
    await allTextLayersRendered(container);
    await act(async () => {});

    const before = thumbnailRenders.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Turn' }));
    await act(async () => {});
    expect(rendersSince(thumbnailRenders, before)).toEqual([1, 3]);
  });

  it('renders only the page tiles whose focus moved in the page editor', async () => {
    mockPdf({ numPages: NUM_PAGES });
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultZoom={1}
        withPageEditing
        labels={countingLabels}
      />
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
    const first = await screen.findByRole('option', { name: 'Page 1 at 1' });
    await act(async () => {});
    act(() => first.focus());

    const before = tileRenders.mock.calls.length;
    await userEvent.keyboard('{ArrowRight}');
    await act(async () => {});
    expect(rendersSince(tileRenders, before)).toEqual([1, 2]);
  });
});
