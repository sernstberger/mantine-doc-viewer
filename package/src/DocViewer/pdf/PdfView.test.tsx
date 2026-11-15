import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as pdfjs from 'pdfjs-dist';
import React, { createRef } from 'react';
import type { DocViewerController } from '../controller';
import { DocViewer } from '../DocViewer';

// `pdfjs-dist` resolves to test-utils/pdfjs-dist.mock.ts, see jest.config.cjs
const getDocument = pdfjs.getDocument as unknown as jest.Mock;

const PAGE_TEXT = [
  [
    { str: 'Quarterly report', hasEOL: true },
    { str: 'Revenue grew this quarter.', hasEOL: true },
  ],
  [{ str: 'Costs fell', hasEOL: true }],
  [{ str: 'Next quarter outlook', hasEOL: true }],
];

function mockPdf({
  numPages = 3,
  fail = false,
  unreadablePage = 0,
  outline = null as unknown[] | null,
  password = '',
} = {}) {
  // One render mock shared by all pages, so tests can count renders across the document
  const page = {
    render: jest.fn(() => ({ promise: Promise.resolve(), cancel: jest.fn() })),
    cleanup: jest.fn(() => true),
  };
  const pages = Array.from({ length: numPages }, (_, index) => ({
    getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }),
    render: page.render,
    cleanup: page.cleanup,
    getTextContent: jest.fn(() =>
      index + 1 === unreadablePage
        ? Promise.reject(new Error('Corrupt content stream'))
        : Promise.resolve({ items: PAGE_TEXT[index] ?? [], styles: {} })
    ),
  }));
  const document = {
    numPages,
    getPage: jest.fn((pageNumber: number) => Promise.resolve(pages[pageNumber - 1])),
    getOutline: jest.fn(() => Promise.resolve(outline)),
    getDestination: jest.fn((name: string) =>
      Promise.resolve(name === 'costs' ? [{ num: 7 }] : null)
    ),
    getPageIndex: jest.fn(() => Promise.resolve(1)),
    getData: jest.fn(() => Promise.resolve(new Uint8Array([37, 80, 68, 70]))),
  };
  getDocument.mockImplementation(() => {
    const task: {
      promise?: Promise<unknown>;
      destroy: jest.Mock;
      onPassword?: (update: (value: string) => void, reason: number) => void;
    } = { destroy: jest.fn(() => Promise.resolve()) };

    // Like pdf.js: asks for the password through onPassword until the right one is given
    task.promise = fail
      ? Promise.reject(new Error('Invalid PDF structure'))
      : !password
        ? Promise.resolve(document)
        : new Promise((resolve) => {
            const ask = (reason: number) =>
              task.onPassword?.(
                (value) => (value === password ? resolve(document) : ask(2)),
                reason
              );
            setTimeout(() => ask(1));
          });

    return task;
  });

  return { page };
}

