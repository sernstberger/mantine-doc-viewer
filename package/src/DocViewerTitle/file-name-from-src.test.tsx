import { render, screen } from '@mantine-tests/core';
import { TestDocViewer } from '../../../test-utils/viewer';
import { DocViewerTitle } from './DocViewerTitle';

function renderTitle(src: string) {
  return render(
    <TestDocViewer src={src}>
      <DocViewerTitle />
    </TestDocViewer>
  );
}

describe('title from the src of the document', () => {
  it('uses file names from encoded urls and none for data or blob urls', () => {
    const first = renderTitle('/files/my%20doc.bin?x=1#y');
    expect(screen.getByText('my doc.bin')).toBeInTheDocument();
    first.unmount();
    const second = renderTitle('blob:abc');
    expect(screen.getByText('Document')).toBeInTheDocument();
    second.unmount();
    renderTitle('/files/');
    expect(screen.getByText('Document')).toBeInTheDocument();
  });
});
