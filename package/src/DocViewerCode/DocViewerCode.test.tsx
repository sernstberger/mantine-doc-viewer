import React from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { createDocViewer } from '../doc-viewer.store';
import { DocViewer } from '../DocViewer';
import { DocViewerToolbar } from '../DocViewerToolbar/DocViewerToolbar';
import { DocViewerRoot } from '../DocViewerRoot/DocViewerRoot';
import {
  DocViewerCode,
  type DocViewerCodeProps,
  type DocViewerCodeStylesNames,
} from './DocViewerCode';

const TestContainer = createContextContainer(DocViewerCode, DocViewerRoot, {
  src: '/src/answer.ts',
});

/** The part with the toolbar the default layout gives it */
function Viewer(props: DocViewerCodeProps) {
  return (
    <DocViewerRoot src="/src/answer.ts">
      <DocViewerToolbar />
      <DocViewerCode {...props} />
    </DocViewerRoot>
  );
}

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

beforeAll(async () => {
  mockFetch('loaded');
  const { unmount } = render(<Viewer />);
  await screen.findByText('loaded');
  unmount();
});

beforeEach(() => {
  mockFetch('const answer = 42;');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('@mantine/doc-viewer/DocViewerCode', () => {
  describe('while the file loads', () => {
    beforeEach(() => {
      window.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    });

    tests.itSupportsSystemProps<DocViewerCodeProps, DocViewerCodeStylesNames>({
      component: TestContainer,
      props: {},
      refType: HTMLDivElement,
      displayName: 'mantine-doc-viewer/DocViewerCode',
      stylesApiSelectors: ['body', 'empty'],
      stylesApiName: 'DocViewer',
      compound: true,
      providerStylesApi: false,
      selector: '.mantine-DocViewer-body',
      size: false,
      variant: false,
    });

    tests.itThrowsContextError({
      component: DocViewerCode,
      props: {},
      error: 'DocViewer.Root component was not found in the tree',
    });
  });

  it('applies the Styles API to the code once it has loaded', async () => {
    render(
      <TestContainer classNames={{ code: 'custom-code' }} styles={{ code: { color: 'red' } }} />
    );
    const code = (await screen.findByText(/const answer = 42;/)).closest('.custom-code');
    expect(code).toHaveStyle({ color: 'red' });
  });

  it('shows code with CodeHighlight', async () => {
    const { container } = render(<DocViewer src="/src/answer.ts" />);

    expect(await screen.findByText(/const answer = 42;/)).toBeInTheDocument();
    expect(container.querySelector('[data-doc-type="code"]')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('passes codeHighlightProps to CodeHighlight, and merges its className and style', async () => {
    render(
      <TestContainer
        codeHighlightProps={{
          className: 'highlight',
          style: { color: 'red' },
          withLineNumbers: false,
        }}
      />
    );
    const code = (await screen.findByText(/const answer = 42;/)).closest('.highlight');
    expect(code).toHaveStyle({ color: 'red' });
  });

  it('takes codeHighlightProps and language of the simple component textProps', async () => {
    mockFetch('{"a":1}');
    render(
      <DocViewer
        src="/data.txt"
        type="code"
        textProps={{ language: 'json', codeHighlightProps: { className: 'from-layout' } }}
      />
    );
    expect(await screen.findByRole('radio', { name: 'Tree' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Code' }));
    expect(document.querySelector('.from-layout')).toBeInTheDocument();
  });

  it('shows valid JSON as a tree that can be switched to code through the store', async () => {
    mockFetch('{"name":"mantine-doc-viewer","tags":["pdf","image"]}');
    const [store] = createDocViewer();
    render(
      <DocViewerRoot src="/package.json" store={store}>
        <DocViewerToolbar />
        <DocViewerCode />
      </DocViewerRoot>
    );

    expect(await screen.findByText(/mantine-doc-viewer/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Tree' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Code' }));
    expect(screen.getByText(/"tags":\["pdf","image"\]/)).toBeInTheDocument();
    expect(store.getState().viewMode).toBe('source');

    act(() => store.setState({ ...store.getState(), viewMode: 'preview' }));
    expect(screen.getByRole('radio', { name: 'Tree' })).toBeChecked();
  });

  it('shows invalid JSON as code without the tree option', async () => {
    mockFetch('{ not json');
    render(
      <DocViewerRoot src="/broken.json">
        <DocViewerToolbar />
        <DocViewerCode />
      </DocViewerRoot>
    );

    expect(await screen.findByText(/not json/)).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Tree' })).not.toBeInTheDocument();
  });

  it('uses the language prop, so JSON is a tree in any file', async () => {
    mockFetch('{"a":1}');
    render(
      <DocViewerRoot src="/data.txt" type="code">
        <DocViewerToolbar />
        <DocViewerCode language="json" />
      </DocViewerRoot>
    );
    expect(await screen.findByRole('radio', { name: 'Tree' })).toBeInTheDocument();
  });

  it('shows JSON with integers too large for JavaScript as code only', async () => {
    mockFetch('{"id": 12345678901234567890}');
    render(
      <DocViewerRoot src="/ids.json">
        <DocViewerToolbar />
        <DocViewerCode />
      </DocViewerRoot>
    );
    expect(await screen.findByText(/12345678901234567890/)).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Tree' })).not.toBeInTheDocument();
  });

  it('falls back to plain text for code in an unknown language', async () => {
    mockFetch('some code');
    render(
      <DocViewerRoot src="/data" type="code">
        <DocViewerToolbar />
        <DocViewerCode />
      </DocViewerRoot>
    );
    expect(await screen.findByText(/some code/)).toBeInTheDocument();
  });

  it('refuses files over the maxSize prop', async () => {
    mockFetch('', { headers: { 'content-length': '5000' } });
    render(<Viewer maxSize={1000} />);
    expect(await screen.findByText(/too large to preview/)).toBeInTheDocument();
  });

  it('hides the view mode control when the toolbar controls are off', async () => {
    mockFetch('{"key":"hello"}');
    render(<DocViewer src="/a.json" toolbarControls={{ viewMode: false }} />);
    await screen.findByText(/hello/);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('reports the load as code, and failures to the store', async () => {
    const onDocumentLoad = jest.fn();
    const { unmount } = render(
      <DocViewerRoot src="/src/answer.ts" onDocumentLoad={onDocumentLoad}>
        <DocViewerToolbar />
        <DocViewerCode />
      </DocViewerRoot>
    );
    await screen.findByText(/const answer/);
    expect(onDocumentLoad).toHaveBeenCalledWith({
      type: 'code',
      byteSize: 18,
      mimeType: undefined,
    });
    unmount();

    mockFetch('', { status: 500 });
    const [store] = createDocViewer();
    render(
      <DocViewerRoot src="/src/answer.ts" store={store}>
        <DocViewerToolbar />
        <DocViewerCode />
      </DocViewerRoot>
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('This file could not be loaded');
    expect(store.getState().status).toBe('error');
  });

  it('prints nothing while loading, and the code once it has loaded', async () => {
    const printed = capturePrints();
    window.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const [store, actions] = createDocViewer();
    const { unmount } = render(
      <DocViewerRoot src="/src/answer.ts" store={store}>
        <DocViewerToolbar />
        <DocViewerCode />
      </DocViewerRoot>
    );
    await act(async () => {});
    await act(async () => {
      await actions.print();
    });
    expect(printed).toEqual([]);
    unmount();

    mockFetch('hello');
    const [loadedStore, loadedActions] = createDocViewer();
    render(
      <DocViewerRoot src="/src/answer.ts" store={loadedStore}>
        <DocViewerToolbar />
        <DocViewerCode />
      </DocViewerRoot>
    );
    await screen.findByText('hello');
    await act(async () => {
      await loadedActions.print();
    });
    expect(printed).toHaveLength(1);
    expect(printed[0]).toContain('<pre>hello</pre>');
  });

  describe('accessibility', () => {
    it('makes the loaded code a named, focusable region', async () => {
      render(<Viewer />);
      await screen.findByText(/const answer/);
      expect(screen.getByRole('region', { name: 'answer.ts' })).toHaveAttribute('tabindex', '0');
    });

    it('has no axe violations', async () => {
      const { container } = render(<Viewer />);
      await screen.findByText(/const answer/);
      expect((await axe(container)).violations).toEqual([]);
    });
  });
});
