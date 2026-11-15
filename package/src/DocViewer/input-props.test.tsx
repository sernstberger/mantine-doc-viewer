import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from './DocViewer';

const PDF = { src: '/files/report.pdf', pdfWorkerSrc: '/worker.mjs' } as const;

describe('searchInputProps and passwordInputProps', () => {
  beforeEach(() => getDocument.mockReset());

  it('puts searchInputProps on the search box, which keeps working', async () => {
    mockPdf();
    render(
      <DocViewer
        {...PDF}
        searchInputProps={{
          placeholder: 'Find in contract',
          'data-testid': 'contract-search',
          // The viewer's own handler stays, so this one cannot take the keys over
          maxLength: 20,
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

  it('puts passwordInputProps on the password field, which keeps working', async () => {
    mockPdf({ password: 'secret' });
    render(
      <DocViewer
        {...PDF}
        passwordInputProps={{ description: 'Ask the sender', 'data-testid': 'pdf-password' }}
      />
    );

    const input = await screen.findByLabelText('Password');
    expect(input).toHaveAttribute('data-testid', 'pdf-password');
    expect(screen.getByText('Ask the sender')).toBeInTheDocument();

    await userEvent.type(input, 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByText('The password is incorrect')).toBeInTheDocument();
  });

  it('keeps the default input props when none are given', async () => {
    mockPdf({ password: 'secret' });
    render(<DocViewer {...PDF} />);
    expect(await screen.findByLabelText('Password')).toHaveAttribute('autocomplete', 'off');
  });
});
