import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { installIntersectionObserver } from '../../../../test-utils/intersection-observer';
import { useNearViewport } from '../../hooks/pdf/use-near-viewport';

let io: ReturnType<typeof installIntersectionObserver>;

beforeEach(() => {
  io = installIntersectionObserver();
});

afterEach(() => io.uninstall());

function Probe({ id, root, margin }: { id: string; root: HTMLElement | null; margin?: string }) {
  const { ref, near } = useNearViewport<HTMLDivElement>(root, margin);
  return <div ref={ref} data-testid={id} data-near={near} />;
}

describe('useNearViewport sharing observers', () => {
  it('watches every element with one observer per root and margin', () => {
    const root = document.createElement('div');
    const view = render(
      <>
        <Probe id="a" root={root} />
        <Probe id="b" root={root} />
        <Probe id="c" root={root} margin="100% 0px" />
        <Probe id="d" root={null} />
      </>
    );
    expect(io.observers).toHaveLength(3);
    const shared = io.observers.find((observer) => observer.elements.size === 2)!;
    expect(shared.options).toEqual({ root, rootMargin: '200% 0px' });

    // Each element hears only about itself
    act(() => io.setIntersecting(screen.getByTestId('b'), true));
    expect(screen.getByTestId('a')).toHaveAttribute('data-near', 'false');
    expect(screen.getByTestId('b')).toHaveAttribute('data-near', 'true');

    // The observer stays while an element uses it, and goes with the last one
    view.rerender(
      <>
        <Probe id="a" root={root} />
        <Probe id="c" root={root} margin="100% 0px" />
      </>
    );
    expect(io.observers).toHaveLength(2);
    expect(shared.elements.size).toBe(1);
    view.unmount();
    expect(io.observers).toHaveLength(0);
  });
});
