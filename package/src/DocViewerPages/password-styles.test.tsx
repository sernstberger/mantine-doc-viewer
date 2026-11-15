import { render, screen } from '@mantine-tests/core';
import React from 'react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { TestDocViewer } from '../../../test-utils/viewer';

describe('password field Styles API', () => {
  beforeEach(() => getDocument.mockReset());

  it('applies classNames to the password input and button', async () => {
    mockPdf({ password: 'secret' });
    render(
      <TestDocViewer
        src="/files/report.pdf"
        classNames={{ passwordInput: 'app-password-input', passwordSubmit: 'app-password-submit' }}
      />
    );

    const input = await screen.findByLabelText('Password');
    expect(document.querySelector('.app-password-input')).toContainElement(input);
    expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('app-password-submit');
  });
});
