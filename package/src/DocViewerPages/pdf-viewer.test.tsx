import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestDocViewer } from '../../../test-utils/viewer';
import { createDocViewer } from '../doc-viewer.store';
import { openPageEditor } from '../DocViewerPageEditor/page-editor-actions';
import { createPageEditorExtension } from '../DocViewerPageEditor/page-editor-extension';

import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import * as pdfjs from '../../../test-utils/pdfjs-dist.mock';

const PAGES = /^Page \d of 3$/;

/** Changes the fake document once pdf.js has opened it, before the viewer reads from it */
function patchDocument(patch: (document: any) => void) {
  const open = getDocument.getMockImplementation()!;
  getDocument.mockImplementation((...args: unknown[]) => {
    const task = open(...args);
    const opened = task.promise as Promise<unknown>;
    task.promise = opened.then((document) => {
      patch(document);
      return document;
    });
    return task;
  });
}

const wait = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  getDocument.mockReset();
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

describe('actions', () => {
  it('does nothing for a document that is not ready', async () => {
    mockPdf({ fail: true });
    const [store, api] = createDocViewer();
    render(
      <TestDocViewer
        src="/files/broken.pdf"
        store={store}
        extensions={[createPageEditorExtension()]}
      />
    );
    await screen.findByText('This PDF could not be opened');

    await act(async () => {
      api.goToPage(2);
      api.highlight({ text: 'quarter' });
      api.clearHighlight();
      api.setZoom(2);
      api.zoomIn();
      api.zoomOut();
      api.setPageLayout('two-page');
      api.rotate();
      api.openSearch('quarter');
      api.closeSearch();
      openPageEditor(store);
      api.togglePresentation();
      await api.print();
      expect(await api.getOutline()).toEqual([]);
    });

    expect(screen.queryByRole('textbox', { name: 'Search document' })).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox', { name: 'Pages' })).not.toBeInTheDocument();
  });

  it('zooms, lays out, searches, toggles thumbnails and presents through the actions', async () => {
    mockPdf();
    const [store, api] = createDocViewer();
    const { container } = render(
      <TestDocViewer src="/files/report.pdf" store={store} defaultZoom={1} />
    );
    await screen.findAllByRole('group', { name: PAGES });
    const zoomLevel = () => screen.getByRole('button', { name: /^Zoom \d/ }).textContent;

    await act(async () => api.zoomIn());
    expect(zoomLevel()).toBe('125%');
    await act(async () => api.zoomOut());
    await act(async () => api.zoomOut());
    expect(zoomLevel()).toBe('75%');

    await act(async () => api.setPageLayout('two-page'));
    expect(container.querySelector('.mantine-DocViewer-pages')).toHaveAttribute(
      'data-layout',
      'two-page'
    );

    // Closing search that is not open does nothing
    await act(async () => api.closeSearch());
    await act(async () => api.openSearch('quarter'));
    expect(await screen.findByRole('textbox', { name: 'Search document' })).toHaveValue('quarter');
    await act(async () => api.closeSearch());
    expect(screen.queryByRole('textbox', { name: 'Search document' })).not.toBeInTheDocument();

    const thumbnails = screen.getByRole('button', { name: 'Page thumbnails' });
    expect(thumbnails).toHaveAttribute('aria-pressed', 'false');
    await act(async () => api.toggleThumbnails());
    expect(thumbnails).toHaveAttribute('aria-pressed', 'true');
    await act(async () => api.toggleThumbnails(true));
    expect(thumbnails).toHaveAttribute('aria-pressed', 'true');
    await act(async () => api.toggleThumbnails());
    expect(thumbnails).toHaveAttribute('aria-pressed', 'false');

    // Page editing is off without the page editor extension
    await act(async () => openPageEditor(store));
    expect(screen.queryByRole('listbox', { name: 'Pages' })).not.toBeInTheDocument();

    await act(async () => api.togglePresentation());
    expect(screen.getAllByRole('group', { name: PAGES })).toHaveLength(1);
    await act(async () => api.togglePresentation());
    expect(screen.getAllByRole('group', { name: PAGES })).toHaveLength(3);
  });

  it('gives an empty outline when the outline cannot be read', async () => {
    mockPdf();
    patchDocument((document) => {
      document.getOutline = jest.fn(() => Promise.reject(new Error('bad outline')));
    });
    const [store, api] = createDocViewer();
    render(<TestDocViewer src="/files/report.pdf" store={store} />);
    await screen.findAllByRole('group', { name: PAGES });

    expect(await api.getOutline()).toEqual([]);
  });
});

