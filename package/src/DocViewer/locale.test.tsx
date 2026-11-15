import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from './DocViewer';
import { formatDateTime, formatPercent } from './format';
import { formatPageSize, getPdfProperties } from './pdf/document-info';
import { formatFileSize } from './text/use-doc-viewer-text';

describe('locale', () => {
  beforeEach(() => getDocument.mockReset());

  it('formats numbers, percentages and dates for the locale', () => {
    expect(formatPercent(1.25, 'de-DE')).toBe('125 %');
    expect(formatPercent(1.25, 'en-US')).toBe('125%');
    expect(formatFileSize(1536, 'de-DE')).toBe('1,5 KB');
    expect(formatFileSize(1536, 'en-US')).toBe('1.5 KB');
    expect(formatFileSize(10, 'de-DE')).toBe('10 B');
    expect(formatPageSize(612, 792, 'de-DE')).toBe('8,5 × 11 in (216 × 279 mm)');
    expect(formatDateTime(new Date(2024, 0, 31, 12, 30), 'de-DE')).toContain('31.01.2024');
  });

  it('formats the document properties for the locale', () => {
    const properties = getPdfProperties(
      {},
      { fileSize: 2560, pageCount: 1200, pageSize: { width: 612, height: 792 }, locale: 'de-DE' },
      () => ''
    );
    expect(properties.map((property) => property.value)).toEqual([
      '2,5 KB',
      '1.200',
      '8,5 × 11 in (216 × 279 mm)',
    ]);
  });

  it('shows the zoom of an image in the locale', () => {
    render(<DocViewer src="/a.png" locale="de-DE" defaultZoom={1.25} />);
    const image = screen.getByRole('img', { hidden: true });
    Object.defineProperty(image, 'naturalWidth', { value: 80 });
    Object.defineProperty(image, 'naturalHeight', { value: 40 });
    fireEvent.load(image);
    expect(screen.getByRole('button', { name: /Reset zoom/ })).toHaveTextContent(/^125\s%$/);
  });

  it('shows the page count of a PDF in the locale', async () => {
    mockPdf({ numPages: 3 });
    render(<DocViewer src="/a.pdf" pdfWorkerSrc="/w.mjs" locale="ar-EG" />);
    expect(await screen.findByText('١ / ٣')).toBeInTheDocument();
  });

  it('shows the size of a file that is too large in the locale', async () => {
    mockFetch('', { headers: { 'content-length': String(3.5 * 1024 * 1024) } });
    render(<DocViewer src="/huge.log" locale="de-DE" />);
    expect(
      await screen.findByText('This file is too large to preview (3,5 MB)')
    ).toBeInTheDocument();
  });
});
