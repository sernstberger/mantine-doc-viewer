import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DocViewer } from './DocViewer';

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

  it('labels the toolbar with the viewer labels', () => {
    render(<DocViewer src="/files/photo.png" labels={{ toolbar: 'Barre' }} />);
    expect(screen.getByRole('toolbar', { name: 'Barre' })).toBeInTheDocument();
  });
});
