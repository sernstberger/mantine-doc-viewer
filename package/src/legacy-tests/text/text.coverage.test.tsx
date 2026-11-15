import {
  resetMarkdownImport,
  setMarkdownImport,
} from '../../../../test-utils/import-markdown.mock';
import { render, screen } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockFetch } from '../../../../test-utils/mock-fetch';
import { DocViewer, type DocViewerController } from '../../../../test-utils/render-legacy';
import { getMarkdownPrintSource } from '../../DocViewerMarkdown/MarkdownView';
import {
  createMarkdownComponents,
  scrollToHeading,
} from '../../DocViewerMarkdown/markdown-components';
import { getText, resolveMarkdownUrl } from '../../utils/markdown-utils';
import { decodeText } from '../../hooks/text/use-doc-viewer-text';

afterEach(() => {
  jest.restoreAllMocks();
});

/** Replaces the hidden print iframe by a fake that records what would be printed */
function capturePrints() {
  const printed: string[] = [];
  const append = document.body.append.bind(document.body);
  jest.spyOn(document.body, 'append').mockImplementation((...nodes: any[]) => {
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

type MarkdownModuleOverride = Record<string, unknown> | Error | Promise<unknown>;

/** Makes the markdown module load as given: a module, a failure, or a promise (for one that never loads) */
function overrideMarkdownModule(module: MarkdownModuleOverride) {
  setMarkdownImport(() =>
    module instanceof Error
      ? Promise.reject(module)
      : module instanceof Promise
        ? module
        : Promise.resolve(module)
  );
}

afterEach(() => resetMarkdownImport());

const neverResolves = () => {
  window.fetch = jest.fn(() => new Promise(() => {})) as any;
};

function renderWithController(
  ui: (ref: React.RefObject<DocViewerController | null>) => React.ReactNode
) {
  const ref = React.createRef<DocViewerController>();
  const result = render(<>{ui(ref)}</>);
  return { ref, ...result };
}

describe('print while loading and when ready', () => {
  it('prints nothing for text, code and markdown that are still loading', async () => {
    const printed = capturePrints();
    neverResolves();

    for (const src of ['/a.txt', '/a.ts', '/a.md']) {
      const { ref, unmount } = renderWithController((r) => (
        <DocViewer src={src} controllerRef={r} />
      ));
      // The code and markdown views load on demand first
      await act(async () => {});
      await act(async () => {
        await ref.current!.print();
      });
      unmount();
    }

    expect(printed).toEqual([]);
  });

  it('prints the text and code that were loaded', async () => {
    const printed = capturePrints();

    for (const src of ['/a.txt', '/a.ts']) {
      mockFetch('hello');
      const { ref, unmount } = renderWithController((r) => (
        <DocViewer src={src} controllerRef={r} />
      ));
      await screen.findByText('hello');
      await act(async () => {
        await ref.current!.print();
      });
      unmount();
    }

    expect(printed).toHaveLength(2);
    expect(printed[0]).toContain('<pre>hello</pre>');
  });

  it('prints rendered markdown in preview and its source in source mode', async () => {
    const printed = capturePrints();
    mockFetch('# Title');
    const { ref } = renderWithController((r) => <DocViewer src="/a.md" controllerRef={r} />);
    await screen.findByTestId('markdown');

    await act(async () => {
      await ref.current!.print();
    });
    expect(printed).toHaveLength(1);
    expect(printed[0]).toContain('data-testid="markdown"');

    await userEvent.click(screen.getByRole('radio', { name: 'Source' }));
    await act(async () => {
      await ref.current!.print();
    });
    expect(printed).toHaveLength(2);
    expect(printed[1]).toContain('<pre># Title</pre>');
  });

  it('prints the source while the markdown module is still loading', async () => {
    const printed = capturePrints();
    let resolveModule: (value: any) => void = () => {};
    overrideMarkdownModule(
      new Promise((resolve) => {
        resolveModule = resolve;
      })
    );
    mockFetch('# Late');
    const { ref } = renderWithController((r) => <DocViewer src="/a.md" controllerRef={r} />);
    await screen.findByRole('radio', { name: 'Preview' });

    await act(async () => {
      await ref.current!.print();
    });
    expect(printed[0]).toContain('<pre># Late</pre>');
    await act(async () =>
      resolveModule({
        Markdown: () => null,
        remarkGfm: () => {},
        defaultUrlTransform: (u: string) => u,
      })
    );
  });
});

describe('getMarkdownPrintSource', () => {
  it('chooses what to print', () => {
    expect(getMarkdownPrintSource('preview', '<p>x</p>', 't')).toEqual({ html: '<p>x</p>' });
    expect(getMarkdownPrintSource('preview', undefined, 't')).toEqual({ text: 't' });
    expect(getMarkdownPrintSource('source', '<p>x</p>', 't')).toEqual({ text: 't' });
    expect(getMarkdownPrintSource('source', undefined, null)).toBeNull();
  });
});

describe('markdown module', () => {
  it('shows an error with a download link when the module fails to load', async () => {
    overrideMarkdownModule(new Error('chunk failed'));
    mockFetch('# Title');
    render(<DocViewer src="/a.md" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/markdown/i);
    expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
  });

  it('ignores a module that loads or fails after the view is gone', async () => {
    let resolveModule: (value: any) => void = () => {};
    let rejectModule: (reason: unknown) => void = () => {};

    for (const settle of ['resolve', 'reject']) {
      overrideMarkdownModule(
        new Promise((resolve, reject) => {
          resolveModule = resolve;
          rejectModule = reject;
        })
      );
      mockFetch('# Title');
      const { unmount } = render(<DocViewer src="/a.md" />);
      await screen.findByRole('radio', { name: 'Preview' });
      unmount();
      await act(async () => {
        if (settle === 'resolve') {
          resolveModule({});
        } else {
          rejectModule(new Error('late'));
        }
      });
      jest.restoreAllMocks();
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
    render(<DocViewer src="https://example.com/docs/readme.md" />);
    await screen.findByTestId('markdown');

    expect(props.urlTransform('img/a.png')).toBe('safe:https://example.com/docs/img/a.png');

    // Hash links are handled before the heading exists and when it does
    const { a: Link } = props.components;
    render(<Link href="#intro">Intro</Link>);
    await userEvent.click(screen.getByRole('link', { name: 'Intro' }));
  });
});

describe('markdown-utils and markdown-components', () => {
  it('keeps the url when it cannot be resolved', () => {
    expect(resolveMarkdownUrl('a.png', 'file.md', 'not a url')).toBe('a.png');
  });

  it('highlights fenced code without a language as text', () => {
    const { pre: Pre } = createMarkdownComponents({ opensInNewTab: '', onHashLink: jest.fn() });
    const node = {
      type: 'element',
      tagName: 'pre',
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {},
          children: [{ type: 'text', value: 'plain\n' }],
        },
      ],
    };
    render(<Pre node={node}>x</Pre>);
    expect(screen.getByText('plain')).toBeInTheDocument();
  });

  it('reads text nodes without a value as empty', () => {
    expect(getText({ type: 'text' })).toBe('');
    expect(getText({ type: 'element' })).toBe('');
  });

  it('does nothing when there is no heading or no scroll container', () => {
    const root = document.createElement('div');
    expect(scrollToHeading(root, 'missing')).toBe(false);
  });
});

describe('use-doc-viewer-text', () => {
  function responseWithoutBody(bytes: Uint8Array, headers: Record<string, string> = {}) {
    window.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(headers),
        body: null,
        arrayBuffer: () => Promise.resolve(bytes.buffer),
      })
    ) as any;
  }

  it('reads the whole response when there is no body reader', async () => {
    responseWithoutBody(new TextEncoder().encode('no reader'));
    render(<DocViewer src="/a.txt" />);
    expect(await screen.findByText('no reader')).toBeInTheDocument();
  });

  it('refuses a response without a body reader that is too large', async () => {
    responseWithoutBody(new Uint8Array(3000));
    render(<DocViewer src="/a.txt" maxTextSize={2000} />);
    expect(await screen.findByText(/too large to preview/)).toBeInTheDocument();
  });

  it('falls back to UTF-8 for a charset the browser does not know', () => {
    const bytes = new TextEncoder().encode('café');
    expect(decodeText(bytes, 'text/plain; charset=nonsense-9')).toBe('café');
    expect(decodeText(bytes, 'text/plain')).toBe('café');
    expect(decodeText(bytes, null)).toBe('café');
    expect(decodeText(bytes, 'text/plain; charset="utf-8"')).toBe('café');
  });

  it('ignores results that arrive after unmounting', async () => {
    let finish: (value: any) => void = () => {};
    window.fetch = jest.fn(() => new Promise((resolve) => (finish = resolve))) as any;
    const { unmount } = render(<DocViewer src="/a.txt" />);
    unmount();
    await act(async () => {
      finish({ ok: true, status: 200, headers: new Headers(), body: null });
    });

    let fail: (reason: unknown) => void = () => {};
    window.fetch = jest.fn(() => new Promise((_, reject) => (fail = reject))) as any;
    const second = render(<DocViewer src="/b.txt" />);
    second.unmount();
    await act(async () => fail(new Error('aborted')));
  });

  it('reports a failed request', async () => {
    window.fetch = jest.fn(() => Promise.reject(new Error('offline'))) as any;
    const onDocumentError = jest.fn();
    render(<DocViewer src="/a.txt" onDocumentError={onDocumentError} />);
    await waitFor(() => expect(onDocumentError).toHaveBeenCalledWith(expect.any(Error)));
  });
});

