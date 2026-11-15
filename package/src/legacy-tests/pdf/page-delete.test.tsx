import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import React, { createRef } from 'react';
import { mockFetch } from '../../../../test-utils/mock-fetch';
import { mockPdf } from '../../../../test-utils/mock-pdf';
import { type DocViewerController, DocViewer } from '../../../../test-utils/render-legacy';

describe('get the bytes of the document as shown', () => {
  it('reads them through the controller', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
    );
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

    let bytes: Uint8Array | null = null;
    await act(async () => {
      bytes = await controller.current!.getBytes();
    });
    expect(bytes).toEqual(new Uint8Array([37, 80, 68, 70]));
  });

  it('gives null while a PDF is still loading', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
    );
    expect(await controller.current!.getBytes()).toBeNull();
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
  });

  it('gives null before a PDF is loaded and for other documents', async () => {
    const controller = createRef<DocViewerController>();
    mockFetch('hi');
    render(<DocViewer src="data:text/plain,hi" fileName="a.txt" controllerRef={controller} />);
    expect(await controller.current!.getBytes()).toBeNull();
    // Let the text finish loading inside the test
    expect(await screen.findByText('hi')).toBeInTheDocument();
  });
});
