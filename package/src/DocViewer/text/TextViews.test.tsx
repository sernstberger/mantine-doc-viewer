import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockFetch } from '../../../../test-utils/mock-fetch';
import { DocViewer } from '../DocViewer';

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
