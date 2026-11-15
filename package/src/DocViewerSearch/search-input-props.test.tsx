import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { TestDocViewer } from '../../../test-utils/viewer';

const PDF = { src: '/files/report.pdf' } as const;

describe('searchProps inputProps', () => {
  beforeEach(() => getDocument.mockReset());

  it('puts searchProps.inputProps on the search box, which keeps working', async () => {
    mockPdf();
    render(
      <TestDocViewer
        {...PDF}
        searchProps={{
          inputProps: {
            placeholder: 'Find in contract',
            'data-testid': 'contract-search',
            maxLength: 20,
          },
        }}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Search' }));
    const input = screen.getByTestId('contract-search');
    expect(input).toHaveAttribute('placeholder', 'Find in contract');
    expect(input).toHaveAttribute('maxlength', '20');

    await userEvent.type(input, 'QUARTER');
    expect(await screen.findByText('1 of 3')).toBeInTheDocument();
    expect(input).toHaveValue('QUARTER');
  });
});
