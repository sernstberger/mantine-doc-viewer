import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as pdfjs from 'pdfjs-dist';
import React, { createRef } from 'react';
import type { DocViewerController } from '../controller';
import { DocViewer } from '../DocViewer';

import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';

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
      expect(region).toHaveAttribute('aria-keyshortcuts', 'Control+F Meta+F Plus Minus 0');
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

    describe('responsive thumbnailsPosition', () => {
      const { matchMedia } = window;

      // Viewport between theme.breakpoints.sm and md
      beforeEach(() => {
        window.matchMedia = jest.fn().mockImplementation((query: string) => ({
          matches: /min-width: (36|48)em/.test(query),
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
        }));
      });

      afterEach(() => {
        window.matchMedia = matchMedia;
      });

      it('uses the side of the largest matching breakpoint', async () => {
        mockPdf();
        render(
          <DocViewer
            src="/files/report.pdf"
            pdfWorkerSrc="/worker.mjs"
            defaultThumbnailsOpened
            thumbnailsPosition={{ base: 'bottom', sm: 'right' }}
          />
        );

        const nav = await screen.findByRole('listbox', { name: 'Pages' });
        await waitFor(() => expect(nav).toHaveAttribute('data-orientation', 'vertical'));
        expect(document.querySelector('[data-thumbnails-position="right"]')).toBeInTheDocument();
      });
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

    it('lays pages out from the page layout menu', async () => {
      mockPdf();
      const controller = createRef<DocViewerController>();
      const { container } = render(
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          defaultPageLayout="two-page-cover"
          controllerRef={controller}
        />
      );
      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      const pages = container.querySelector('.mantine-DocViewer-pages')!;
      expect(pages).toHaveAttribute('data-layout', 'two-page-cover');

      await userEvent.click(screen.getByRole('button', { name: 'Page layout' }));
      await userEvent.click(await screen.findByRole('radio', { name: 'Horizontal scrolling' }));
      expect(pages).toHaveAttribute('data-layout', 'horizontal');
      expect(screen.getByRole('button', { name: 'Fit to view' })).toBeInTheDocument();

      act(() => controller.current!.setPageLayout('single'));
      expect(pages).toHaveAttribute('data-layout', 'single');
      expect(screen.getByRole('button', { name: 'Fit to width' })).toBeInTheDocument();
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

  describe('links', () => {
    const links = [
      { id: 'toc-1', annotationType: 2, dest: [2, { name: 'Fit' }] },
      { id: 'web', annotationType: 2, url: 'https://mantine.dev/' },
      { id: 'form', annotationType: 20 },
    ];

    it('makes links in pages clickable, with names', async () => {
      mockPdf({ links });
      const onLinkClick = jest.fn((_url: string, event: MouseEvent) => event.preventDefault());
      render(
        <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" onLinkClick={onLinkClick} />
      );

      const pageLink = await screen.findByRole('link', { name: 'Go to page 3' });
      const webLink = screen.getByRole('link', { name: 'https://mantine.dev/' });
      expect(webLink).toHaveAttribute('target', '_blank');
      // Only links: other annotations stay on the canvas
      expect(document.querySelectorAll('.mantine-DocViewer-linkLayer section')).toHaveLength(2);

      await userEvent.click(pageLink);
      await waitFor(() => expect(screen.getByText('3 / 3')).toBeInTheDocument());

      await userEvent.click(webLink);
      expect(onLinkClick).toHaveBeenCalledWith('https://mantine.dev/', expect.any(MouseEvent));
    });

    it('reports load once, however often the viewer renders', async () => {
      mockPdf();
      const onDocumentLoad = jest.fn();
      function Parent() {
        const [count, setCount] = React.useState(0);
        return (
          <>
            <button type="button" onClick={() => setCount(count + 1)}>
              Render again {count}
            </button>
            <DocViewer
              src="/files/report.pdf"
              pdfWorkerSrc="/worker.mjs"
              onDocumentLoad={onDocumentLoad}
            />
          </>
        );
      }
      render(<Parent />);

      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      await userEvent.click(screen.getByRole('button', { name: /Render again/ }));
      await userEvent.click(screen.getByRole('button', { name: /Render again/ }));
      expect(onDocumentLoad).toHaveBeenCalledTimes(1);
    });
  });

  it('narrows search with match case and whole words', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Search' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search document' }), 'quarter');
    expect(await screen.findByText('1 of 3')).toBeInTheDocument();

    const matchCase = screen.getByRole('button', { name: 'Match case' });
    await userEvent.click(matchCase);
    expect(matchCase).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('1 of 2')).toBeInTheDocument();

    await userEvent.click(matchCase);
    await userEvent.click(screen.getByRole('button', { name: 'Whole words' }));
    expect(await screen.findByText('1 of 2')).toBeInTheDocument();
  });

  it('rotates pages a quarter turn at a time', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultZoom={1}
        controllerRef={controller}
      />
    );

    const page1 = await screen.findByRole('group', { name: 'Page 1 of 3' });
    expect(page1).toHaveStyle({ width: '612px', height: '792px' });

    await userEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    await waitFor(() => expect(page1).toHaveStyle({ width: '792px', height: '612px' }));

    act(() => controller.current!.rotate());
    await waitFor(() => expect(page1).toHaveStyle({ width: '612px', height: '792px' }));
  });

  it('scrolls to the page prop when the app changes it', async () => {
    mockPdf();
    function Parent() {
      const [page, setPage] = React.useState(1);
      return (
        <>
          <button type="button" onClick={() => setPage(3)}>
            Show page 3
          </button>
          <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" page={page} />
        </>
      );
    }
    render(<Parent />);

    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show page 3' }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('shows properties, attachments and layers in document info', async () => {
    URL.createObjectURL = jest.fn(() => 'blob:attachment');
    URL.revokeObjectURL = jest.fn();
    mockPdf({
      layers: [{ id: '5R', name: 'Annotations', visible: true }],
      attachments: new Map([['notes.txt', { filename: 'notes.txt', description: 'Notes' }]]),
    });
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Document info' }));
    // The page text also says "Quarterly report", so look for it as a property value
    expect(await screen.findByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Title').nextElementSibling).toHaveTextContent('Quarterly report');
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('8.5 × 11 in (216 × 279 mm)')).toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Download attachment notes.txt' })
    );
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());

    const layer = screen.getByRole('checkbox', { name: 'Annotations' });
    expect(layer).toBeChecked();
    await userEvent.click(layer);
    expect(layer).not.toBeChecked();
  });

  it('presents one page at a time, moving with keys and ending with Escape', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
    );
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

    await userEvent.click(screen.getByRole('button', { name: 'Presentation' }));
    expect(screen.getAllByRole('group', { name: /^Page \d of 3$/ })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
    const region = screen.getByRole('region', { name: 'report.pdf' });
    expect(region).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('group', { name: 'Page 2 of 3' })).toBeInTheDocument();
    await userEvent.click(region);
    expect(screen.getByRole('group', { name: 'Page 3 of 3' })).toBeInTheDocument();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('group', { name: 'Page 1 of 3' })).toBeInTheDocument();

    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{Escape}');
    expect(screen.getAllByRole('group', { name: /^Page \d of 3$/ })).toHaveLength(3);
    // Stays on the page the presentation ended on
    await waitFor(() => expect(screen.getByText('3 / 3')).toBeInTheDocument());

    act(() => controller.current!.togglePresentation());
    await userEvent.click(screen.getByRole('button', { name: 'Exit presentation' }));
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  describe('page editing', () => {
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
      return { onSave, listbox, order };
    };

    it('is off unless withPageEditing is set', async () => {
      mockPdf();
      render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);
      await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
      expect(screen.queryByRole('button', { name: 'Edit pages' })).not.toBeInTheDocument();
    });

    it('reorders with buttons and saves a new document', async () => {
      const { onSave, order } = await openEditor();
      await userEvent.click(screen.getByRole('option', { name: 'Page 3, position 3 of 3' }));
      expect(screen.getByText('1 selected')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Move earlier' }));
      expect(order()).toEqual(['1', '3', '2']);
      expect(screen.getByText(/Page 3 moved to position 2/)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(expect.any(Uint8Array), {
          reason: 'save',
          pages: [1, 3, 2],
        })
      );
      // Back to the viewer, now showing the edited document
      expect(await screen.findAllByRole('group', { name: /^Page \d of 3$/ })).toHaveLength(3);
      expect(getDocument).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: expect.any(Uint8Array) })
      );
    });

    it('moves, selects and removes pages with the keyboard', async () => {
      const { order } = await openEditor();
      const first = screen.getByRole('option', { name: 'Page 1, position 1 of 3' });
      first.focus();
      await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
      expect(order()).toEqual(['2', '1', '3']);

      await userEvent.keyboard('{End}{ }');
      expect(screen.getByRole('option', { name: 'Page 3, position 3 of 3' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await userEvent.keyboard('{Delete}');
      expect(order()).toEqual(['2', '1']);
      expect(screen.getByText(/1 page removed/)).toBeInTheDocument();

      await userEvent.keyboard('{Control>}a{/Control}');
      expect(screen.getByText('2 selected')).toBeInTheDocument();
      // Never removes every page
      await userEvent.keyboard('{Delete}');
      expect(order()).toEqual(['2', '1']);
    });

    it('extracts the selected pages without changing the document', async () => {
      const { onSave } = await openEditor();
      await userEvent.click(screen.getByRole('option', { name: 'Page 2, position 2 of 3' }));
      await userEvent.click(screen.getByRole('button', { name: 'Extract selected' }));
      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(expect.any(Uint8Array), {
          reason: 'extract',
          pages: [2],
        })
      );
      expect(screen.getByRole('listbox', { name: 'Pages' })).toBeInTheDocument();
    });

    it('resets and cancels without saving', async () => {
      const { onSave, order } = await openEditor();
      await userEvent.click(screen.getByRole('option', { name: 'Page 2, position 2 of 3' }));
      await userEvent.click(screen.getByRole('button', { name: 'Move later' }));
      expect(order()).toEqual(['1', '3', '2']);
      await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
      expect(order()).toEqual(['1', '2', '3']);

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(await screen.findAllByRole('group', { name: /^Page \d of 3$/ })).toHaveLength(3);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('downloads when there is no onSave', async () => {
      URL.createObjectURL = jest.fn(() => 'blob:edited');
      URL.revokeObjectURL = jest.fn();
      await openEditor({ onSave: undefined });
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    });
  });

  it('zooms PDFs with + - 0 and with Ctrl+wheel or trackpad pinch', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" defaultZoom={1} />);
    const region = await screen.findByRole('region', { name: 'report.pdf' });
    const zoomLevel = () => screen.getByRole('button', { name: /Reset zoom/ }).textContent;

    region.focus();
    await userEvent.keyboard('+');
    expect(zoomLevel()).toBe('125%');
    await userEvent.keyboard('-');
    expect(zoomLevel()).toBe('100%');
    await userEvent.keyboard('0');
    expect(screen.getByRole('button', { name: 'Fit to width' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await userEvent.keyboard('-');
    fireEvent.wheel(region, { deltaY: -100, ctrlKey: true });
    expect(zoomLevel()).not.toBe('100%');
  });

  it('gives the outline with page numbers through controllerRef', async () => {
    mockPdf({
      outline: [
        {
          title: 'Costs',
          dest: 'costs',
          url: null,
          items: [{ title: 'Mantine', url: 'https://mantine.dev', dest: null, items: [] }],
        },
      ],
    });
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
    );
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

    expect(await controller.current!.getOutline()).toEqual([
      {
        title: 'Costs',
        page: 2,
        url: null,
        items: [{ title: 'Mantine', page: null, url: 'https://mantine.dev', items: [] }],
      },
    ]);
  });
});
