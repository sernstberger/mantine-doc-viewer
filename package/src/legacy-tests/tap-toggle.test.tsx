import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import React from 'react';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';

interface PointerOptions {
  pointerType?: string;
  pointerId?: number;
  isPrimary?: boolean;
  x?: number;
  time?: number;
}

function pointer(target: Element, type: string, options: PointerOptions = {}) {
  const { pointerType = 'touch', pointerId = 1, isPrimary = true, x = 100, time = 1000 } = options;
  const event = new PointerEvent(type, {
    bubbles: true,
    pointerType,
    pointerId,
    isPrimary,
    clientX: x,
    clientY: 50,
  });
  Object.defineProperty(event, 'timeStamp', { value: time });
  act(() => {
    target.dispatchEvent(event);
  });
}

function tap(target: Element, up: PointerOptions = {}, down: PointerOptions = {}) {
  pointer(target, 'pointerdown', down);
  pointer(target, 'pointerup', up);
}

const toolbar = () => screen.getByRole('toolbar', { hidden: true }).parentElement!;

async function setup(props: { tapToggleToolbar?: boolean } = { tapToggleToolbar: true }) {
  mockFetch('Release notes');
  render(<DocViewer src="/files/readme.txt" {...props} />);
  // Wait for the text to load, so its state update lands inside the test
  await screen.findByText('Release notes');
  return screen.getByRole('toolbar', { hidden: true }).parentElement!.parentElement!;
}

describe('tapToggleToolbar', () => {
  it('hides and shows the toolbar when a finger taps the viewer', async () => {
    const root = await setup();
    expect(toolbar()).not.toHaveAttribute('data-hidden');

    tap(root);
    expect(toolbar()).toHaveAttribute('data-hidden', 'true');

    tap(root);
    expect(toolbar()).not.toHaveAttribute('data-hidden');
  });

  it('does nothing without the prop', async () => {
    const root = await setup({});
    tap(root);
    expect(toolbar()).not.toHaveAttribute('data-hidden');
  });

  it('ignores mouse clicks and a second finger', async () => {
    const root = await setup();
    tap(root, { pointerType: 'mouse' }, { pointerType: 'mouse' });
    tap(root, {}, { isPrimary: false });
    expect(toolbar()).not.toHaveAttribute('data-hidden');
  });

  it('ignores drags, long presses and taps that end on another pointer', async () => {
    const root = await setup();
    tap(root, { x: 160 });
    tap(root, { time: 1900 });
    tap(root, { pointerId: 2 });
    pointer(root, 'pointerup');
    expect(toolbar()).not.toHaveAttribute('data-hidden');
  });

  it('ignores a tap that scrolling cancelled', async () => {
    const root = await setup();
    pointer(root, 'pointerdown');
    pointer(root, 'pointercancel');
    pointer(root, 'pointerup');
    expect(toolbar()).not.toHaveAttribute('data-hidden');
  });

  it('ignores taps on buttons and the toolbar', async () => {
    await setup();
    tap(screen.getByRole('link', { name: 'Download' }));
    tap(screen.getByText('readme.txt'));
    expect(toolbar()).not.toHaveAttribute('data-hidden');
  });
});
