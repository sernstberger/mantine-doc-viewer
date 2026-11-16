import { act, render } from '@testing-library/react';
import { createPageScaleStore, usePageScale, usePageScaleStore } from './use-page-scale';

interface PageProps {
  store: ReturnType<typeof createPageScaleStore>;
  active: boolean;
  onRender: (scale: number) => void;
}

function Page({ store, active, onRender }: PageProps) {
  onRender(usePageScale(store, active));
  return null;
}

describe('usePageScale', () => {
  it('renders an active page again when the scale changes', () => {
    const store = createPageScaleStore(1);
    const onRender = jest.fn();
    render(<Page store={store} active onRender={onRender} />);
    expect(onRender).toHaveBeenLastCalledWith(1);

    act(() => store.set(2));
    expect(onRender).toHaveBeenLastCalledWith(2);
  });

  it('leaves a page that is not active alone', () => {
    const store = createPageScaleStore(1);
    const onRender = jest.fn();
    render(<Page store={store} active={false} onRender={onRender} />);
    const renders = onRender.mock.calls.length;

    act(() => store.set(2));
    expect(onRender).toHaveBeenLastCalledWith(0);
    expect(onRender).toHaveBeenCalledTimes(renders);
  });

  it('does not notify for the same scale', () => {
    const store = createPageScaleStore(1);
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    store.set(1);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
    store.set(3);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('usePageScaleStore', () => {
  it('follows the scale it is given', () => {
    let store!: ReturnType<typeof createPageScaleStore>;
    function List({ scale }: { scale: number }) {
      store = usePageScaleStore(scale);
      return null;
    }
    const view = render(<List scale={1} />);
    expect(store.get()).toBe(1);

    view.rerender(<List scale={1.5} />);
    expect(store.get()).toBe(1.5);
  });
});
