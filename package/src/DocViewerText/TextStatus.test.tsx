import { render, screen } from '@mantine-tests/core';
import React from 'react';
import { TestDocViewer } from '../../../test-utils/viewer';
import { TextStatus } from './TextStatus';

const states = [
  { status: 'too-large', size: 3 * 1024 * 1024 },
  { status: 'error', error: new Error('x') },
  { status: 'ready', text: 'hi', size: 2, mimeType: undefined },
] as const;

const view = (state: React.ComponentProps<typeof TextStatus>['state']) => (
  <TestDocViewer src="/a.bin">
    <TextStatus state={state} />
  </TestDocViewer>
);

describe('TextStatus', () => {
  it('shows loading, too large and error states, and nothing when ready', () => {
    const { rerender } = render(view({ status: 'loading' }));
    expect(screen.getByText('Loading document')).toBeInTheDocument();

    rerender(view(states[0]));
    expect(screen.getByText('This file is too large to preview (3.0 MB)')).toBeInTheDocument();
    rerender(view(states[1]));
    expect(screen.getByText('This file could not be loaded')).toBeInTheDocument();
    rerender(view(states[2]));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