describe('navigation', () => {
  it('goes to the previous page and follows named link actions', async () => {
    mockPdf({ links: [{ id: 'next', annotationType: 2, action: 'NextPage' }] });
    render(<TestDocViewer src="/files/report.pdf" />);

    await screen.findAllByRole('group', { name: PAGES });
    await waitFor(() => expect(document.querySelector('a[data-element-id="next"]')).not.toBeNull());
    await userEvent.click(document.querySelector('a[data-element-id="next"]')!);
    await waitFor(() => expect(screen.getByText('2 / 3')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('resizes the link layer when zooming instead of drawing it again', async () => {
    const update = jest.spyOn(pdfjs.AnnotationLayer.prototype as any, 'update');
    mockPdf({ links: [{ id: 'next', annotationType: 2, action: 'NextPage' }] });
    render(<TestDocViewer src="/files/report.pdf" defaultZoom={1} />);
    await waitFor(() => expect(document.querySelector('a[data-element-id="next"]')).not.toBeNull());
    const link = document.querySelector('a[data-element-id="next"]');

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(document.querySelector('a[data-element-id="next"]')).toBe(link);
    update.mockRestore();
  });

  it('opens and closes search from its button, and ignores a wheel without Ctrl', async () => {
    mockPdf();
    render(<TestDocViewer src="/files/report.pdf" defaultZoom={1} />);
    const region = await screen.findByRole('region', { name: 'report.pdf' });

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('textbox', { name: 'Search document' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.queryByRole('textbox', { name: 'Search document' })).not.toBeInTheDocument();

    fireEvent.wheel(region, { deltaY: -100 });
    expect(screen.getByRole('button', { name: /^Zoom \d/ })).toHaveTextContent('100%');
  });

  it('stays on the page a presentation ended on while the layout settles', async () => {
    mockPdf();
    render(<TestDocViewer src="/files/report.pdf" />);
    await screen.findAllByRole('group', { name: PAGES });

    await userEvent.click(screen.getByRole('button', { name: 'Presentation' }));
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{Escape}');
    expect(screen.getAllByRole('group', { name: PAGES })).toHaveLength(3);

    // Past the settle time, and past the frames that scroll back to the page
    await wait(750);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });
});

describe('outline', () => {
  it('shows nested items, styled and linked, and ignores destinations that fail', async () => {
    mockPdf({
      outline: [
        {
          title: 'Costs',
          dest: 'costs',
          url: null,
          bold: true,
          italic: true,
          items: [
            { title: 'Nested costs', dest: 'costs', url: null, items: [] },
            { title: 'Mantine', dest: null, url: 'https://mantine.dev', items: [] },
          ],
        },
        { title: 'Broken', dest: 'broken', url: null, items: [] },
      ],
    });
    patchDocument((document) => {
      const resolve = document.getDestination;
      document.getDestination = jest.fn((name: string) =>
        name === 'broken' ? Promise.reject(new Error('bad destination')) : resolve(name)
      );
    });
    render(<TestDocViewer src="/files/report.pdf" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Outline' }));
    const outline = await screen.findByRole('navigation', { name: 'Outline' });
    expect(
      within(outline).getByRole('link', { name: 'Mantine (opens in new tab)' })
    ).toHaveAttribute('href', 'https://mantine.dev');

    await userEvent.click(within(outline).getByRole('button', { name: 'Broken' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    await userEvent.click(within(outline).getByRole('button', { name: 'Nested costs' }));
    await waitFor(() => expect(screen.getByText('2 / 3')).toBeInTheDocument());
  });
});

describe('document info', () => {
  it('lists an attachment that has no description', async () => {
    URL.createObjectURL = jest.fn(() => 'blob:attachment');
    URL.revokeObjectURL = jest.fn();
    mockPdf({ attachments: new Map([['a.txt', { filename: 'a.txt', description: '' }]]) });
    render(<TestDocViewer src="/files/report.pdf" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Document info' }));
    const attachment = await screen.findByRole('button', { name: 'Download attachment a.txt' });
    expect(attachment).not.toHaveAttribute('title');
  });
});
