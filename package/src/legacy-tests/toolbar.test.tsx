import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';

describe('DocViewer toolbar', () => {
  it('is a named toolbar whose buttons are reached with the arrow keys', async () => {
    render(<DocViewer src="/files/photo.png" />);
    const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    Object.defineProperty(image, 'naturalWidth', { value: 800 });
    Object.defineProperty(image, 'naturalHeight', { value: 400 });
    fireEvent.load(image);
    const toolbar = screen.getByRole('toolbar', { name: 'Document toolbar' });
    const buttons = Array.from(toolbar.querySelectorAll<HTMLElement>('[data-toolbar-toggle]'));

    // One tab stop for the toolbar, the rest are reached with the arrow keys
    await waitFor(() => expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1));
    await userEvent.tab();
    expect(buttons[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(buttons[1]).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(buttons[buttons.length - 1]).toHaveFocus();
  });

  it('keeps one tab stop when a button is disabled', async () => {
    // At the smallest zoom, Zoom out is disabled; Mantine's Toolbar skips it but would leave its tab stop
    render(<DocViewer src="/files/photo.png" defaultZoom={0.1} />);
    const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    Object.defineProperty(image, 'naturalWidth', { value: 800 });
    Object.defineProperty(image, 'naturalHeight', { value: 400 });
    fireEvent.load(image);
    const toolbar = screen.getByRole('toolbar', { name: 'Document toolbar' });
    const zoomOut = screen.getByRole('button', { name: 'Zoom out' });

    expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
    expect(zoomOut.tabIndex).toBe(-1);
    await waitFor(() =>
      expect(
        Array.from(toolbar.querySelectorAll<HTMLElement>('[data-toolbar-toggle]')).filter(
          (button) => button.tabIndex === 0
        )
      ).toHaveLength(1)
    );
  });

  it('labels the toolbar with the viewer labels', () => {
    render(<DocViewer src="/files/photo.png" labels={{ toolbarLabel: 'Barre' }} />);
    expect(screen.getByRole('toolbar', { name: 'Barre' })).toBeInTheDocument();
  });

  it('shows a subtitle under the title and a slot before it', () => {
    render(
      <DocViewer
        src="/files/photo.png"
        toolbarSubtitle="Draft 4"
        toolbarStartSection={<button type="button">Menu</button>}
      />
    );

    expect(screen.getByText('photo.png')).toBeInTheDocument();
    expect(screen.getByText('Draft 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('renders the title with renderToolbarTitle and hides it with the title control', () => {
    const renderToolbarTitle = jest.fn(({ title }) => <em>Sheet: {title}</em>);
    const { rerender } = render(
      <DocViewer src="/files/photo.png" renderToolbarTitle={renderToolbarTitle} />
    );
    expect(screen.getByText('Sheet: photo.png')).toBeInTheDocument();
    expect(renderToolbarTitle).toHaveBeenCalledWith({ title: 'photo.png', fileName: 'photo.png' });

    rerender(
      <DocViewer
        src="/files/photo.png"
        renderToolbarTitle={renderToolbarTitle}
        toolbarSubtitle="Edited"
        toolbarControls={{ title: false }}
      />
    );
    expect(screen.queryByText('Sheet: photo.png')).not.toBeInTheDocument();
    expect(screen.queryByText('Edited')).not.toBeInTheDocument();
  });
});
