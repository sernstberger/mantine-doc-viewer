import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { DocViewer } from '../DocViewer';
import { createDocViewer } from '../doc-viewer.store';
import { resetMissingPdfAdapterWarning } from '../DocViewerRoot/use-doc-viewer-root';
import { DocViewerAdapterProvider } from './DocViewerAdapterProvider';
import { createReactMarkdownAdapter } from './adapters/react-markdown-adapter';
import { createPdfJsAdapter } from './adapters/pdfjs-adapter';
import { DocViewerMarkdown } from '../DocViewerMarkdown/DocViewerMarkdown';
import { DocViewerRoot } from '../DocViewerRoot/DocViewerRoot';

const Markdown = () => null;
const remarkGfm = () => {};
const markdownModules = () =>
  Promise.resolve([
    { default: Markdown, defaultUrlTransform: (url: string) => url },
    { default: remarkGfm },
  ]) as Promise<[unknown, unknown]>;

describe('DocViewerAdapterProvider', () => {
  const env = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = env;
    resetMissingPdfAdapterWarning();
  });

  it('shows a download message for a PDF without an adapter, with no warning outside development', () => {
    const [store] = createDocViewer();
    const warn = jest.spyOn(console, 'warn');
    render(<DocViewer src="/files/report.pdf" store={store} />);
    expect(
      screen.getByText('This PDF cannot be shown here. Download it instead.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download file' })).toBeInTheDocument();
    expect(store.getState().status).toBe('unsupported');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns once per page load in development', () => {
    process.env.NODE_ENV = 'development';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { unmount } = render(<DocViewer src="/files/report.pdf" />);
    unmount();
    render(<DocViewer src="/files/other.pdf" />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('DocViewerAdapterProvider');
    warn.mockRestore();
  });

  it('shows markdown source without a markdown adapter', async () => {
    mockFetch('# Title');
    render(
      <DocViewerAdapterProvider>
        <DocViewer src="/files/readme.md" />
      </DocViewerAdapterProvider>
    );
    expect(await screen.findByText('# Title')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Markdown view' })).not.toBeInTheDocument();
  });
});

describe('createPdfJsAdapter', () => {
  it('has no getDocument options without options', () => {
    expect(createPdfJsAdapter(() => Promise.resolve({})).getOptions!('/a.pdf')).toBeUndefined();
  });
});

describe('DocViewer.Markdown without an adapter', () => {
  it('shows the source', async () => {
    mockFetch('# Notes');
    render(
      <DocViewerRoot src="/files/notes.md">
        <DocViewerMarkdown />
      </DocViewerRoot>
    );
    expect(await screen.findByText('# Notes')).toBeInTheDocument();
  });
});

describe('createReactMarkdownAdapter', () => {
  it('loads react-markdown and remark-gfm once', async () => {
    const load = jest.fn(markdownModules);
    const adapter = createReactMarkdownAdapter(load);
    const engine = await adapter.load();
    expect(engine).toMatchObject({ Markdown, remarkGfm });
    expect(engine.defaultUrlTransform('/a')).toBe('/a');
    await adapter.load();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('tries again after a failed load', async () => {
    const failure = new Error('offline');
    const load = jest.fn().mockRejectedValueOnce(failure).mockImplementation(markdownModules);
    const adapter = createReactMarkdownAdapter(load);
    await expect(adapter.load()).rejects.toBe(failure);
    await expect(adapter.load()).resolves.toMatchObject({ Markdown });
  });
});