describe('DocViewer PDF', () => {
  beforeEach(() => {
    getDocument.mockReset();
    pdfjs.GlobalWorkerOptions.workerSrc = '';
  });

  it('loads the document from src and renders every page', async () => {
    const { page } = mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/pdf.worker.min.mjs" />);

    expect(screen.getByText('Loading document')).toBeInTheDocument();
    expect(await screen.findAllByRole('group', { name: /^Page \d of 3$/ })).toHaveLength(3);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/pdf.worker.min.mjs');
    expect(getDocument).toHaveBeenCalledWith({
      url: '/files/report.pdf',
      disableAutoFetch: true,
      disableStream: true,
    });
    expect(page.render).toHaveBeenCalledTimes(3);
  });

  it('disables previous page on the first page', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    expect(await screen.findByRole('button', { name: 'Previous page' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('zooms in and out in steps and returns to fit width', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    // jsdom has no layout, so fit width falls back to 100%
    expect(await screen.findByText('100%')).toBeInTheDocument();
    const fitWidth = screen.getByRole('button', { name: 'Fit to width' });
    expect(fitWidth).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('125%')).toBeInTheDocument();
    expect(fitWidth).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('group', { name: 'Page 1 of 3' })).toHaveStyle({ width: '765px' });

    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(screen.getByText('75%')).toBeInTheDocument();

    await userEvent.click(fitWidth);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(fitWidth).toHaveAttribute('aria-pressed', 'true');
  });

  it('explains how to fix a missing worker', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockPdf();
    render(<DocViewer src="/files/report.pdf" />);

    expect(
      await screen.findByText('PDF preview is not configured: set the pdfWorkerSrc prop')
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('pdfWorkerSrc'));
    expect(getDocument).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('offers a download when the PDF cannot be opened', async () => {
    mockPdf({ fail: true });
    render(<DocViewer src="/files/broken.pdf" pdfWorkerSrc="/worker.mjs" />);

    expect(await screen.findByText('This PDF could not be opened')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
      'href',
      '/files/broken.pdf'
    );
  });

  it('renders selectable text over each page', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    const page1 = await screen.findByRole('group', { name: 'Page 1 of 3' });
    expect(await within(page1).findByText('Quarterly report')).toBeInTheDocument();
    expect(within(page1).getByText('Revenue grew this quarter.')).toBeInTheDocument();
  });

  it('searches every page and steps through matches', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Search' }));
    const input = screen.getByRole('textbox', { name: 'Search document' });
    await userEvent.type(input, 'QUARTER');

    expect(await screen.findByText('1 of 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next match' }));
    expect(screen.getByText('2 of 3')).toBeInTheDocument();

    await userEvent.type(input, '{Enter}');
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
    await userEvent.type(input, '{Enter}');
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    await userEvent.type(input, '{Shift>}{Enter}{/Shift}');
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
  });

  it('reports when nothing matches', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Search' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search document' }), 'invoice');

    expect(await screen.findAllByText('No matches')).toHaveLength(2);
    expect(screen.getAllByRole('status').some((node) => node.textContent === 'No matches')).toBe(
      true
    );
    expect(screen.getByRole('button', { name: 'Next match' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('opens search with Ctrl+F and closes it with Escape', async () => {
    mockPdf();
    const { container } = render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

    fireEvent.keyDown(container.querySelector('[tabindex="0"]')!, { key: 'f', ctrlKey: true });
    const input = screen.getByRole('textbox', { name: 'Search document' });

    await userEvent.type(input, 'costs{Escape}');
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('shows page thumbnails and jumps to the page that is clicked', async () => {
    const { page } = mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    const toggle = await screen.findByRole('button', { name: 'Page thumbnails' });
    expect(screen.queryByRole('listbox', { name: 'Pages' })).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const thumbnails = within(screen.getByRole('listbox', { name: 'Pages' })).getAllByRole(
      'option'
    );
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]).toHaveAttribute('aria-selected', 'true');

    // 3 pages and 3 thumbnails
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(page.render).toHaveBeenCalledTimes(6);

    await userEvent.click(screen.getByRole('option', { name: 'Page 3' }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Page 3' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(toggle);
    expect(screen.queryByRole('listbox', { name: 'Pages' })).not.toBeInTheDocument();
  });

  it('opens thumbnails by default with defaultThumbnailsOpened', async () => {
    mockPdf();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" defaultThumbnailsOpened />
    );

    expect(await screen.findByRole('listbox', { name: 'Pages' })).toBeInTheDocument();
  });

  describe('accessibility', () => {
    it('reads each page from its text, not as an image', async () => {
      mockPdf();
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      const page1 = await screen.findByRole('group', { name: 'Page 1 of 3' });
      expect(await within(page1).findByText('Quarterly report')).toBeInTheDocument();
      expect(page1.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('names the focusable scroll area after the file', async () => {
      mockPdf();
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      const region = await screen.findByRole('region', { name: 'report.pdf' });
      expect(region).toHaveAttribute('tabindex', '0');
      expect(region).toHaveAttribute('aria-keyshortcuts', 'Control+F Meta+F');
    });

    it('announces the page after the page buttons, not while scrolling', async () => {
      mockPdf();
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      const status = screen
        .getAllByRole('status')
        .find((node) => node.textContent === '' && !node.querySelector('*'))!;
      expect(screen.getByText('1 / 3')).not.toHaveAttribute('aria-live');

      await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(status).toHaveTextContent('Page 2 of 3');
    });

    it('announces errors as alerts', async () => {
      mockPdf({ fail: true });
      render(<DocViewer src="/files/broken.pdf" pdfWorkerSrc="/worker.mjs" />);
      expect(await screen.findByRole('alert')).toHaveTextContent('This PDF could not be opened');
    });

    it('uses translated labels', async () => {
      mockPdf();
      render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          labels={{
            nextPage: 'Nächste Seite',
            pageOf: (page, total) => `Seite ${page} von ${total}`,
          }}
        />
      );

      expect(await screen.findByRole('group', { name: 'Seite 1 von 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Nächste Seite' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    });

    it('has no axe violations', async () => {
      mockPdf();
      const { container } = render(
        <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" defaultThumbnailsOpened />
      );
      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      expect((await axe(container)).violations).toEqual([]);
    });
  });

  describe('thumbnails position', () => {
    it('lays out thumbnails on the side set by defaultThumbnailsPosition', async () => {
      mockPdf();
      const { container } = render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          defaultThumbnailsOpened
          defaultThumbnailsPosition="bottom"
        />
      );

      const nav = await screen.findByRole('listbox', { name: 'Pages' });
      expect(nav).toHaveAttribute('data-orientation', 'horizontal');
      // After the pages in the DOM, so focus order follows the layout
      const region = screen.getByRole('region', { name: 'report.pdf' });
      expect(region.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(container.querySelector('[data-thumbnails-position="bottom"]')).toBeInTheDocument();
    });

    it('lets the reader move thumbnails and reports the change', async () => {
      mockPdf();
      const onChange = jest.fn();
      render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          defaultThumbnailsOpened
          onThumbnailsPositionChange={onChange}
        />
      );

      await userEvent.click(await screen.findByRole('button', { name: 'Pages panel position' }));
      await userEvent.click(await screen.findByRole('radio', { name: 'Top' }));
      expect(onChange).toHaveBeenCalledWith('top');
      expect(screen.getByRole('listbox', { name: 'Pages' })).toHaveAttribute(
        'data-orientation',
        'horizontal'
      );
    });

    it('is a listbox with one tab stop, where arrow keys change the page', async () => {
      mockPdf();
      render(
        <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" defaultThumbnailsOpened />
      );

      const listbox = await screen.findByRole('listbox', { name: 'Pages' });
      expect(listbox).toHaveAttribute('aria-orientation', 'vertical');
      const page1 = screen.getByRole('option', { name: 'Page 1' });
      const page2 = screen.getByRole('option', { name: 'Page 2' });
      expect(page1).toHaveAttribute('tabindex', '0');
      expect(page2).toHaveAttribute('tabindex', '-1');

      page1.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(page2).toHaveFocus();
      expect(page2).toHaveAttribute('aria-selected', 'true');
      expect(page2).toHaveAttribute('tabindex', '0');
      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      await userEvent.keyboard('{End}');
      expect(screen.getByRole('option', { name: 'Page 3' })).toHaveFocus();
      expect(screen.getByText('3 / 3')).toBeInTheDocument();

      await userEvent.keyboard('{Home}');
      expect(page1).toHaveFocus();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('moves the tab stop to the thumbnail of the page scrolled to', async () => {
      mockPdf();
      render(
        <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" defaultThumbnailsOpened />
      );

      await screen.findByRole('listbox', { name: 'Pages' });
      await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.getByRole('option', { name: 'Page 2' })).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('option', { name: 'Page 1' })).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('focus and announcements', () => {
    it('keeps focus on Next page when it becomes unavailable', async () => {
      mockPdf({ numPages: 2 });
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      const next = await screen.findByRole('button', { name: 'Next page' });
      await userEvent.click(next);
      expect(next).toHaveAttribute('aria-disabled', 'true');
      expect(next).toHaveFocus();
      await userEvent.click(next);
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('returns focus to the Search button when search closes', async () => {
      mockPdf();
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      const toggle = await screen.findByRole('button', { name: 'Search' });
      await userEvent.click(toggle);
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(toggle).toHaveFocus());
    });

    it('announces the active match with its page', async () => {
      mockPdf();
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      await userEvent.click(await screen.findByRole('button', { name: 'Search' }));
      await userEvent.type(screen.getByRole('textbox', { name: 'Search document' }), 'costs');
      expect(await screen.findByText('Match 1 of 1, page 2')).toBeInTheDocument();
    });

    it('still searches the other pages when one page cannot be read', async () => {
      mockPdf({ unreadablePage: 1 });
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      await userEvent.click(await screen.findByRole('button', { name: 'Search' }));
      await userEvent.type(screen.getByRole('textbox', { name: 'Search document' }), 'quarter');
      expect(await screen.findByText('Match 1 of 1, page 3')).toBeInTheDocument();
    });
  });

  describe('efficiency', () => {
    it('passes pdfOptions to pdf.js over the defaults', async () => {
      mockPdf();
      render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          pdfOptions={{ disableAutoFetch: false, withCredentials: true }}
        />
      );

      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      expect(getDocument).toHaveBeenCalledWith({
        url: '/files/report.pdf',
        disableAutoFetch: false,
        disableStream: true,
        withCredentials: true,
      });
    });

    it('frees the pdf.js memory of drawn pages when the viewer unmounts', async () => {
      const { page } = mockPdf();
      const { unmount } = render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      unmount();
      await waitFor(() => expect(page.cleanup).toHaveBeenCalledTimes(3));
    });
  });

  describe('events and controller', () => {
    it('reports load and errors', async () => {
      mockPdf();
      const onDocumentLoad = jest.fn();
      render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          onDocumentLoad={onDocumentLoad}
        />
      );
      await waitFor(() =>
        expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'pdf', numPages: 3 })
      );

      mockPdf({ fail: true });
      const onDocumentError = jest.fn();
      render(
        <DocViewer
          src="/files/broken.pdf"
          pdfWorkerSrc="/worker.mjs"
          onDocumentError={onDocumentError}
        />
      );
      await waitFor(() => expect(onDocumentError).toHaveBeenCalledWith(expect.any(Error)));
    });

    it('moves pages and zooms through controllerRef, and reports changes', async () => {
      mockPdf();
      const controller = createRef<DocViewerController>();
      const onPageChange = jest.fn();
      const onZoomChange = jest.fn();
      render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          controllerRef={controller}
          onPageChange={onPageChange}
          onZoomChange={onZoomChange}
        />
      );
      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

      act(() => controller.current!.goToPage(3));
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
      expect(onPageChange).toHaveBeenLastCalledWith(3);

      act(() => controller.current!.setZoom(2));
      expect(screen.getByRole('button', { name: /Reset zoom/ })).toHaveTextContent('200%');
      expect(onZoomChange).toHaveBeenLastCalledWith(2, false);

      act(() => controller.current!.setZoom('fit'));
      expect(screen.getByRole('button', { name: 'Fit to width' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('follows the page prop', async () => {
      mockPdf();
      const { rerender } = render(
        <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" page={1} />
      );
      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

      rerender(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" page={2} />);
      expect(await screen.findByText('2 / 3')).toBeInTheDocument();
    });

    it('opens with defaultZoom and defaultPage', async () => {
      mockPdf();
      render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          defaultZoom={1.5}
          defaultPage={3}
        />
      );
      expect(await screen.findByText('3 / 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset zoom/ })).toHaveTextContent('150%');
    });

    it('opens search with a query through controllerRef', async () => {
      mockPdf();
      const controller = createRef<DocViewerController>();
      render(
        <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
      );
      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

      act(() => controller.current!.openSearch('costs'));
      expect(screen.getByRole('textbox', { name: 'Search document' })).toHaveValue('costs');
      expect(await screen.findByText('Match 1 of 1, page 2')).toBeInTheDocument();
    });
  });

  describe('outline, password, layout and print', () => {
    it('jumps to a page from the outline', async () => {
      mockPdf({ outline: [{ title: 'Costs', dest: 'costs', url: null, items: [] }] });
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      await userEvent.click(await screen.findByRole('button', { name: 'Outline' }));
      const outline = await screen.findByRole('navigation', { name: 'Outline' });
      await userEvent.click(within(outline).getByRole('button', { name: 'Costs' }));
      await waitFor(() => expect(screen.getByText('2 / 3')).toBeInTheDocument());
    });

    it('has no outline button for documents without bookmarks', async () => {
      mockPdf();
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);
      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      expect(screen.queryByRole('button', { name: 'Outline' })).not.toBeInTheDocument();
    });

    it('asks for the password of a protected PDF', async () => {
      mockPdf({ password: 'secret' });
      render(<DocViewer src="/files/locked.pdf" pdfWorkerSrc="/worker.mjs" />);

      const input = await screen.findByLabelText('Password');
      await userEvent.type(input, 'wrong');
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      expect(await screen.findByText('The password is incorrect')).toBeInTheDocument();

      await userEvent.clear(screen.getByLabelText('Password'));
      await userEvent.type(screen.getByLabelText('Password'), 'secret');
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      expect(await screen.findAllByRole('group', { name: /^Page \d of 3$/ })).toHaveLength(3);
    });

    it('shows two pages side by side', async () => {
      mockPdf();
      const { container } = render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          defaultPageLayout="two-page-cover"
        />
      );
      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      const pages = container.querySelector('.mantine-DocViewer-pages')!;
      expect(pages).toHaveAttribute('data-layout', 'two-page-cover');

      await userEvent.click(screen.getByRole('button', { name: 'Two pages' }));
      expect(pages).toHaveAttribute('data-layout', 'single');
    });

    it('prints the PDF bytes from a hidden frame', async () => {
      URL.createObjectURL = jest.fn(() => 'blob:report');
      URL.revokeObjectURL = jest.fn();
      mockPdf();
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

      await userEvent.click(await screen.findByRole('button', { name: 'Print' }));
      await waitFor(() => expect(document.querySelector('iframe')).toBeInTheDocument());
    });

    it('hides print and download with withPrint and withDownload', async () => {
      mockPdf();
      render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          withPrint={false}
          withDownload={false}
        />
      );
      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
    });
  });
});
