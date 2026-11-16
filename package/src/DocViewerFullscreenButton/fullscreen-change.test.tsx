import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
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
    expect(button).not.toHaveAttribute('aria-pressed');
    const root = document.querySelector('[data-doc-type]')!;
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: root });
    fireEvent(root, new Event('fullscreenchange'));
    expect(await screen.findByRole('button', { name: 'Exit full screen' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
  });
});
