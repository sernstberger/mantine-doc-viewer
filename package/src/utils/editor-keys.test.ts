import { getEditorKeyAction } from './editor-keys';

describe('getEditorKeyAction', () => {
  it.each([
    ['ArrowLeft', 'focus', -1],
    ['ArrowUp', 'focus', -1],
    ['ArrowRight', 'focus', 1],
    ['ArrowDown', 'focus', 1],
    ['Home', 'focusFirst', 1],
    ['End', 'focusLast', 1],
    [' ', 'toggle', 1],
    ['Delete', 'remove', 1],
    ['Backspace', 'remove', 1],
    ['Escape', 'escape', 1],
    ['r', 'rotate', 1],
    ['R', 'rotate', 1],
  ])('maps %j to %s', (key, action, step) => {
    expect(getEditorKeyAction({ key })).toEqual({ action, step });
  });

  it('moves pages with Alt and an arrow', () => {
    expect(getEditorKeyAction({ key: 'ArrowLeft', altKey: true })).toEqual({
      action: 'move',
      step: -1,
    });
    expect(getEditorKeyAction({ key: 'ArrowDown', altKey: true })).toEqual({
      action: 'move',
      step: 1,
    });
  });

  it('selects all only with Ctrl or Cmd', () => {
    expect(getEditorKeyAction({ key: 'a' })).toBeNull();
    expect(getEditorKeyAction({ key: 'A', ctrlKey: true })).toEqual({
      action: 'selectAll',
      step: 1,
    });
    expect(getEditorKeyAction({ key: 'a', metaKey: true })).toEqual({
      action: 'selectAll',
      step: 1,
    });
  });

  it('leaves Ctrl/Cmd+R to the browser', () => {
    expect(getEditorKeyAction({ key: 'r', ctrlKey: true })).toBeNull();
    expect(getEditorKeyAction({ key: 'r', metaKey: true })).toBeNull();
    expect(getEditorKeyAction({ key: 'r', altKey: true })).toEqual({ action: 'rotate', step: 1 });
  });

  it('ignores other keys', () => {
    expect(getEditorKeyAction({ key: 'x' })).toBeNull();
    expect(getEditorKeyAction({ key: 'Enter' })).toBeNull();
  });

  it('swaps the horizontal arrows in a right-to-left page order, keeps the vertical ones', () => {
    expect(getEditorKeyAction({ key: 'ArrowRight' }, true)).toEqual({ action: 'focus', step: -1 });
    expect(getEditorKeyAction({ key: 'ArrowLeft' }, true)).toEqual({ action: 'focus', step: 1 });
    expect(getEditorKeyAction({ key: 'ArrowRight', altKey: true }, true)).toEqual({
      action: 'move',
      step: -1,
    });
    expect(getEditorKeyAction({ key: 'ArrowUp' }, true)).toEqual({ action: 'focus', step: -1 });
    expect(getEditorKeyAction({ key: 'ArrowDown' }, true)).toEqual({ action: 'focus', step: 1 });
    expect(getEditorKeyAction({ key: 'Home' }, true)).toEqual({ action: 'focusFirst', step: 1 });
  });
});
