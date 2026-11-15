import { render, screen } from '@mantine-tests/core';
import React from 'react';
import { TestDocViewer } from '../../../test-utils/viewer';
import { UnsupportedView } from './UnsupportedView';

describe('UnsupportedView', () => {
  it('says a PDF needs an adapter', () => {
    render(
      <TestDocViewer src="/files/doc.bin">
        <UnsupportedView type="pdf" />
      </TestDocViewer>
    );
    expect(
      screen.getByText('This PDF cannot be shown here. Download it instead.')
    ).toBeInTheDocument();
  });

  it('shows the generic message for unknown types', () => {
    render(
      <TestDocViewer src="/files/doc.bin">
        <UnsupportedView type="unknown" />
      </TestDocViewer>
    );
    expect(screen.getByText('Preview is not available for this file type')).toBeInTheDocument();
  });
});
