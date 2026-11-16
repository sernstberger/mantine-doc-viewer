import { act, render } from '@testing-library/react';
import { useReturnFocus } from './use-return-focus';
import { useUnlockFocus } from './use-unlock-focus';
import type { PdfDocumentState } from './use-pdf-document';

function ReturnFocus({
  active,
  withButton,
  fallback,
}: {
  active: boolean;
  withButton: boolean;
  fallback: HTMLElement | null;
}) {
  const ref = useReturnFocus(active, fallback);
  return withButton ? (
    <button type="button" ref={ref}>
      Open
    </button>
  ) : null;
}

function Locked({ status, body }: { status: PdfDocumentState['status']; body: HTMLElement }) {
  useUnlockFocus(status, body);
  return null;
}

function nextFrame() {
  return act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
}

describe('useReturnFocus', () => {
  it('focuses the fallback once a frame passes without a button after the mode ends', async () => {
    const fallback = document.createElement('div');
    fallback.tabIndex = 0;
    document.body.append(fallback);
    const view = render(<ReturnFocus active withButton={false} fallback={fallback} />);

    view.rerender(<ReturnFocus active={false} withButton={false} fallback={fallback} />);
    expect(fallback).not.toHaveFocus();
    await nextFrame();
    expect(fallback).toHaveFocus();
    fallback.remove();
  });

  it('leaves focus to the button when it comes back before the frame', async () => {
    const fallback = document.createElement('div');
    fallback.tabIndex = 0;
    document.body.append(fallback);
    const view = render(<ReturnFocus active withButton fallback={fallback} />);

    view.rerender(<ReturnFocus active={false} withButton fallback={fallback} />);
    await nextFrame();
    expect(document.querySelector('button')).toHaveFocus();
    expect(fallback).not.toHaveFocus();
    fallback.remove();
  });

  it('leaves the fallback alone when the button arrives within the frame', async () => {
    const fallback = document.createElement('div');
    fallback.tabIndex = 0;
    document.body.append(fallback);
    const view = render(<ReturnFocus active withButton={false} fallback={fallback} />);

    view.rerender(<ReturnFocus active={false} withButton={false} fallback={fallback} />);
    view.rerender(<ReturnFocus active={false} withButton fallback={fallback} />);
    await nextFrame();
    expect(document.querySelector('button')).toHaveFocus();
    expect(fallback).not.toHaveFocus();
    fallback.remove();
  });

  it('keeps focus the reader moved elsewhere', async () => {
    const fallback = document.createElement('div');
    fallback.tabIndex = 0;
    const other = document.createElement('input');
    document.body.append(fallback, other);
    const view = render(<ReturnFocus active withButton={false} fallback={fallback} />);

    view.rerender(<ReturnFocus active={false} withButton={false} fallback={fallback} />);
    other.focus();
    await nextFrame();
    expect(other).toHaveFocus();
    fallback.remove();
    other.remove();
  });
});

describe('useUnlockFocus', () => {
  it('focuses the scroll area once an unlocked document is ready', () => {
    const body = document.createElement('div');
    body.tabIndex = 0;
    document.body.append(body);
    const view = render(<Locked status="password" body={body} />);

    view.rerender(<Locked status="loading" body={body} />);
    view.rerender(<Locked status="ready" body={body} />);
    expect(body).toHaveFocus();
    body.remove();
  });

  it('leaves focus alone for a document that was never locked', () => {
    const body = document.createElement('div');
    body.tabIndex = 0;
    document.body.append(body);
    const view = render(<Locked status="loading" body={body} />);

    view.rerender(<Locked status="ready" body={body} />);
    expect(body).not.toHaveFocus();
    body.remove();
  });

  it('starts over after a wrong password', () => {
    const body = document.createElement('div');
    body.tabIndex = 0;
    document.body.append(body);
    const view = render(<Locked status="password" body={body} />);

    view.rerender(<Locked status="loading" body={body} />);
    view.rerender(<Locked status="password" body={body} />);
    view.rerender(<Locked status="ready" body={body} />);
    expect(body).not.toHaveFocus();
    body.remove();
  });
});
