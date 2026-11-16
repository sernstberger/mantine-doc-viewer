import { render, screen } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import { TestDocViewer } from '../../../test-utils/viewer';
import { useDocViewer, type DocViewerActions } from '../doc-viewer.store';

function loadImage(width = 800, height = 400) {
  const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  Object.defineProperty(image, 'naturalWidth', { value: width });
  Object.defineProperty(image, 'naturalHeight', { value: height });
  fireEvent.load(image);
}

describe('DocViewer image controls', () => {
  it('reports image load and zooms and rotates through the store actions', () => {
    let actions!: DocViewerActions;
    const onDocumentLoad = jest.fn();
    function App() {
      const [store, docViewerActions] = useDocViewer();
      actions = docViewerActions;
      return (
        <TestDocViewer
          src="/files/photo.png"
          store={store}
          onDocumentLoad={onDocumentLoad}
          defaultZoom={1}
        />
      );
    }
    render(<App />);
    loadImage();

    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'image', width: 800, height: 400 });
    expect(screen.getByRole('button', { name: /^Zoom \d/ })).toHaveTextContent('100%');

    act(() => actions.zoomIn());
    expect(screen.getByRole('button', { name: /^Zoom \d/ })).toHaveTextContent('125%');

    act(() => actions.rotate());
    expect(screen.getByRole('img', { hidden: true }).style.transform).toContain('rotate(90deg)');
  });
});
