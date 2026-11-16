import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { type ComponentProps, useEffect } from 'react';
import { TestDocViewer } from '../../../test-utils/viewer';
import { useDocViewer, type DocViewerActions } from '../doc-viewer.store';
import { toPdfZoom } from '../utils/pdf-zoom';

import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { pagesLoaded } from '../../../test-utils/pdf-parts';

describe('toPdfZoom', () => {
  it('fits the width for fit, keeps fit-page and clamps scales', () => {
    expect(toPdfZoom('fit')).toBe('fit-width');
    expect(toPdfZoom('fit-page')).toBe('fit-page');
    expect(toPdfZoom(1.5)).toBe(1.5);
    expect(toPdfZoom(40)).toBe(8);
  });
});

function ControlledViewer({
  onActions,
  ...props
}: ComponentProps<typeof TestDocViewer> & {
  onActions: (actions: DocViewerActions) => void;
}) {
  const [store, actions] = useDocViewer();
  useEffect(() => {
    onActions(actions);
  }, [actions, onActions]);
  return <TestDocViewer store={store} {...props} />;
}

describe('fit-page zoom', () => {
  beforeEach(() => getDocument.mockReset());

  it('opens a PDF fitted to the page and reports a fitted zoom', async () => {
    mockPdf();
    const onZoomChange = jest.fn();
    render(
      <TestDocViewer
        src="/files/report.pdf"
        defaultZoom="fit-page"
        defaultPageLayout="two-page"
        onZoomChange={onZoomChange}
      />
    );

    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(onZoomChange).toHaveBeenLastCalledWith('fit-page', { scale: 1 });
    // The toolbar button fits the width, which is a different fit
    expect(screen.getByRole('button', { name: 'Fit to width' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('fits the page through the controller, and back to a scale', async () => {
    mockPdf();
    let actions!: DocViewerActions;
    const onZoomChange = jest.fn();
    const { container } = render(
      <ControlledViewer
        src="/files/report.pdf"
        defaultZoom={2}
        onActions={(value) => (actions = value)}
        onZoomChange={onZoomChange}
      />
    );

    await pagesLoaded(container, 3);
    expect(onZoomChange).toHaveBeenLastCalledWith(2, { scale: 2 });
    act(() => actions.setZoom('fit-page'));
    expect(onZoomChange).toHaveBeenLastCalledWith('fit-page', { scale: 1 });
    await act(async () => {});
  });

  it('fits a whole image for fit-page', async () => {
    let actions!: DocViewerActions;
    const onZoomChange = jest.fn();
    render(
      <ControlledViewer
        src="/files/photo.png"
        defaultZoom="fit-page"
        onActions={(value) => (actions = value)}
        onZoomChange={onZoomChange}
      />
    );
    const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    Object.defineProperty(image, 'naturalWidth', { value: 800 });
    Object.defineProperty(image, 'naturalHeight', { value: 600 });
    fireEvent.load(image);

    await waitFor(() =>
      expect(onZoomChange).toHaveBeenLastCalledWith('fit-page', { scale: expect.any(Number) })
    );
    act(() => actions.setZoom(2));
    expect(onZoomChange).toHaveBeenLastCalledWith(2, { scale: 2 });
    act(() => actions.setZoom('fit-page'));
    expect(onZoomChange).toHaveBeenLastCalledWith('fit-page', { scale: expect.any(Number) });
  });
});
