import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { TestDocViewer } from '../../test-utils/viewer';
import { mockFetch } from '../../test-utils/mock-fetch';
import { getDocument, mockPdf } from '../../test-utils/mock-pdf';

describe('DocViewer locale', () => {
  beforeEach(() => getDocument.mockReset());

  it('shows the zoom of an image in the locale', () => {
    render(<TestDocViewer src="/a.png" locale="de-DE" defaultZoom={1.25} />);
    const image = screen.getByRole('img', { hidden: true });
    Object.defineProperty(image, 'naturalWidth', { value: 80 });
    Object.defineProperty(image, 'naturalHeight', { value: 40 });
    fireEvent.load(image);
    expect(screen.getByRole('button', { name: /^Zoom \d/ })).toHaveTextContent(/^125\s%$/);
  });

  it('shows the page count of a PDF in the locale', async () => {
    mockPdf({ numPages: 3 });
    render(<TestDocViewer src="/a.pdf" locale="ar-EG" />);
    expect(await screen.findByText('١ / ٣')).toBeInTheDocument();
  });

  it('shows the size of a file that is too large in the locale', async () => {
    mockFetch('', { headers: { 'content-length': String(3.5 * 1024 * 1024) } });
    render(<TestDocViewer src="/huge.log" locale="de-DE" />);
    expect(
      await screen.findByText('This file is too large to preview (3,5 MB)')
    ).toBeInTheDocument();
  });
});
