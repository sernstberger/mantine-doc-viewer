import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import React from 'react';
import { mockFetch } from '../../../../test-utils/mock-fetch';
import { DocViewer } from '../../DocViewerRoot/DocViewerRoot';

describe('DocViewer text', () => {
  it('shows plain text and toggles line wrapping', async () => {
    const fetch = mockFetch('first line\nsecond line');
    render(<DocViewer src="/files/notes.txt" />);

    const text = await screen.findByText(/first line/);
    expect(fetch).toHaveBeenCalledWith('/files/notes.txt', expect.anything());
    expect(text).toHaveAttribute('data-wrap', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Wrap lines' }));
    expect(text).not.toHaveAttribute('data-wrap');
  });

  it('refuses files over maxTextSize', async () => {
    mockFetch('', { headers: { 'content-length': String(3 * 1024 * 1024) } });
    render(<DocViewer src="/files/huge.log" />);

    expect(
      await screen.findByText('This file is too large to preview (3.0 MB)')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download file' })).toBeInTheDocument();
  });

  it('reports files that cannot be loaded', async () => {
    mockFetch('', { status: 500 });
    render(<DocViewer src="/files/notes.txt" />);
    expect(await screen.findByText('This file could not be loaded')).toBeInTheDocument();
  });
});

describe('DocViewer code', () => {
  it('shows code with CodeHighlight', async () => {
    mockFetch('const answer = 42;');
    const { container } = render(<DocViewer src="/src/answer.ts" />);

    expect(await screen.findByText(/const answer = 42;/)).toBeInTheDocument();
    expect(container.querySelector('[data-doc-type="code"]')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('shows valid JSON as a tree that can be switched to code', async () => {
    mockFetch('{"name":"mantine-doc-viewer","tags":["pdf","image"]}');
    render(<DocViewer src="/package.json" />);

    expect(await screen.findByText(/mantine-doc-viewer/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Tree' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Code' }));
    expect(screen.getByText(/"tags":\["pdf","image"\]/)).toBeInTheDocument();
  });

  it('shows invalid JSON as code without the tree option', async () => {
    mockFetch('{ not json');
    render(<DocViewer src="/broken.json" />);

    expect(await screen.findByText(/not json/)).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Tree' })).not.toBeInTheDocument();
  });
});

describe('DocViewer markdown', () => {
  it('previews markdown and switches to the source', async () => {
    mockFetch('# Release notes\n\n- Thumbnails');
    render(<DocViewer src="/docs/CHANGELOG.md" />);

    expect(await screen.findByTestId('markdown')).toHaveTextContent('# Release notes');
    expect(screen.getByRole('radio', { name: 'Preview' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Source' }));
    expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
    expect(screen.getByText(/Release notes/)).toBeInTheDocument();
  });
});

describe('DocViewer text accessibility', () => {
  it('makes the loaded text a named, focusable region', async () => {
    mockFetch('first line');
    render(<DocViewer src="/files/notes.txt" />);

    await screen.findByText('first line');
    expect(screen.getByRole('region', { name: 'notes.txt' })).toHaveAttribute('tabindex', '0');
  });

  it('announces load errors as alerts', async () => {
    mockFetch('', { status: 500 });
    render(<DocViewer src="/files/notes.txt" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('This file could not be loaded');
  });

  it('has no axe violations', async () => {
    mockFetch('first line');
    const { container } = render(<DocViewer src="/files/notes.txt" />);
    await screen.findByText('first line');
    expect((await axe(container)).violations).toEqual([]);
  });
  it('shows JSON with integers too large for JavaScript as code only', async () => {
    mockFetch('{"id": 12345678901234567890}');
    render(<DocViewer src="/ids.json" />);

    expect(await screen.findByText(/12345678901234567890/)).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Tree' })).not.toBeInTheDocument();
  });
});

describe('DocViewer text loading', () => {
  it('stops reading once the file passes maxTextSize, without content-length', async () => {
    const fetch = mockFetch('x'.repeat(10_000), { chunkSize: 1000 });
    render(<DocViewer src="/files/huge.log" maxTextSize={2500} />);

    expect(await screen.findByText(/too large to preview \(2.9 KB\)/)).toBeInTheDocument();
    const response = await (fetch.mock.results[0].value as Promise<{ read: jest.Mock }>);
    expect(response.read).toHaveBeenCalledTimes(3);
  });

  it('decodes text with the charset the server names', async () => {
    mockFetch('', {
      bytes: new Uint8Array([0x63, 0x61, 0x66, 0xe9]),
      headers: { 'content-type': 'text/plain; charset=windows-1252' },
    });
    render(<DocViewer src="/files/menu.txt" />);
    expect(await screen.findByText('café')).toBeInTheDocument();
  });
});
