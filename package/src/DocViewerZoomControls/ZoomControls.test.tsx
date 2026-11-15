import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { TestDocViewer } from '../../../test-utils/viewer';
import { MAX_ZOOM, MIN_ZOOM } from '../utils/zoom';
import { ZoomControls } from './ZoomControls';

function zoom(scale: number, fitted = false) {
  const onZoom = jest.fn();
  const onFit = jest.fn();
  render(
    <TestDocViewer src="/files/doc.bin">
      <ZoomControls
        scale={scale}
        fitted={fitted}
        fitLabel="Fit"
        fitIcon={<span />}
        onZoom={onZoom}
        onFit={onFit}
      />
    </TestDocViewer>
  );
  return { onZoom, onFit };
}

describe('ZoomControls', () => {
  it('zooms in, out, resets and fits', () => {
    const { onZoom, onFit } = zoom(1, true);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoom).toHaveBeenLastCalledWith(1.25);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onZoom).toHaveBeenLastCalledWith(0.75);
    fireEvent.click(screen.getByRole('button', { name: '100%, Reset zoom to 100%' }));
    expect(onZoom).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Fit' }));
    expect(onFit).toHaveBeenCalled();
  });

  it('does not zoom past the limits', () => {
    const { onZoom } = zoom(MAX_ZOOM);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoom).not.toHaveBeenCalled();
  });

  it('does not zoom out past the minimum', () => {
    const { onZoom } = zoom(MIN_ZOOM);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onZoom).not.toHaveBeenCalled();
  });
});
