import { render, screen } from '@mantine-tests/core';
import { fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as pdfjs from 'pdfjs-dist';
import React from 'react';
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

function mockPdf({ numPages = 3, fail = false } = {}) {
  // One render mock shared by all pages, so tests can count renders across the document
  const page = { render: jest.fn(() => ({ promise: Promise.resolve(), cancel: jest.fn() })) };
  const pages = Array.from({ length: numPages }, (_, index) => ({
    getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }),
    render: page.render,
    getTextContent: jest.fn(() => Promise.resolve({ items: PAGE_TEXT[index] ?? [], styles: {} })),
  }));
  const document = {
    numPages,
    getPage: jest.fn((pageNumber: number) => Promise.resolve(pages[pageNumber - 1])),
  };
  getDocument.mockImplementation(() => ({
    promise: fail ? Promise.reject(new Error('Invalid PDF structure')) : Promise.resolve(document),
    destroy: jest.fn(() => Promise.resolve()),
  }));

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

    expect(screen.getByLabelText('Loading document')).toBeInTheDocument();
    expect(await screen.findAllByRole('img', { name: /^Page \d$/ })).toHaveLength(3);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/pdf.worker.min.mjs');
    expect(getDocument).toHaveBeenCalledWith({ url: '/files/report.pdf' });
    expect(page.render).toHaveBeenCalledTimes(3);
  });

  it('disables previous page on the first page', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    expect(await screen.findByRole('button', { name: 'Previous page' })).toBeDisabled();
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
    expect(screen.getByRole('img', { name: 'Page 1' })).toHaveStyle({ width: '765px' });

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

    const page1 = await screen.findByRole('img', { name: 'Page 1' });
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

    expect(await screen.findByText('No matches')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next match' })).toBeDisabled();
  });

  it('opens search with Ctrl+F and closes it with Escape', async () => {
    mockPdf();
    const { container } = render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);
    await screen.findAllByRole('img', { name: /^Page \d$/ });

    fireEvent.keyDown(container.querySelector('[tabindex="0"]')!, { key: 'f', ctrlKey: true });
    const input = screen.getByRole('textbox', { name: 'Search document' });

    await userEvent.type(input, 'costs{Escape}');
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('shows page thumbnails and jumps to the page that is clicked', async () => {
    const { page } = mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    const toggle = await screen.findByRole('button', { name: 'Page thumbnails' });
    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const thumbnails = within(screen.getByRole('navigation', { name: 'Pages' })).getAllByRole(
      'button'
    );
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]).toHaveAttribute('aria-current', 'page');

    // 3 pages and 3 thumbnails
    await screen.findAllByRole('img', { name: /^Page \d$/ });
    expect(page.render).toHaveBeenCalledTimes(6);

    await userEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 3' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await userEvent.click(toggle);
    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument();
  });

  it('opens thumbnails by default with defaultThumbnailsOpened', async () => {
    mockPdf();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" defaultThumbnailsOpened />
    );

    expect(await screen.findByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
  });
});
