import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import { MarkupViewer } from '../test-utils';

describe('markup layer Styles API and unstyled', () => {
  beforeEach(() => getDocument.mockReset());

  it('applies classNames.markupInput to the text box input', async () => {
    mockPdf();
    render(
      <MarkupViewer
        markup={{ defaultTool: 'text' }}
        classNames={{ markupInput: 'app-markup-input' }}
      />
    );

    const page = await screen.findByRole('group', { name: 'Page 1 of 3' });
    fireEvent.pointerDown(page.querySelector('.mantine-DocViewer-markupLayer') as HTMLElement, {
      clientX: 1,
      clientY: 1,
      button: 0,
    });
    expect(await screen.findByRole('textbox')).toHaveClass('app-markup-input');
  });

  it('keeps the markup layer class when unstyled', async () => {
    mockPdf();
    render(<MarkupViewer markup={{ defaultTool: 'pen' }} unstyled />);

    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(document.querySelector('.markupLayer')).toBeInTheDocument();
  });
});
