import { render } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { TestDocViewer } from '../../../test-utils/viewer';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { installIntersectionObserver } from '../../../test-utils/intersection-observer';
import { createDocViewer } from '../doc-viewer.store';
import type { DocViewerExtension } from '../doc-viewer.types';

const pageRenders = jest.fn();

jest.mock('../hooks/pdf/use-near-viewport', () => {
  const actual = jest.requireActual('../hooks/pdf/use-near-viewport');
  return {
    ...actual,
    useNearViewport: (...args: unknown[]) => {
      pageRenders();
      return actual.useNearViewport(...args);
    },
  };
});

const NUM_PAGES = 200;
const NEAR_PAGES = 5;

const settle = (ms = 300) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

let io: ReturnType<typeof installIntersectionObserver>;

beforeEach(() => {
  getDocument.mockReset();
  pageRenders.mockClear();
  io = installIntersectionObserver();
});

afterEach(() => io.uninstall());

/** Mounts a long document with the first pages near the viewport, the rest far from it */
async function mountLongDocument(ui: React.ReactElement) {
  mockPdf({ numPages: NUM_PAGES });
  const view = render(ui);
  await waitFor(() =>
    expect(view.container.querySelectorAll('[data-page-number]')).toHaveLength(NUM_PAGES)
  );
  const pages = Array.from(view.container.querySelectorAll('[data-page-number]'));
  await act(async () =>
    pages.slice(0, NEAR_PAGES).forEach((page) => io.setIntersecting(page, true))
  );
  await settle(500);
  return view;
}

async function countRendersOf(change: () => void, wait = 300) {
  const before = pageRenders.mock.calls.length;
  await act(async () => change());
  await settle(wait);
  return pageRenders.mock.calls.length - before;
}

describe('PdfPage renders for a zoom step in a long document', () => {
  it('renders only the pages near the viewport with a renderPageOverlay', async () => {
    const [store, actions] = createDocViewer();
    await mountLongDocument(
      <TestDocViewer
        src="/files/report.pdf"
        defaultZoom={1}
        store={store}
        pagesProps={{ renderPageOverlay: () => null }}
      />
    );

    expect(await countRendersOf(() => actions.setZoom(1.5))).toBeLessThan(NEAR_PAGES * 3);
  });

  it('renders only the pages near the viewport with an extension page layer', async () => {
    const [store, actions] = createDocViewer();
    const extensions: DocViewerExtension[] = [
      { name: 'probe', options: {}, pageLayer: () => null },
    ];
    await mountLongDocument(
      <TestDocViewer
        src="/files/report.pdf"
        defaultZoom={1}
        store={store}
        extensions={extensions}
      />
    );

    expect(await countRendersOf(() => actions.setZoom(1.5))).toBeLessThan(NEAR_PAGES * 3);
  });

  it('gives the overlay of a far page the new scale once per zoom step', async () => {
    const [store, actions] = createDocViewer();
    const scales: number[] = [];
    await mountLongDocument(
      <TestDocViewer
        src="/files/report.pdf"
        defaultZoom={1}
        store={store}
        pagesProps={{
          renderPageOverlay: ({ page, scale }) => {
            if (page === NUM_PAGES) {
              scales.push(scale);
            }
            return null;
          },
        }}
      />
    );

    scales.length = 0;
    await act(async () => actions.setZoom(1.5));
    await settle(600);
    expect(scales).toEqual([1.5]);
  });

  it('renders no page when the app passes a new renderPageOverlay', async () => {
    const [store, actions] = createDocViewer();
    function App() {
      const [page, setPage] = useState(1);
      return (
        <>
          <output>{page}</output>
          <TestDocViewer
            src="/files/report.pdf"
            defaultZoom={1}
            store={store}
            onPageChange={setPage}
            pagesProps={{ renderPageOverlay: () => null }}
          />
        </>
      );
    }
    await mountLongDocument(<App />);

    const renders = await countRendersOf(() => {
      actions.goToPage(3);
    });
    expect(renders).toBe(0);
  });
});
