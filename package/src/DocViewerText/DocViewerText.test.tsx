import React from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { createDocViewer } from '../doc-viewer.store';
import { DocViewer } from '../DocViewer';
import { DocViewerRoot } from '../DocViewerRoot/DocViewerRoot';
import {
  DocViewerText,
  type DocViewerTextProps,
  type DocViewerTextStylesNames,
} from './DocViewerText';

const TestContainer = createContextContainer(DocViewerText, DocViewerRoot, {
  src: '/files/notes.txt',
});

function capturePrints() {
  const printed: string[] = [];
  const append = document.body.append.bind(document.body);
  jest.spyOn(document.body, 'append').mockImplementation((...nodes: (Node | string)[]) => {
    nodes.forEach((node) => {
      if (node instanceof HTMLIFrameElement) {
        printed.push(node.srcdoc);
        Object.defineProperty(node, 'contentWindow', {
          value: { addEventListener: jest.fn(), focus: jest.fn(), print: jest.fn() },
        });
        node.onload?.(new Event('load'));
      } else {
        append(node);
      }
    });
  });
  return printed;
}

beforeEach(() => {
  mockFetch('first line\nsecond line');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('@mantine/doc-viewer/DocViewerText', () => {
  describe('while the file loads', () => {
    beforeEach(() => {
      window.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    });

    tests.itSupportsSystemProps<DocViewerTextProps, DocViewerTextStylesNames>({
      component: TestContainer,
      props: {},
      refType: HTMLDivElement,
      displayName: 'mantine-doc-viewer/DocViewerText',
      stylesApiSelectors: ['body', 'empty'],
      stylesApiName: 'DocViewer',
      compound: true,
      providerStylesApi: false,
      selector: '.mantine-DocViewer-body',
      size: false,
      variant: false,
    });

    tests.itThrowsContextError({
      component: DocViewerText,
      props: {},
      error: 'DocViewer.Root component was not found in the tree',
    });
  });

  it('applies the Styles API to the text once it has loaded', async () => {
    render(
      <TestContainer classNames={{ text: 'custom-text' }} styles={{ text: { color: 'red' } }} />
    );
    const text = await screen.findByText(/first line/);
    expect(text).toHaveClass('custom-text');
    expect(text).toHaveStyle({ color: 'red' });
  });

  it('shows plain text and toggles line wrapping through the store', async () => {
    const [store] = createDocViewer();
    const fetch = mockFetch('first line\nsecond line');
    render(
      <DocViewerRoot src="/files/notes.txt" store={store}>
        <DocViewerText />
      </DocViewerRoot>
    );

    const text = await screen.findByText(/first line/);
    expect(fetch).toHaveBeenCalledWith('/files/notes.txt', expect.anything());
    expect(text).toHaveAttribute('data-wrap', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Wrap lines' }));
    expect(text).not.toHaveAttribute('data-wrap');
    expect(store.getState().textWrap).toBe(false);

    act(() => store.setState({ ...store.getState(), textWrap: true }));
    expect(text).toHaveAttribute('data-wrap', 'true');
  });

  it('refuses files over the maxSize prop, and over maxSize of the simple component', async () => {
    mockFetch('', { headers: { 'content-length': '5000' } });
    const { unmount } = render(<TestContainer maxSize={1000} />);
    expect(
      await screen.findByText('This file is too large to preview (4.9 KB)')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download file' })).toBeInTheDocument();
    unmount();

    mockFetch('', { headers: { 'content-length': '5000' } });
    render(<DocViewer src="/files/notes.txt" textProps={{ maxSize: 1000 }} />);
    expect(
      await screen.findByText('This file is too large to preview (4.9 KB)')
    ).toBeInTheDocument();
  });

  it('refuses files over 2 MB by default', async () => {
    mockFetch('', { headers: { 'content-length': String(3 * 1024 * 1024) } });
    render(<TestContainer />);
    expect(
      await screen.findByText('This file is too large to preview (3.0 MB)')
    ).toBeInTheDocument();
  });

  it('stops reading once the file passes maxSize, without content-length', async () => {
    const fetch = mockFetch('x'.repeat(10_000), { chunkSize: 1000 });
    render(<TestContainer maxSize={2500} />);

    expect(await screen.findByText(/too large to preview \(2.9 KB\)/)).toBeInTheDocument();
    const response = await (fetch.mock.results[0].value as Promise<{ read: jest.Mock }>);
    expect(response.read).toHaveBeenCalledTimes(3);
  });

  it('decodes text with the charset the server names', async () => {
    mockFetch('', {
      bytes: new Uint8Array([0x63, 0x61, 0x66, 0xe9]),
      headers: { 'content-type': 'text/plain; charset=windows-1252' },
    });
    render(<TestContainer />);
    expect(await screen.findByText('café')).toBeInTheDocument();
  });

  it('reports files that cannot be loaded as an alert and to onDocumentError', async () => {
    mockFetch('', { status: 500 });
    const onDocumentError = jest.fn();
    const [store] = createDocViewer();
    render(
      <DocViewerRoot src="/files/notes.txt" store={store} onDocumentError={onDocumentError}>
        <DocViewerText />
      </DocViewerRoot>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('This file could not be loaded');
    expect(onDocumentError).toHaveBeenCalledWith(expect.any(Error));
    expect(store.getState().status).toBe('error');
  });

  it('reports a file that is too large to onDocumentError', async () => {
    mockFetch('', { headers: { 'content-length': '5000' } });
    const onDocumentError = jest.fn();
    render(
      <DocViewerRoot src="/files/notes.txt" onDocumentError={onDocumentError}>
        <DocViewerText maxSize={100} />
      </DocViewerRoot>
    );

    await screen.findByText(/too large to preview/);
    expect(onDocumentError).toHaveBeenCalledWith(
      new Error('File is larger than maxTextSize: 5000 bytes')
    );
  });

  it('reports the load with its size and the mimeType of the document or the server', async () => {
    mockFetch('hello', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    const onDocumentLoad = jest.fn();
    const { unmount } = render(
      <DocViewerRoot src="/files/notes.txt" onDocumentLoad={onDocumentLoad}>
        <DocViewerText />
      </DocViewerRoot>
    );
    await screen.findByText('hello');
    expect(onDocumentLoad).toHaveBeenCalledWith({
      type: 'text',
      byteSize: 5,
      mimeType: 'text/plain',
    });
    unmount();

    mockFetch('hello', { headers: { 'content-type': 'text/plain' } });
    render(
      <DocViewerRoot src="/files/notes" mimeType="text/x-notes" onDocumentLoad={onDocumentLoad}>
        <DocViewerText />
      </DocViewerRoot>
    );
    await screen.findByText('hello');
    expect(onDocumentLoad).toHaveBeenLastCalledWith({
      type: 'text',
      byteSize: 5,
      mimeType: 'text/x-notes',
    });
  });

  it('hides the wrap control when the toolbar controls are off', async () => {
    render(<DocViewer src="/files/notes.txt" toolbarControls={{ wrap: false }} />);
    await screen.findByText(/first line/);
    expect(screen.queryByRole('button', { name: 'Wrap lines' })).not.toBeInTheDocument();
  });

  it('prints nothing while loading, and the text once it has loaded', async () => {
    const printed = capturePrints();
    const [store, actions] = createDocViewer();
    window.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const { unmount } = render(
      <DocViewerRoot src="/files/notes.txt" store={store}>
        <DocViewerText />
      </DocViewerRoot>
    );
    await act(async () => {
      await actions.print();
    });
    expect(printed).toEqual([]);
    unmount();

    mockFetch('hello');
    const loaded = createDocViewer();
    render(
      <DocViewerRoot src="/files/notes.txt" store={loaded[0]}>
        <DocViewerText />
      </DocViewerRoot>
    );
    await screen.findByText('hello');
    expect(loaded[0].getState().canPrint).toBe(true);
    await act(async () => {
      await loaded[1].print();
    });
    expect(printed).toHaveLength(1);
    expect(printed[0]).toContain('<pre>hello</pre>');
  });

  describe('accessibility', () => {
    it('makes the loaded text a named, focusable region', async () => {
      render(<TestContainer />);
      await screen.findByText(/first line/);
      expect(screen.getByRole('region', { name: 'notes.txt' })).toHaveAttribute('tabindex', '0');
    });

    it('has no axe violations', async () => {
      const { container } = render(<TestContainer />);
      await screen.findByText(/first line/);
      expect((await axe(container)).violations).toEqual([]);
    });
  });
});
