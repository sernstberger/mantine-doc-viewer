import { render, screen } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DocViewer } from '../../../test-utils/render-legacy';
import { getOverlayStyle } from './page-overlay';

import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';

describe('getOverlayStyle', () => {
  it('keeps the box in place without rotation', () => {
    expect(getOverlayStyle(100, 200, 0)).toEqual({ width: 100, height: 200, transform: undefined });
  });

  it.each([
    [90, 'translate(200px, 0px) rotate(90deg)'],
    [180, 'translate(100px, 200px) rotate(180deg)'],
    [270, 'translate(0px, 100px) rotate(270deg)'],
  ] as const)('turns the box %i degrees back onto the rotated page', (rotation, transform) => {
    expect(getOverlayStyle(100, 200, rotation)).toEqual({ width: 100, height: 200, transform });
  });
});

describe('renderPageOverlay', () => {
  beforeEach(() => getDocument.mockReset());

  it('renders content over each page with its number, size and scale', async () => {
    mockPdf();
    const renderPageOverlay = jest.fn(({ pageNumber, scale }) => (
      <button type="button" style={{ left: 10 * scale }}>
        Pin {pageNumber}
      </button>
    ));
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultZoom={1}
        renderPageOverlay={renderPageOverlay}
      />
    );

    const page2 = await screen.findByRole('group', { name: 'Page 2 of 3' });
    expect(await screen.findByRole('button', { name: 'Pin 2' })).toBeInTheDocument();
    expect(page2).toContainElement(screen.getByRole('button', { name: 'Pin 2' }));
    expect(renderPageOverlay).toHaveBeenLastCalledWith(
      expect.objectContaining({ width: 612, height: 792, scale: 1, rotation: 0 })
    );

    const overlay = screen.getByRole('button', { name: 'Pin 1' }).parentElement!;
    expect(overlay).toHaveClass('mantine-DocViewer-pageOverlay');
    expect(overlay).toHaveStyle({ width: '612px', height: '792px' });
  });

  it('scales with zoom and turns with the page', async () => {
    mockPdf();
    const renderPageOverlay = jest.fn(({ pageNumber }) => <span>Mark {pageNumber}</span>);
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultZoom={1}
        renderPageOverlay={renderPageOverlay}
      />
    );

    const overlay = (await screen.findByText('Mark 1')).parentElement!;
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await waitFor(() => expect(overlay).toHaveStyle({ width: '765px', height: '990px' }));

    await userEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    await waitFor(() =>
      expect(overlay).toHaveStyle({ transform: 'translate(990px, 0px) rotate(90deg)' })
    );
    expect(renderPageOverlay).toHaveBeenLastCalledWith(
      expect.objectContaining({ width: 612, height: 792, scale: 1.25, rotation: 90 })
    );
  });

  it('adds no overlay element for pages that get nothing', async () => {
    mockPdf();
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        renderPageOverlay={({ pageNumber }) => pageNumber === 1 && <span>Only first</span>}
      />
    );

    await screen.findByText('Only first');
    expect(document.querySelectorAll('.mantine-DocViewer-pageOverlay')).toHaveLength(1);
  });
});
