import { MantineProvider } from '@mantine/core';
import { render, screen } from '@mantine-tests/core';
import React from 'react';
import { mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';

async function pressedColor(color?: string) {
  mockPdf();
  render(
    <MantineProvider theme={{ primaryColor: 'grape' }}>
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultThumbnailsOpened
        color={color}
      />
    </MantineProvider>
  );
  await screen.findByRole('listbox', { name: 'Pages' });
  const button = screen.getByRole('button', { name: /thumbnails/i });
  expect(button).toHaveAttribute('aria-pressed', 'true');
  return button.style.getPropertyValue('--ai-color');
}

describe('color of a pressed toolbar button', () => {
  it('is the theme primary colour when color is not set', async () => {
    expect(await pressedColor()).toContain('grape');
  });

  it('is the color prop when set', async () => {
    expect(await pressedColor('teal')).toContain('teal');
  });
});
