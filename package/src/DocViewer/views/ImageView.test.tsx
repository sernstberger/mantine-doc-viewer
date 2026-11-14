import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DocViewer } from '../DocViewer';

/** jsdom does not load images, so set the natural size and fire load by hand */
function loadImage(width = 800, height = 400) {
  const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  Object.defineProperty(image, 'naturalWidth', { value: width });
  Object.defineProperty(image, 'naturalHeight', { value: height });
  fireEvent.load(image);
  return image;
}

describe('DocViewer image', () => {
  it('shows a loader until the image has loaded', () => {
    render(<DocViewer src="/files/photo.png" />);
    expect(screen.getByLabelText('Loading image')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();

    loadImage();
    expect(screen.queryByLabelText('Loading image')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fit to view' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('zooms in steps, resets to 100% and returns to fit', async () => {
    render(<DocViewer src="/files/photo.png" />);
    const image = loadImage(800, 400);

    // jsdom has no layout, so fit falls back to 100%
    expect(screen.getByText('100%')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('125%')).toBeInTheDocument();
    expect(image).toHaveStyle({ width: '1000px', height: '500px' });
    expect(screen.getByRole('button', { name: 'Fit to view' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reset zoom to 100%' }));
    expect(image).toHaveStyle({ width: '800px' });

    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(screen.getByText('75%')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Fit to view' }));
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('rotates in quarter turns and swaps the frame size', async () => {
    const { container } = render(<DocViewer src="/files/photo.png" />);
    const image = loadImage(800, 400);
    const frame = image.parentElement!;

    expect(frame).toHaveStyle({ width: '800px', height: '400px' });
    await userEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    expect(image.style.transform).toContain('rotate(90deg)');
    expect(frame).toHaveStyle({ width: '400px', height: '800px' });
    expect(container.querySelector('[data-doc-type="image"]')).toBeInTheDocument();
  });

  it('supports keyboard shortcuts on the focused image', () => {
    render(<DocViewer src="/files/photo.png" />);
    const image = loadImage();
    const stage = image.closest('[tabindex="0"]')!;

    fireEvent.keyDown(stage, { key: '+' });
    expect(screen.getByText('125%')).toBeInTheDocument();
    fireEvent.keyDown(stage, { key: '-' });
    fireEvent.keyDown(stage, { key: '-' });
    expect(screen.getByText('75%')).toBeInTheDocument();
    fireEvent.keyDown(stage, { key: '0' });
    expect(screen.getByText('100%')).toBeInTheDocument();
    fireEvent.keyDown(stage, { key: 'r' });
    expect(image.style.transform).toContain('rotate(90deg)');
  });

  it('offers a download when the image cannot be loaded', () => {
    render(<DocViewer src="/files/missing.png" />);
    fireEvent.error(screen.getByRole('img', { hidden: true }));

    expect(screen.getByText('This image could not be loaded')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
      'href',
      '/files/missing.png'
    );
  });

  it('resets zoom when the image changes', async () => {
    const { rerender } = render(<DocViewer src="/files/one.png" />);
    loadImage();
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('125%')).toBeInTheDocument();

    rerender(<DocViewer src="/files/two.png" />);
    expect(screen.getByLabelText('Loading image')).toBeInTheDocument();
    loadImage();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
