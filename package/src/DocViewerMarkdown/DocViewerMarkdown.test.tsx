import React from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { testMarkdownAdapter } from '../../../test-utils/adapters';
import { resetMarkdownImport, setMarkdownImport } from '../../../test-utils/import-markdown.mock';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { createDocViewer } from '../doc-viewer.store';
import { DocViewer } from '../DocViewer';
import { DocViewerAdapterProvider } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import { DocViewerToolbar } from '../DocViewerToolbar/DocViewerToolbar';
import { DocViewerRoot, type DocViewerRootProps } from '../DocViewerRoot/DocViewerRoot';
import {
  DocViewerMarkdown,
  type DocViewerMarkdownProps,
  type DocViewerMarkdownStylesNames,
} from './DocViewerMarkdown';

function Wrapper({ children, ...props }: Partial<DocViewerRootProps>) {
  return (
    <DocViewerAdapterProvider markdown={testMarkdownAdapter}>
      <DocViewerRoot src="/docs/CHANGELOG.md" {...props}>
        {children}
      </DocViewerRoot>
    </DocViewerAdapterProvider>
  );
}

const TestContainer = createContextContainer(DocViewerMarkdown, Wrapper);

/** The part with the toolbar the default layout gives it */
function Viewer(props: DocViewerMarkdownProps) {
  return (
    <Wrapper>
      <DocViewerToolbar />
      <DocViewerMarkdown {...props} />
    </Wrapper>
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

function overrideMarkdownModule(module: Record<string, unknown> | Error | Promise<unknown>) {
  setMarkdownImport(() =>
    module instanceof Error
      ? Promise.reject(module)
      : module instanceof Promise
        ? module
        : Promise.resolve(module)
  );
}

const markdownModule = {
  Markdown: () => null,
  remarkGfm: () => {},
  defaultUrlTransform: (url: string) => url,
};

beforeAll(async () => {
  mockFetch('loaded');
  const { unmount } = render(<Viewer />);
  await screen.findByTestId('markdown');
  unmount();
});

beforeEach(() => {
  mockFetch('# Release notes\n\n- Thumbnails');
});

afterEach(() => {
  resetMarkdownImport();
  jest.restoreAllMocks();
});

describe('@mantine/doc-viewer/DocViewerMarkdown', () => {
  describe('while the file loads', () => {
    beforeEach(() => {
      window.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    });

    tests.itSupportsSystemProps<DocViewerMarkdownProps, DocViewerMarkdownStylesNames>({
      component: TestContainer,
      props: {},
      refType: HTMLDivElement,
      displayName: 'mantine-doc-viewer/DocViewerMarkdown',
      stylesApiSelectors: ['body', 'empty'],
      stylesApiName: 'DocViewer',
      compound: true,
      providerStylesApi: false,
      selector: '.mantine-DocViewer-body',
      size: false,
      variant: false,
    });

    tests.itThrowsContextError({
      component: DocViewerMarkdown,
      props: {},
      error: 'DocViewer.Root component was not found in the tree',
    });
  });

  it('applies the Styles API to the rendered markdown and to the source', async () => {
    render(
      <Viewer
        classNames={{ markdown: 'custom-markdown', code: 'custom-code' }}
        styles={{ markdown: { color: 'red' } }}
      />
    );
    const markdown = await screen.findByTestId('markdown');
    expect(markdown.parentElement).toHaveClass('custom-markdown');
    expect(markdown.parentElement).toHaveStyle({ color: 'red' });

    await userEvent.click(screen.getByRole('radio', { name: 'Source' }));
    expect(document.querySelector('.custom-code')).toBeInTheDocument();
  });

  it('previews markdown and switches to the source through the store', async () => {
    const [store] = createDocViewer();
    render(
      <Wrapper store={store}>
        <DocViewerToolbar />
        <DocViewerMarkdown />
      </Wrapper>
    );

    expect(await screen.findByTestId('markdown')).toHaveTextContent('# Release notes');
    expect(screen.getByRole('radio', { name: 'Preview' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Source' }));
    expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
    expect(screen.getByText(/Release notes/)).toBeInTheDocument();
    expect(store.getState().viewMode).toBe('source');

    act(() => store.setState({ ...store.getState(), viewMode: 'preview' }));
    expect(await screen.findByTestId('markdown')).toBeInTheDocument();
  });

  it('passes codeHighlightProps to the source, from the part and from the simple component', async () => {
    const { unmount } = render(<Viewer codeHighlightProps={{ className: 'highlight' }} />);
    await screen.findByTestId('markdown');
    await userEvent.click(screen.getByRole('radio', { name: 'Source' }));
    expect(document.querySelector('.highlight')).toBeInTheDocument();
    unmount();

    render(
      <DocViewerAdapterProvider markdown={testMarkdownAdapter}>
        <DocViewer
          src="/docs/CHANGELOG.md"
          textProps={{ codeHighlightProps: { className: 'layout' } }}
        />
      </DocViewerAdapterProvider>
    );
    await screen.findByTestId('markdown');
    await userEvent.click(screen.getByRole('radio', { name: 'Source' }));
    expect(document.querySelector('.layout')).toBeInTheDocument();
  });

  it('refuses files over the maxSize prop', async () => {
    mockFetch('', { headers: { 'content-length': '5000' } });
    render(<Viewer maxSize={1000} />);
    expect(await screen.findByText(/too large to preview/)).toBeInTheDocument();
  });

  it('shows the source through Code, with no view mode control, without a markdown adapter', async () => {
    const onDocumentLoad = jest.fn();
    render(
      <DocViewerRoot src="/docs/CHANGELOG.md" onDocumentLoad={onDocumentLoad}>
        <DocViewerMarkdown />
      </DocViewerRoot>
    );
    expect(await screen.findByText(/Release notes/)).toBeInTheDocument();
    expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(onDocumentLoad).toHaveBeenCalledWith(expect.objectContaining({ type: 'code' }));
  });

  it('hides the view mode control when the toolbar controls are off', async () => {
    render(
      <DocViewerAdapterProvider markdown={testMarkdownAdapter}>
        <DocViewer src="/a.md" toolbarControls={{ viewMode: false }} />
      </DocViewerAdapterProvider>
    );
    await screen.findByTestId('markdown');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  describe('markdown module', () => {
    it('shows an error with a download link when the module fails to load', async () => {
      overrideMarkdownModule(new Error('chunk failed'));
      render(<Viewer />);

      expect(await screen.findByRole('alert')).toHaveTextContent(/markdown/i);
      expect(screen.getByRole('link', { name: 'Download file' })).toBeInTheDocument();
      expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
    });

    it('ignores a module that loads or fails after the view is gone', async () => {
      let resolveModule: (value: unknown) => void = () => {};
      let rejectModule: (reason: unknown) => void = () => {};

      for (const settle of ['resolve', 'reject']) {
        overrideMarkdownModule(
          new Promise((resolve, reject) => {
            resolveModule = resolve;
            rejectModule = reject;
          })
        );
        const { unmount } = render(<Viewer />);
        await screen.findByRole('radio', { name: 'Preview' });
        unmount();
        await act(async () => {
          if (settle === 'resolve') {
            resolveModule(markdownModule);
          } else {
            rejectModule(new Error('late'));
          }
        });
      }
    });

    it('passes components and a url transform that resolves against the file', async () => {
      let props: any;
      overrideMarkdownModule({
        Markdown: (p: any) => {
          props = p;
          return <div data-testid="markdown">{p.children}</div>;
        },
        remarkGfm: () => {},
        defaultUrlTransform: (url: string) => `safe:${url}`,
      });
      mockFetch('# Intro\n\n[go](#intro)');
      render(
        <Wrapper src="https://example.com/docs/readme.md">
          <DocViewerToolbar />
          <DocViewerMarkdown />
        </Wrapper>
      );
      await screen.findByTestId('markdown');

      expect(props.urlTransform('img/a.png')).toBe('safe:https://example.com/docs/img/a.png');

      const { a: Link } = props.components;
      render(<Link href="#intro">Intro</Link>);
      await userEvent.click(screen.getByRole('link', { name: 'Intro' }));
    });

    it('does not parse the markdown again when the viewer renders for something else', async () => {
      const Markdown = jest.fn(({ children }: { children: string }) => <div>{children}</div>);
      overrideMarkdownModule({ ...markdownModule, Markdown });
      function App() {
        const [count, setCount] = React.useState(0);
        return (
          <>
            <button type="button" onClick={() => setCount(count + 1)}>
              Render {count}
            </button>
            <TestContainer />
          </>
        );
      }
      render(<App />);
      expect(await screen.findByText(/Release notes/)).toBeInTheDocument();
      const parsed = Markdown.mock.calls.length;
      await userEvent.click(screen.getByRole('button', { name: 'Render 0' }));
      await userEvent.click(screen.getByRole('button', { name: 'Render 1' }));
      expect(Markdown.mock.calls.length).toBe(parsed);
    });
  });

  describe('print', () => {
    it('prints nothing while the file is loading', async () => {
      const printed = capturePrints();
      window.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
      const [store, actions] = createDocViewer();
      render(
        <Wrapper store={store}>
          <DocViewerToolbar />
          <DocViewerMarkdown />
        </Wrapper>
      );
      await act(async () => {
        await actions.print();
      });
      expect(printed).toEqual([]);
    });

    it('prints rendered markdown in preview and its source in source mode', async () => {
      const printed = capturePrints();
      mockFetch('# Title');
      const [store, actions] = createDocViewer();
      render(
        <Wrapper store={store}>
          <DocViewerToolbar />
          <DocViewerMarkdown />
        </Wrapper>
      );
      await screen.findByTestId('markdown');

      await act(async () => {
        await actions.print();
      });
      expect(printed).toHaveLength(1);
      expect(printed[0]).toContain('data-testid="markdown"');

      await userEvent.click(screen.getByRole('radio', { name: 'Source' }));
      await act(async () => {
        await actions.print();
      });
      expect(printed).toHaveLength(2);
      expect(printed[1]).toContain('<pre># Title</pre>');
    });

    it('prints the source while the markdown module is still loading', async () => {
      const printed = capturePrints();
      let resolveModule: (value: unknown) => void = () => {};
      overrideMarkdownModule(
        new Promise((resolve) => {
          resolveModule = resolve;
        })
      );
      mockFetch('# Late');
      const [store, actions] = createDocViewer();
      render(
        <Wrapper store={store}>
          <DocViewerToolbar />
          <DocViewerMarkdown />
        </Wrapper>
      );
      await screen.findByRole('radio', { name: 'Preview' });

      await act(async () => {
        await actions.print();
      });
      expect(printed[0]).toContain('<pre># Late</pre>');
      await act(async () => resolveModule(markdownModule));
    });
  });

  describe('accessibility', () => {
    it('makes the loaded markdown a named, focusable region', async () => {
      render(<Viewer />);
      await screen.findByTestId('markdown');
      expect(screen.getByRole('region', { name: 'CHANGELOG.md' })).toHaveAttribute('tabindex', '0');
    });

    it('has no axe violations', async () => {
      const { container } = render(<Viewer />);
      await screen.findByTestId('markdown');
      expect((await axe(container)).violations).toEqual([]);
    });
  });
});
