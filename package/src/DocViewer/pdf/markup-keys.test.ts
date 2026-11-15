import { getMarkupKeyAction, MARKUP_KEY_STEP, toPageDelta } from './markup-keys';

const state = {
  tool: 'rectangle' as const,
  caret: [100, 100] as [number, number],
  draft: null,
  width: 200,
  height: 300,
  rotation: 0 as const,
};

describe('getMarkupKeyAction', () => {
  it('moves the cursor with the arrow keys, inside the page', () => {
    expect(getMarkupKeyAction({ key: 'ArrowRight' }, state)).toEqual({
      type: 'move',
      caret: [100 + MARKUP_KEY_STEP, 100],
      draft: null,
    });
    expect(getMarkupKeyAction({ key: 'ArrowUp' }, { ...state, caret: [0, 4] })).toEqual({
      type: 'move',
      caret: [0, 0],
      draft: null,
    });
    expect(getMarkupKeyAction({ key: 'ArrowDown' }, { ...state, caret: [200, 296] })).toEqual({
      type: 'move',
      caret: [200, 300],
      draft: null,
    });
  });

  it('moves the far corner of a box and adds points to a stroke', () => {
    const box = getMarkupKeyAction({ key: 'ArrowLeft' }, { ...state, draft: [[100, 100]] });
    expect(box).toEqual({
      type: 'move',
      caret: [90, 100],
      draft: [
        [100, 100],
        [90, 100],
      ],
    });
    const pen = getMarkupKeyAction(
      { key: 'ArrowDown' },
      {
        ...state,
        tool: 'pen',
        draft: [
          [100, 90],
          [100, 100],
        ],
      }
    );
    expect(pen).toMatchObject({
      draft: [
        [100, 90],
        [100, 100],
        [100, 110],
      ],
    });
  });

  it('starts a mark at the cursor with Shift+arrow, except for text', () => {
    expect(getMarkupKeyAction({ key: 'ArrowRight', shiftKey: true }, state)).toMatchObject({
      draft: [
        [100, 100],
        [110, 100],
      ],
    });
    expect(
      getMarkupKeyAction({ key: 'ArrowRight', shiftKey: true }, { ...state, tool: 'text' })
    ).toMatchObject({ draft: null });
  });

  it('follows the rotation of the page on screen', () => {
    expect(toPageDelta([1, 0], 90)).toEqual([0, -1]);
    expect(toPageDelta([0, 1], 180)).toEqual([0, -1]);
    expect(toPageDelta([1, 0], 270)).toEqual([0, 1]);
  });

  it('starts, finishes and cancels marks, and opens text boxes', () => {
    expect(getMarkupKeyAction({ key: 'Enter' }, state)).toEqual({ type: 'start' });
    expect(getMarkupKeyAction({ key: ' ' }, { ...state, draft: [[1, 1]] })).toEqual({
      type: 'finish',
    });
    expect(getMarkupKeyAction({ key: 'Escape' }, { ...state, draft: [[1, 1]] })).toEqual({
      type: 'cancel',
    });
    expect(getMarkupKeyAction({ key: 'Enter' }, { ...state, tool: 'text' })).toEqual({
      type: 'text',
    });
  });

  it('leaves other keys alone', () => {
    expect(getMarkupKeyAction({ key: 'Escape' }, state)).toBeNull();
    expect(getMarkupKeyAction({ key: 'a' }, state)).toBeNull();
    expect(getMarkupKeyAction({ key: 'ArrowRight', altKey: true }, state)).toBeNull();
    expect(getMarkupKeyAction({ key: 'Enter', ctrlKey: true }, state)).toBeNull();
    expect(getMarkupKeyAction({ key: 'Enter', metaKey: true }, state)).toBeNull();
  });
});
