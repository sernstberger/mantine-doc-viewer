import React, { createContext, use, useState } from 'react';
import { render, screen } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestPdfAdapter } from '../../../test-utils/adapters';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from '../DocViewer';
import { createDocViewer, docViewerActions, type DocViewerStore } from '../doc-viewer.store';
import type { DocViewerExtension, DocViewerPageLayerProps } from '../doc-viewer.types';
import { DocViewerAdapterProvider } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import { createMarkupExtension } from '../DocViewerMarkup/markup-extension';
import { DocViewerPageControls } from '../DocViewerPageControls/DocViewerPageControls';
import { DocViewerPages } from '../DocViewerPages/DocViewerPages';
import { DocViewerRotateButton } from '../DocViewerRotateButton/DocViewerRotateButton';
import { DocViewerThumbnails } from '../DocViewerThumbnails/DocViewerThumbnails';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { DocViewerRoot } from './DocViewerRoot';

const NUM_PAGES = 6;
const pdfAdapter = createTestPdfAdapter('/worker.mjs');

function Adapters({ children }: { children: React.ReactNode }) {
  return <DocViewerAdapterProvider pdf={pdfAdapter}>{children}</DocViewerAdapterProvider>;
}

async function pagesLoaded(container: HTMLElement) {
  await waitFor(() => expect(container.querySelectorAll('.endOfContent')).toHaveLength(NUM_PAGES));
  await act(async () => {});
}

beforeEach(() => {
  getDocument.mockReset();
  mockPdf({ numPages: NUM_PAGES });
});

describe('PDF parts in a custom layout', () => {
  it('reads the session Root runs, and projects it into the store in the same act', async () => {
    const [store, actions] = createDocViewer();
    const { container } = render(
      <Adapters>
        <DocViewerRoot src="/files/report.pdf" store={store} defaultZoom={1}>
          <header>
            <DocViewerPageControls />
            <DocViewerRotateButton />
          </header>
          <DocViewerPages />
        </DocViewerRoot>
      </Adapters>
    );
    await pagesLoaded(container);
    expect(store.getState()).toMatchObject({
      type: 'pdf',
      status: 'ready',
      numPages: NUM_PAGES,
      page: 1,
      zoom: 1,
      scale: 1,
      pageLayout: 'single',
      spread: { index: 1, pages: [1] },
    });

    act(() => actions.goToPage(4));
    expect(store.getState()).toMatchObject({ page: 4, spread: { index: 4, pages: [4] } });
    expect(screen.getByText(`4 / ${NUM_PAGES}`)).toBeInTheDocument();

    const spread = store.getState().spread;
    act(() => actions.setPageLayout('two-page'));
    expect(store.getState().pageLayout).toBe('two-page');
    act(() => actions.setPageLayout('single'));
    act(() => actions.goToPage(4));
    expect(store.getState().spread).toEqual(spread);

    await userEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    expect(store.getState().rotation).toBe(90);
  });

  it('keeps search, presentation and rotation in the store, and starts them over for a new document', async () => {
    const [store, actions] = createDocViewer();
    function App() {
      const [src, setSrc] = useState('/files/report.pdf');
      return (
        <Adapters>
          <button type="button" onClick={() => setSrc('/files/other.pdf')}>
            Next
          </button>
          <DocViewer src={src} store={store} />
        </Adapters>
      );
    }
    render(<App />);
    await screen.findAllByRole('group', { name: /^Page \d of 6$/ });

    act(() => actions.openSearch('total'));
    act(() => actions.rotate());
    expect(store.getState()).toMatchObject({ searchOpened: true, rotation: 90 });
    expect(await screen.findByDisplayValue('total')).toBeInTheDocument();

    await act(async () => actions.togglePresentation());
    expect(store.getState().presenting).toBe(true);
    await act(async () => actions.togglePresentation());

    act(() => docViewerActions.updateState({ mode: 'edit-pages' }, store));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(store.getState()).toMatchObject({
      searchOpened: false,
      rotation: 0,
      presenting: false,
      mode: 'read',
    });
  });
});

describe('store owner', () => {
  const env = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = env;
  });

  class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
      return { error };
    }

    render() {
      return this.state.error ? <p>{this.state.error.message}</p> : this.props.children;
    }
  }

  const twoRoots = (store: DocViewerStore, second = true) => (
    <Boundary>
      <DocViewerRoot src="/files/a.png" store={store}>
        {null}
      </DocViewerRoot>
      {second && (
        <DocViewerRoot src="/files/b.png" store={store}>
          {null}
        </DocViewerRoot>
      )}
    </Boundary>
  );

  it('throws in development when two mounted Roots share one store', () => {
    process.env.NODE_ENV = 'development';
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const [store] = createDocViewer();
    render(twoRoots(store));
    expect(screen.getByText(/One store is passed to two DocViewer.Root/)).toBeInTheDocument();
    error.mockRestore();
  });

  it('lets a store move to a new Root, and does not check outside development', () => {
    const [store] = createDocViewer();
    const { rerender, unmount } = render(twoRoots(store));
    rerender(twoRoots(store, false));
    unmount();

    process.env.NODE_ENV = 'development';
    const view = render(twoRoots(store, false));
    view.unmount();
    render(twoRoots(store, false));
    expect(screen.queryByText(/One store/)).not.toBeInTheDocument();
  });
});

