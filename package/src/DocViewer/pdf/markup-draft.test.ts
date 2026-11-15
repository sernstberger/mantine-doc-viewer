import { TEXT_LINE_HEIGHT } from './markup';
import { getFontStyle, isStrokeTool, makeMark } from './markup-draft';

const points: [number, number][] = [
  [10, 20],
  [30, 50],
];

describe('markup-draft', () => {
  it('tells stroke tools from box tools', () => {
    expect(isStrokeTool('pen')).toBe(true);
    expect(isStrokeTool('signature')).toBe(true);
    expect(isStrokeTool('highlight')).toBe(false);
    expect(isStrokeTool(null)).toBe(false);
  });

  it('makes a stroke mark from the points', () => {
    expect(makeMark('pen', 'a', 2, 'red', 3, points)).toEqual({
      type: 'pen',
      id: 'a',
      page: 2,
      color: 'red',
      width: 3,
      strokes: [points],
    });
    expect(makeMark('signature', 'a', 1, 'red', 3, points).type).toBe('signature');
  });

  it('makes a highlight without a line width', () => {
    expect(makeMark('highlight', 'draft', 1, 'yellow', 3, points)).toEqual({
      type: 'highlight',
      id: 'draft',
      page: 1,
      color: 'yellow',
      rect: { x: 10, y: 20, width: 20, height: 30 },
    });
  });

  it('makes a shape mark with a line width', () => {
    expect(makeMark('cloud', 'b', 1, 'red', 3, points)).toMatchObject({
      type: 'cloud',
      width: 3,
      rect: { x: 10, y: 20, width: 20, height: 30 },
    });
  });

  it('scales the font style', () => {
    expect(getFontStyle(10, 'red', 2)).toEqual({
      fontSize: 20,
      lineHeight: TEXT_LINE_HEIGHT,
      color: 'red',
    });
  });
});
