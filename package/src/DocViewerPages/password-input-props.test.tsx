import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { TestDocViewer } from '../../../test-utils/viewer';

const PDF = { src: '/files/report.pdf' } as const;

describe('pagesProps passwordInputProps', () => {
  beforeEach(() => getDocument.mockReset());

  it('puts pagesProps.passwordInputProps on the password field, which keeps working', async () => {
    mockPdf({ password: 'secret' });
    render(
      <TestDocViewer
        {...PDF}
        pagesProps={{
          passwordInputProps: { description: 'Ask the sender', 'data-testid': 'pdf-password' },
        }}
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
    render(<TestDocViewer {...PDF} />);
    expect(await screen.findByLabelText('Password')).toHaveAttribute('autocomplete', 'off');
  });
});
