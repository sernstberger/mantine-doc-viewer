import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';
import type { DocViewerController } from '../controller';
import { DocViewer } from '../DocViewer';

import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';

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

describe('controller', () => {
  it('does nothing for a document that is not ready', async () => {
    mockPdf({ fail: true });
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer
        src="/files/broken.pdf"
        pdfWorkerSrc="/worker.mjs"
        controllerRef={controller}
        withPageEditing
      />
    );
    await screen.findByText('This PDF could not be opened');

    await act(async () => {
      const api = controller.current!;
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
      api.editPages();
      api.togglePresentation();
      await api.print();
      expect(await api.getOutline()).toEqual([]);
    });

    expect(screen.queryByRole('textbox', { name: 'Search document' })).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox', { name: 'Pages' })).not.toBeInTheDocument();
  });

  it('zooms, lays out, searches, toggles thumbnails and presents through controllerRef', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    const { container } = render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        controllerRef={controller}
        defaultZoom={1}
      />
    );
    await screen.findAllByRole('group', { name: PAGES });
    const zoomLevel = () => screen.getByRole('button', { name: /Reset zoom/ }).textContent;

    act(() => controller.current!.zoomIn());
    expect(zoomLevel()).toBe('125%');
    act(() => controller.current!.zoomOut());
    act(() => controller.current!.zoomOut());
    expect(zoomLevel()).toBe('75%');

    act(() => controller.current!.setPageLayout('two-page'));
    expect(container.querySelector('.mantine-DocViewer-pages')).toHaveAttribute(
      'data-layout',
      'two-page'
    );

    // Closing search that is not open does nothing
    act(() => controller.current!.closeSearch());
    act(() => controller.current!.openSearch('quarter'));
    expect(await screen.findByRole('textbox', { name: 'Search document' })).toHaveValue('quarter');
    act(() => controller.current!.closeSearch());
    expect(screen.queryByRole('textbox', { name: 'Search document' })).not.toBeInTheDocument();

    const thumbnails = screen.getByRole('button', { name: 'Page thumbnails' });
    expect(thumbnails).toHaveAttribute('aria-pressed', 'false');
    act(() => controller.current!.toggleThumbnails());
    expect(thumbnails).toHaveAttribute('aria-pressed', 'true');
    act(() => controller.current!.toggleThumbnails(true));
    expect(thumbnails).toHaveAttribute('aria-pressed', 'true');
    act(() => controller.current!.toggleThumbnails());
    expect(thumbnails).toHaveAttribute('aria-pressed', 'false');

    // Page editing is off without withPageEditing
    act(() => controller.current!.editPages());
    expect(screen.queryByRole('listbox', { name: 'Pages' })).not.toBeInTheDocument();

    act(() => controller.current!.togglePresentation());
    expect(screen.getAllByRole('group', { name: PAGES })).toHaveLength(1);
    act(() => controller.current!.togglePresentation());
    expect(screen.getAllByRole('group', { name: PAGES })).toHaveLength(3);
  });

  it('gives an empty outline when the outline cannot be read', async () => {
    mockPdf();
    patchDocument((document) => {
      document.getOutline = jest.fn(() => Promise.reject(new Error('bad outline')));
    });
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
    );
    await screen.findAllByRole('group', { name: PAGES });

    expect(await controller.current!.getOutline()).toEqual([]);
  });

  it('opens the page editor through controllerRef', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        controllerRef={controller}
        withPageEditing
      />
    );
    await screen.findAllByRole('group', { name: PAGES });

    act(() => controller.current!.editPages());
    expect(screen.getByRole('listbox', { name: 'Pages' })).toBeInTheDocument();
  });
});