const SetupContext = createContext('none');

function TestSetup({ children }: { children: React.ReactNode }) {
  return <SetupContext value="from setup">{children}</SetupContext>;
}

function TestBar() {
  return <div data-testid="test-bar">{use(SetupContext)}</div>;
}

function TestControl() {
  return (
    <button type="button" data-testid="test-control">
      Extra
    </button>
  );
}

const layerProps: DocViewerPageLayerProps[] = [];
function TestLayer(props: DocViewerPageLayerProps) {
  layerProps.push(props);
  return <span data-testid={`layer-${props.page}`} />;
}

function TestAction({ page }: { page: number }) {
  return <span data-testid={`action-${page}`} />;
}

function TestScreen() {
  return <div data-testid="test-screen">Screen</div>;
}

const testExtension: DocViewerExtension = {
  name: 'test',
  options: {},
  setup: TestSetup,
  bar: TestBar,
  toolbarControls: [{ control: 'markup', after: 'zoom', Component: TestControl }],
  pageLayer: TestLayer,
  thumbnail: { action: TestAction },
  screen: { mode: 'test-mode', Component: TestScreen },
};

const bareExtension: DocViewerExtension = { name: 'bare', options: {} };

describe('extension slots', () => {
  it('mounts the setup around the content and renders every slot', async () => {
    const [store] = createDocViewer();
    const view = (extensions: DocViewerExtension[]) => (
      <Adapters>
        <DocViewer
          src="/files/report.pdf"
          store={store}
          defaultThumbnailsOpened
          defaultZoom={1}
          extensions={extensions}
        />
      </Adapters>
    );
    const { container, rerender } = render(view([bareExtension, testExtension]));
    await pagesLoaded(container);

    expect(screen.getByTestId('test-bar')).toHaveTextContent('from setup');
    const controls = [...container.querySelectorAll('[data-doc-viewer-toolbar] button')];
    const index = (label: string) =>
      controls.findIndex((button) => button.getAttribute('aria-label') === label);
    const control = controls.indexOf(screen.getByTestId('test-control'));
    expect(control).toBeGreaterThan(index('Zoom in'));
    expect(control).toBe(index('Rotate') - 1);
    expect(screen.getAllByTestId(/^layer-/)).toHaveLength(NUM_PAGES);
    expect(screen.getAllByTestId(/^action-/)).toHaveLength(NUM_PAGES);
    expect(layerProps.at(-1)).toMatchObject({ numPages: NUM_PAGES, scale: 1, rotation: 0 });

    act(() => docViewerActions.updateState({ mode: 'test-mode' }, store));
    expect(screen.getByTestId('test-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('test-bar')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    await act(async () => docViewerActions.updateState({ mode: 'read' }, store));
    await pagesLoaded(container);

    rerender(<>{view([bareExtension])}</>);
    await act(async () => {});
    expect(screen.queryByTestId('test-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('layer-1')).not.toBeInTheDocument();
  });
});

describe('render counts', () => {
  const countPageRenders = () => jest.fn((_info: { page: number }) => null);

  it('renders no page and no unrelated subscriber when the store page changes', async () => {
    const [store, actions] = createDocViewer();
    const renderPageOverlay = countPageRenders();
    const zoomRenders = jest.fn();
    function ZoomProbe() {
      zoomRenders(useDocViewerState(store, (state) => state.zoom));
      return null;
    }
    const { container } = render(
      <Adapters>
        <DocViewer
          src="/files/report.pdf"
          store={store}
          defaultZoom={1}
          pagesProps={{ renderPageOverlay }}
        >
          <DocViewerThumbnails />
          <DocViewerPages />
          <ZoomProbe />
        </DocViewer>
      </Adapters>
    );
    await pagesLoaded(container);

    const pages = renderPageOverlay.mock.calls.length;
    const zooms = zoomRenders.mock.calls.length;
    act(() => actions.goToPage(3));
    act(() => actions.goToPage(5));
    await act(async () => {});
    expect(store.getState().page).toBe(5);
    expect(renderPageOverlay.mock.calls.length).toBe(pages);
    expect(zoomRenders.mock.calls.length).toBe(zooms);

    act(() => actions.setZoom(2));
    expect(zoomRenders).toHaveBeenLastCalledWith(2);
    await act(async () => {});
  });

  it('renders no page for a new markup extension object with equal options', async () => {
    const renderPageOverlay = countPageRenders();
    function App() {
      const [count, setCount] = useState(0);
      return (
        <Adapters>
          <button type="button" onClick={() => setCount(count + 1)}>
            Render {count}
          </button>
          <DocViewer
            src="/files/report.pdf"
            defaultZoom={1}
            pagesProps={{ renderPageOverlay }}
            extensions={[createMarkupExtension({ color: 'red', onChange: () => {} })]}
          />
        </Adapters>
      );
    }
    const { container } = render(<App />);
    await pagesLoaded(container);

    const before = renderPageOverlay.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Render 0' }));
    await userEvent.click(screen.getByRole('button', { name: 'Render 1' }));
    await act(async () => {});
    expect(renderPageOverlay.mock.calls.length).toBe(before);
  });
});
