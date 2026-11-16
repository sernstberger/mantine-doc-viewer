import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import { mockFetch } from '../../../../test-utils/mock-fetch';
import { mockPdf } from '../../../../test-utils/mock-pdf';
import { TestDocViewer } from '../../../../test-utils/viewer';
import { useDocViewer, type DocViewerActions } from '../../doc-viewer.store';

let actions: DocViewerActions;

function Viewer({ src, fileName }: { src: string; fileName?: string }) {
  const [store, own] = useDocViewer();
  actions = own;
  return <TestDocViewer src={src} fileName={fileName} store={store} />;
}

describe('getBytes of a PDF', () => {
  it('gives the bytes of the document as shown', async () => {
    mockPdf();
    render(<Viewer src="/files/report.pdf" />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

    let bytes: Uint8Array | null = null;
    await act(async () => {
      bytes = await actions.getBytes();
    });
    expect(bytes).toEqual(new Uint8Array([37, 80, 68, 70]));
  });

  it('gives null while the PDF is still loading', async () => {
    mockPdf();
    render(<Viewer src="/files/report.pdf" />);
    expect(await actions.getBytes()).toBeNull();
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
  });

  it('gives null for a document that is not a PDF', async () => {
    mockFetch('hi');
    render(<Viewer src="data:text/plain,hi" fileName="a.txt" />);
    expect(await actions.getBytes()).toBeNull();
    expect(await screen.findByText('hi')).toBeInTheDocument();
  });
});
