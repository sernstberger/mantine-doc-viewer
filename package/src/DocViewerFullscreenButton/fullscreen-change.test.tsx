import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { TestDocViewer } from '../../../test-utils/viewer';
import { DocViewerFullscreenButton } from './DocViewerFullscreenButton';

describe('full screen of the viewer', () => {
  afterEach(() => {
    delete (document as any).fullscreenEnabled;
    delete (document as any).fullscreenElement;
  });

  it('shows the exit label while the viewer is in full screen', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    render(
      <TestDocViewer src="/files/doc.bin">
        <DocViewerFullscreenButton />
      </TestDocViewer>
    );
    const button = await screen.findByRole('button', { name: 'Full screen' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    const root = document.querySelector('[data-doc-type]')!;
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: root });
    fireEvent(root, new Event('fullscreenchange'));
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
  });
});
