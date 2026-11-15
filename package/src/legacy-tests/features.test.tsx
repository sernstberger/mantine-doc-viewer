import { render, screen } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';
import { type DocViewerController, DocViewer } from '../../../test-utils/render-legacy';
import { DocViewerToolbar } from '../DocViewerToolbar/DocViewerToolbar';
import { DocViewerBody } from '../DocViewerBody/DocViewerBody';

function loadImage(width = 800, height = 400) {
  const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  Object.defineProperty(image, 'naturalWidth', { value: width });
  Object.defineProperty(image, 'naturalHeight', { value: height });
  fireEvent.load(image);
}

describe('DocViewer features', () => {
  it('reports image load and zooms and rotates through controllerRef', () => {
    const controller = createRef<DocViewerController>();
    const onDocumentLoad = jest.fn();
    render(
      <DocViewer
        src="/files/photo.png"
        controllerRef={controller}
        onDocumentLoad={onDocumentLoad}
        defaultZoom={1}
      />
    );
    loadImage();

    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'image', width: 800, height: 400 });
    expect(screen.getByRole('button', { name: /^Zoom \d/ })).toHaveTextContent('100%');

    act(() => controller.current!.zoomIn());
    expect(screen.getByRole('button', { name: /^Zoom \d/ })).toHaveTextContent('125%');

    act(() => controller.current!.rotate());
    expect(screen.getByRole('img', { hidden: true }).style.transform).toContain('rotate(90deg)');
  });

  it('shows a full screen button where the browser supports it', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    const requestFullscreen = jest.fn(() => Promise.resolve());
    Element.prototype.requestFullscreen = requestFullscreen;

    render(<DocViewer src="/files/archive.zip" />);
    await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(requestFullscreen).toHaveBeenCalled();

    Object.defineProperty(document, 'fullscreenEnabled', { value: undefined, configurable: true });
  });

  it('uses a custom renderer before the built-in views', () => {
    render(
      <DocViewer
        src="/files/table.csv"
        renderers={[
          {
            test: (file) => file.fileName?.endsWith('.csv') ?? false,
            render: (file) => (
              <>
                <DocViewerToolbar />
                <DocViewerBody>Rows of {file.fileName}</DocViewerBody>
              </>
            ),
          },
        ]}
      />
    );

    expect(screen.getByRole('region', { name: 'table.csv' })).toHaveTextContent(
      'Rows of table.csv'
    );
    expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
  });
});
