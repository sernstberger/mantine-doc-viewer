import { DOC_VIEWER_SIZES } from './sizes';

describe('DOC_VIEWER_SIZES', () => {
  it('has a size config for each size', () => {
    expect(Object.keys(DOC_VIEWER_SIZES)).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  });
});