describe('toolbar controls', () => {
  it('hides the wrap and view mode controls when asked to', async () => {
    mockFetch('{"key":"hello"}');
    const { rerender } = render(
      <DocViewer src="/a.json" toolbarControls={{ viewMode: false, wrap: false }} />
    );
    await screen.findByText(/hello/);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    mockFetch('text');
    rerender(<DocViewer src="/a.txt" toolbarControls={{ wrap: false }} />);
    await screen.findByText('text');
    expect(screen.queryByRole('button', { name: 'Wrap lines' })).not.toBeInTheDocument();

    mockFetch('# md');
    rerender(<DocViewer src="/a.md" toolbarControls={{ viewMode: false }} />);
    await screen.findByTestId('markdown');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('falls back to plain text for code in an unknown language', async () => {
    mockFetch('some code');
    render(<DocViewer src="/data" type="code" />);
    expect(await screen.findByText(/some code/)).toBeInTheDocument();
  });

  it('shows JSON as code when the language is set', async () => {
    mockFetch('{"a":1}');
    render(<DocViewer src="/data.txt" type="code" language="json" />);
    expect(await screen.findByRole('radio', { name: 'Tree' })).toBeInTheDocument();
  });
});

describe('markdown renders', () => {
  it('does not parse the markdown again when the viewer renders for something else', async () => {
    mockFetch('# Title');
    const Markdown = jest.fn(({ children }: { children: string }) => <div>{children}</div>);
    overrideMarkdownModule({
      Markdown,
      remarkGfm: () => {},
      defaultUrlTransform: (url: string) => url,
    });
    function App() {
      const [count, setCount] = React.useState(0);
      return (
        <>
          <button type="button" onClick={() => setCount(count + 1)}>
            Render {count}
          </button>
          <DocViewer src="/a.md" labels={{ previewLabel: 'Preview' }} />
        </>
      );
    }
    render(<App />);
    expect(await screen.findByText('# Title')).toBeInTheDocument();
    const parsed = Markdown.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Render 0' }));
    await userEvent.click(screen.getByRole('button', { name: 'Render 1' }));
    expect(Markdown.mock.calls.length).toBe(parsed);
  });
});