describe('navigation', () => {
  it('goes to the previous page and follows named link actions', async () => {
    mockPdf({ links: [{ id: 'next', annotationType: 2, action: 'NextPage' }] });
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
    );

    await screen.findAllByRole('group', { name: PAGES });
    await waitFor(() => expect(document.querySelector('a[data-element-id="next"]')).not.toBeNull());
    await userEvent.click(document.querySelector('a[data-element-id="next"]')!);
    await waitFor(() => expect(screen.getByText('2 / 3')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('opens and closes search from its button, and ignores a wheel without Ctrl', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" defaultZoom={1} />);
    const region = await screen.findByRole('region', { name: 'report.pdf' });

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('textbox', { name: 'Search document' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.queryByRole('textbox', { name: 'Search document' })).not.toBeInTheDocument();

    fireEvent.wheel(region, { deltaY: -100 });
    expect(screen.getByRole('button', { name: /Reset zoom/ })).toHaveTextContent('100%');
  });

  it('stays on the page a presentation ended on while the layout settles', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);
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
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Outline' }));
    const outline = await screen.findByRole('navigation', { name: 'Outline' });
    expect(within(outline).getByRole('link', { name: 'Mantine' })).toHaveAttribute(
      'href',
      'https://mantine.dev'
    );

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
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Document info' }));
    const attachment = await screen.findByRole('button', { name: 'Download attachment a.txt' });
    expect(attachment).not.toHaveAttribute('title');
  });
});

describe('page editor', () => {
  const openEditor = async (props: Partial<React.ComponentProps<typeof DocViewer>> = {}) => {
    mockPdf();
    const onSave = jest.fn();
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        withPageEditing
        onSave={onSave}
        {...props}
      />
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
    const listbox = screen.getByRole('listbox', { name: 'Pages' });
    const order = () =>
      within(listbox)
        .getAllByRole('option')
        .map((option) => option.getAttribute('data-page'));
    const option = (page: number) =>
      within(listbox).getByRole('option', { name: new RegExp(`^Page ${page},`) });
    const stop = () =>
      within(listbox)
        .getAllByRole('option')
        .find((tile) => tile.getAttribute('tabindex') === '0')
        ?.getAttribute('data-page');
    return { onSave, listbox, order, option, stop };
  };

  it('moves the focus with the arrow keys, Home and End', async () => {
    const { listbox, stop } = await openEditor();
    expect(stop()).toBe('1');

    fireEvent.keyDown(listbox, { key: 'ArrowRight' });
    expect(stop()).toBe('2');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(stop()).toBe('3');
    fireEvent.keyDown(listbox, { key: 'ArrowLeft' });
    expect(stop()).toBe('2');
    fireEvent.keyDown(listbox, { key: 'ArrowUp' });
    expect(stop()).toBe('1');
    // Stops at the first page
    fireEvent.keyDown(listbox, { key: 'ArrowLeft' });
    expect(stop()).toBe('1');

    fireEvent.keyDown(listbox, { key: 'End' });
    expect(stop()).toBe('3');
    fireEvent.keyDown(listbox, { key: 'Home' });
    expect(stop()).toBe('1');
    fireEvent.keyDown(listbox, { key: 'x' });
  });

  it('selects and deselects with Space, clicks and modifier clicks', async () => {
    const { listbox, option } = await openEditor();
    const selected = (page: number) => option(page).getAttribute('aria-selected');

    fireEvent.keyDown(listbox, { key: ' ' });
    expect(selected(1)).toBe('true');
    fireEvent.keyDown(listbox, { key: ' ' });
    expect(selected(1)).toBe('false');

    await userEvent.click(option(2));
    expect(selected(2)).toBe('true');
    // Clicking the only selected page again deselects it
    await userEvent.click(option(2));
    expect(selected(2)).toBe('false');

    await userEvent.click(option(1));
    await userEvent.click(option(3));
    expect([selected(1), selected(3)]).toEqual(['false', 'true']);

    fireEvent.click(option(1), { shiftKey: true });
    fireEvent.click(option(2), { ctrlKey: true });
    fireEvent.click(option(3), { metaKey: true });
    expect([selected(1), selected(2), selected(3)]).toEqual(['true', 'true', 'false']);

    fireEvent.keyDown(listbox, { key: 'a', ctrlKey: true });
    expect([selected(1), selected(2), selected(3)]).toEqual(['true', 'true', 'true']);
  });

  it('finishes without a new document when nothing changed', async () => {
    const { onSave } = await openEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(await screen.findAllByRole('group', { name: PAGES })).toHaveLength(3);
    expect(getDocument).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('opens the edited document when done', async () => {
    const { order, option } = await openEditor();
    await userEvent.click(option(3));
    await userEvent.click(screen.getByRole('button', { name: 'Move earlier' }));
    expect(order()).toEqual(['1', '3', '2']);

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(getDocument).toHaveBeenCalledTimes(2));
    expect(getDocument.mock.calls[1][0]).toMatchObject({ data: expect.any(Uint8Array) });
    expect(await screen.findAllByRole('group', { name: PAGES })).toHaveLength(3);
  });

  it('downloads the extracted pages when there is no onSave', async () => {
    URL.createObjectURL = jest.fn(() => 'blob:pages');
    URL.revokeObjectURL = jest.fn();
    const { option } = await openEditor({ onSave: undefined });
    await userEvent.click(option(2));
    await userEvent.click(screen.getByRole('button', { name: 'Extract selected' }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
  });

  it('removes the focused page with Backspace', async () => {
    const { listbox, order } = await openEditor();
    fireEvent.keyDown(listbox, { key: 'Backspace' });
    expect(order()).toEqual(['2', '3']);
  });
});
