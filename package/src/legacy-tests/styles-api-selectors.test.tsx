import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';

const PDF = { src: '/files/report.pdf', pdfWorkerSrc: '/worker.mjs' } as const;

describe('Styles API selectors of inner Mantine components', () => {
  beforeEach(() => getDocument.mockReset());

  it('applies classNames.viewMode to the markdown view mode switch', async () => {
    mockFetch('# Notes');
    render(<DocViewer src="/docs/NOTES.md" classNames={{ viewMode: 'app-view-mode' }} />);

    await screen.findByTestId('markdown');
    expect(document.querySelector('.app-view-mode')).toContainElement(
      screen.getByRole('radio', { name: 'Preview' })
    );
  });

  it('applies classNames.dropdown to the outline, layout, document info and position popovers', async () => {
    mockPdf({ outline: [{ title: 'Costs', dest: 'costs', url: null, items: [] }] });
    render(
      <DocViewer
        {...PDF}
        withPageEditing
        defaultThumbnailsOpened
        classNames={{ dropdown: 'app-dropdown' }}
      />
    );

    for (const name of ['Outline', 'Page layout', 'Document info', 'Pages panel position']) {
      await userEvent.click(await screen.findByRole('button', { name }));
      expect(document.querySelectorAll('.app-dropdown').length).toBeGreaterThan(0);
      await userEvent.keyboard('{Escape}');
      document.querySelectorAll('.app-dropdown').forEach((node) => node.remove());
    }
  });

  it('applies classNames to the password input and button', async () => {
    mockPdf({ password: 'secret' });
    render(
      <DocViewer
        {...PDF}
        classNames={{ passwordInput: 'app-password-input', passwordSubmit: 'app-password-submit' }}
      />
    );

    const input = await screen.findByLabelText('Password');
    expect(document.querySelector('.app-password-input')).toContainElement(input);
    expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('app-password-submit');
  });

  it('applies classNames.editorTitle to the title of the page editor', async () => {
    mockPdf();
    render(<DocViewer {...PDF} withPageEditing classNames={{ editorTitle: 'app-editor-title' }} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
    expect(screen.getByText('Edit pages', { selector: 'p' })).toHaveClass('app-editor-title');
  });

  it('applies classNames.markupDivider and classNames.markupInput', async () => {
    mockPdf();
    render(
      <DocViewer
        {...PDF}
        withMarkup
        classNames={{ markupDivider: 'app-divider', markupInput: 'app-markup-input' }}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Markup' }));
    await userEvent.click(screen.getByRole('button', { name: 'Text box' }));
    expect(document.querySelector('.app-divider')).toHaveAttribute('data-orientation', 'vertical');

    const layer = await screen.findByRole('group', { name: 'Page 1 of 3' });
    fireEvent.pointerDown(layer.querySelector('.mantine-DocViewer-markupLayer') as HTMLElement, {
      clientX: 1,
      clientY: 1,
      button: 0,
    });
    expect(await screen.findByRole('textbox')).toHaveClass('app-markup-input');
  });
});

describe('root state attributes', () => {
  it('sets data-doc-type and data-page-color-scheme through mod, next to a consumer mod', () => {
    const { container } = render(
      <DocViewer src="/files/archive.zip" pageColorScheme="dark" mod={{ mine: true }} />
    );
    const root = container.querySelector('.mantine-DocViewer-root')!;

    expect(root).toHaveAttribute('data-doc-type', 'unknown');
    expect(root).toHaveAttribute('data-page-color-scheme', 'dark');
    expect(root).toHaveAttribute('data-mine', 'true');
  });

  it('leaves out data-page-color-scheme for light pages', () => {
    const { container } = render(<DocViewer src="/files/archive.zip" pageColorScheme="light" />);
    expect(container.querySelector('.mantine-DocViewer-root')).not.toHaveAttribute(
      'data-page-color-scheme'
    );
  });
});
